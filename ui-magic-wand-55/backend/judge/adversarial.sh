#!/usr/bin/env bash
#
# Adversarial submission suite -- SODAK-TECH-DESIGN.md §8.6, which calls this
# "the highest-leverage test suite in the project".
#
# Every case here asserts a *containment* property, not a correctness one. The
# question each asks is not "did the judge compute the right answer" but "did
# the platform survive, and did it name what happened honestly". A submission
# that escapes is a breach; a submission reported as `internal_error` when it
# was really the user's own fork bomb is a lie that teaches them nothing.
#
# SODAK-TECH-STACK.md §5.5 requires this to gate every judge image promotion.
# Run it after any change to judge/, apps/judging/, or the sandbox image:
#
#     ./judge/adversarial.sh
#     API=http://localhost:8081/api/v1 ./judge/adversarial.sh
#
# Requires: a running stack, a published problem, and an account to submit as.
set -u

API="${API:-http://localhost:8081/api/v1}"
EMAIL="${SODAK_EMAIL:-a.rithiksharma@gmail.com}"
PASSWORD="${SODAK_PASSWORD:?set SODAK_PASSWORD}"
PROBLEM="${SODAK_PROBLEM:-two-sum}"
ORIGIN="${ORIGIN:-http://localhost:5173}"

JAR="$(mktemp)"
trap 'rm -f "$JAR"' EXIT

pass=0
fail=0

tok() { awk '$6=="csrftoken"{print $7}' "$JAR" | tail -1; }
post() {
  curl -s -b "$JAR" -c "$JAR" -H "X-CSRFToken: $(tok)" -H "Content-Type: application/json" \
       -H "Origin: $ORIGIN" -H "Referer: $ORIGIN/" -d "$2" "$API$1"
}
get() { curl -s -b "$JAR" -c "$JAR" "$API$1"; }

curl -s -c "$JAR" "$API/auth/csrf/" > /dev/null
if ! post /auth/login/ "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | grep -q '"id"'; then
  echo "Could not sign in as $EMAIL." >&2
  exit 1
fi

# check <label> <language> <json-quoted-source> <expected-verdict-regex>
check() {
  local label="$1" lang="$2" src="$3" want="$4"
  local body id verdict elapsed=0

  body=$(post /submissions/create/ \
    "{\"problem_slug\":\"$PROBLEM\",\"language\":\"$lang\",\"source_code\":$src}")
  id=$(printf '%s' "$body" | python -c "import sys,json;print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

  if [ -z "$id" ]; then
    printf '  %-22s FAIL  rejected at the API: %s\n' "$label" "$(printf '%s' "$body" | cut -c1-90)"
    fail=$((fail+1)); return
  fi

  while [ "$elapsed" -lt 120 ]; do
    verdict=$(get "/submissions/$id/status/" | python -c \
      "import sys,json;d=json.load(sys.stdin);print(d['verdict'] if d.get('is_terminal') else '')" 2>/dev/null)
    [ -n "$verdict" ] && break
    sleep 2; elapsed=$((elapsed+2))
  done
  [ -z "$verdict" ] && verdict="never-terminal-after-${elapsed}s"

  if printf '%s' "$verdict" | grep -qE "$want"; then
    printf '  %-22s PASS  %s\n' "$label" "$verdict"
    pass=$((pass+1))
  else
    printf '  %-22s FAIL  got %s, want %s\n' "$label" "$verdict" "$want"
    fail=$((fail+1))
  fi
}

echo "Judging correctness"
check "accepted solution" python \
  '"import sys\ndata=sys.stdin.read().split()\nn=int(data[0]);t=int(data[1])\nnums=[int(x) for x in data[2:2+n]]\nseen={}\nfor i,v in enumerate(nums):\n    if t-v in seen:\n        print(seen[t-v],i); break\n    seen[v]=i\n"' \
  '^accepted$'
check "wrong answer" python '"print(42)"' '^wrong_answer$'
check "compile error" cpp '"int main(){ not valid c++ }"' '^compile_error$'

echo
echo "Containment"
# Each must produce a verdict naming what happened. `internal_error` is a
# failure here even though the platform survived: it means the judge could not
# account for the outcome.
check "process exhaustion" python '"import os\nwhile True:\n    os.fork()\n"' \
  '^(runtime_error|memory_limit_exceeded|time_limit_exceeded)$'
check "memory exhaustion" python '"x=[]\nwhile True:\n    x.append(bytearray(10*1024*1024))\n"' \
  '^(memory_limit_exceeded|runtime_error)$'
check "unbounded cpu" python '"while True:\n    pass\n"' '^time_limit_exceeded$'
check "unbounded output" python '"while True:\n    print(\"A\"*4096)\n"' \
  '^(output_limit_exceeded|time_limit_exceeded)$'
check "network egress" python \
  '"import socket\ns=socket.create_connection((\"1.1.1.1\",80),timeout=5)\nprint(\"ESCAPED\")\n"' \
  '^runtime_error$'
check "database reachability" python \
  '"import socket\ns=socket.create_connection((\"pgbouncer\",5432),timeout=5)\nprint(\"ESCAPED\")\n"' \
  '^runtime_error$'
check "filesystem read" python '"print(open(\"/etc/shadow\").read())"' '^runtime_error$'
check "filesystem write" python '"open(\"/usr/local/pwned\",\"w\").write(\"x\")"' '^runtime_error$'
check "runtime socket" python '"print(open(\"/var/run/docker.sock\").read())"' '^runtime_error$'
# Not runtime_error: reading the environment is allowed, there is simply
# nothing in it. The assertion is that the program runs and finds no secrets.
check "credential exposure" python \
  '"import os\nleaked=[k for k in os.environ if any(w in k.upper() for w in (\"URL\",\"SECRET\",\"PASS\",\"KEY\",\"TOKEN\"))]\nprint(leaked)\nassert not leaked, leaked\n"' \
  '^wrong_answer$'

echo
echo "  $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
