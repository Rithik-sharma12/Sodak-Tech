"""Executes one submission against its test cases. Runs inside the sandbox.

This is Zone 3 (SODAK-TECH-DESIGN.md §3.1). What that means concretely, and
what the code below is allowed to assume:

  * There are no credentials here. No database URL, no object storage key, no
    API token. A full escape from this process lands in a container with an
    empty environment.
  * There is no network. The container is created with networking disabled, so
    there is no route to the database, the cache, or the internet -- not a
    firewall rule that can be misconfigured, an absent interface.
  * **Expected output never arrives here.** The job carries inputs only. This
    process reports what the program printed; the application core decides
    whether that is correct (§8.1: "expected output never leaves the
    application core"). Nothing submitted can read the answers, because the
    answers are not in this address space.
  * The filesystem is read-only apart from a small tmpfs working directory.

Protocol: a job as JSON on this process's stdin, results as JSON on stdout.
Anything written to stderr is diagnostic and is not shown to the learner.

Stdin rather than a file because the container's root filesystem is read-only,
which the runtime enforces against writes from outside as well -- there is no
way to place a file in it before the process starts. The job is read in full
before any submitted code runs, so the two never contend for the stream.
"""

from __future__ import annotations

import json
import os
import resource
import subprocess  # noqa: S404 -- executing untrusted code is this file's job
import sys
import time
from pathlib import Path

WORKDIR = Path("/box")

# §7.1: unbounded output is a containment failure in its own right -- a program
# printing an infinite stream will fill a disk or exhaust the reader's memory.
MAX_OUTPUT_BYTES = 64 * 1024
MAX_COMPILE_OUTPUT = 8 * 1024

# Compilation is bounded separately from execution. A pathological template
# expansion can occupy a compiler for minutes.
COMPILE_TIMEOUT_SECONDS = 20
COMPILE_MEMORY_BYTES = 1024 * 1024 * 1024

# A linked binary is legitimately much larger than a program's allowed output,
# so compilation gets its own file-size ceiling.
COMPILE_FSIZE_BYTES = 128 * 1024 * 1024

# Ceiling on concurrent processes. Low enough that a fork bomb hits it almost
# immediately, high enough for a compiler driver and a JVM's threads.
MAX_PROCESSES = 256

# Wall-clock is measured on top of the CPU limit because a program that sleeps
# or blocks on stdin burns no CPU and would otherwise never be stopped.
WALL_CLOCK_GRACE_SECONDS = 2.0


def limiter(
    cpu_seconds: int,
    memory_bytes: int,
    use_address_space_rlimit: bool,
    file_size_bytes: int,
):
    """Build the preexec hook applied between fork and exec.

    These are the kernel's own ceilings, enforced regardless of what the
    program does after it starts. They are the second boundary: the container
    is the first.
    """

    def apply() -> None:
        # A hard limit one second above the soft one means the process gets
        # SIGXCPU first and can be identified as a timeout rather than a kill.
        resource.setrlimit(resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds + 1))
        resource.setrlimit(resource.RLIMIT_NPROC, (MAX_PROCESSES, MAX_PROCESSES))
        # Bounds output at the kernel: stdout is a file, so a program printing
        # forever hits this and takes SIGXFSZ. Buffering it in this process
        # instead would let a flood exhaust the container's memory and take the
        # runner down with it, which reports as an infrastructure failure
        # rather than as the submission's own fault.
        resource.setrlimit(resource.RLIMIT_FSIZE, (file_size_bytes, file_size_bytes))
        # No core dumps: they are large, they are slow, and they can contain
        # whatever the process had in memory.
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
        if use_address_space_rlimit:
            resource.setrlimit(resource.RLIMIT_AS, (memory_bytes, memory_bytes))
        # Detach from the parent's process group so a timeout can kill the
        # whole tree, not just the process that was waited on.
        os.setsid()

    return apply


def read_capped(path: Path, limit: int) -> str:
    try:
        with path.open("rb") as handle:
            return handle.read(limit).decode("utf-8", errors="replace")
    except OSError:
        return ""


def compile_source(compile_cmd: list[str]) -> tuple[bool, str]:
    if not compile_cmd:
        return True, ""

    try:
        proc = subprocess.run(  # noqa: S603 -- fixed argv from the language registry
            compile_cmd,
            cwd=WORKDIR,
            capture_output=True,
            text=True,
            errors="replace",
            timeout=COMPILE_TIMEOUT_SECONDS,
            # A compiler legitimately writes a binary far larger than a
            # program's allowed output, so its file-size ceiling is separate.
            preexec_fn=limiter(  # noqa: PLW1509
                COMPILE_TIMEOUT_SECONDS, COMPILE_MEMORY_BYTES, True, COMPILE_FSIZE_BYTES
            ),
            env={"PATH": "/usr/local/bin:/usr/bin:/bin", "HOME": str(WORKDIR)},
        )
    except subprocess.TimeoutExpired:
        return False, f"Compilation exceeded {COMPILE_TIMEOUT_SECONDS}s and was stopped."
    except OSError as exc:
        return False, f"Compiler could not be started: {exc}"

    output = (proc.stderr or proc.stdout or "")[:MAX_COMPILE_OUTPUT]
    return proc.returncode == 0, output


def run_case(
    run_cmd: list[str],
    stdin_data: str,
    time_limit_ms: int,
    memory_bytes: int,
    use_address_space_rlimit: bool,
) -> dict:
    """Run the program once. Reports what happened; judges nothing."""
    cpu_seconds = max(1, -(-time_limit_ms // 1000))
    wall_timeout = (time_limit_ms / 1000.0) + WALL_CLOCK_GRACE_SECONDS

    # stdin, stdout and stderr are all files rather than pipes. Pipes would
    # make this process the buffer for whatever the program emits, so an
    # unbounded printer would exhaust the runner's own memory -- which presents
    # as the judge failing rather than as the submission failing. Files put the
    # ceiling in the kernel via RLIMIT_FSIZE instead.
    stdin_path = WORKDIR / ".stdin"
    stdout_path = WORKDIR / ".stdout"
    stderr_path = WORKDIR / ".stderr"
    stdin_path.write_text(stdin_data, encoding="utf-8")

    before = resource.getrusage(resource.RUSAGE_CHILDREN)
    started = time.monotonic()
    timed_out = False

    try:
        with (
            stdin_path.open("rb") as fin,
            stdout_path.open("wb") as fout,
            stderr_path.open("wb") as ferr,
        ):
            proc = subprocess.Popen(  # noqa: S603 -- fixed argv from the registry
                run_cmd,
                cwd=WORKDIR,
                stdin=fin,
                stdout=fout,
                stderr=ferr,
                preexec_fn=limiter(  # noqa: PLW1509
                    cpu_seconds, memory_bytes, use_address_space_rlimit, MAX_OUTPUT_BYTES
                ),
                env={"PATH": "/usr/local/bin:/usr/bin:/bin", "HOME": str(WORKDIR)},
            )
            try:
                proc.wait(timeout=wall_timeout)
            except subprocess.TimeoutExpired:
                timed_out = True
                # The child called setsid(), so the whole tree is one process
                # group. Killing the group rather than the pid is what stops a
                # program that forked before blocking.
                try:
                    os.killpg(proc.pid, __import__("signal").SIGKILL)
                except OSError:
                    proc.kill()
                proc.wait(timeout=5)
    except OSError as exc:
        return {
            "status": "internal_error",
            "stdout": "",
            "stderr": f"Could not start the program: {exc}",
            "runtime_ms": 0,
            "memory_kb": 0,
            "exit_code": None,
        }

    wall_ms = int((time.monotonic() - started) * 1000)
    after = resource.getrusage(resource.RUSAGE_CHILDREN)

    stdout_bytes = stdout_path.stat().st_size if stdout_path.exists() else 0
    stdout_text = read_capped(stdout_path, MAX_OUTPUT_BYTES)
    stderr_text = read_capped(stderr_path, MAX_COMPILE_OUTPUT)

    for path in (stdin_path, stdout_path, stderr_path):
        path.unlink(missing_ok=True)

    if timed_out:
        return {
            "status": "time_limit_exceeded",
            "stdout": stdout_text,
            "stderr": "",
            "runtime_ms": int(wall_timeout * 1000),
            "memory_kb": 0,
            "exit_code": None,
        }

    # §7.1 wants CPU time, not wall clock: wall clock on a loaded judge host
    # turns the time limit into a lottery. Wall clock is the fallback when the
    # accounting delta is unusable.
    cpu_ms = int(
        (
            (after.ru_utime - before.ru_utime)
            + (after.ru_stime - before.ru_stime)
        )
        * 1000
    )
    runtime_ms = cpu_ms if cpu_ms > 0 else wall_ms
    memory_kb = max(0, after.ru_maxrss - before.ru_maxrss)

    returncode = proc.returncode
    signals = __import__("signal")

    # SIGXFSZ means the program blew through RLIMIT_FSIZE, which for stdout on
    # a file means it printed more than it is allowed to. §7.1 gives that its
    # own verdict rather than folding it into a generic runtime error.
    if returncode == -int(getattr(signals, "SIGXFSZ", 25)) or stdout_bytes >= MAX_OUTPUT_BYTES:
        status = "output_limit_exceeded"
    elif returncode == -int(getattr(signals, "SIGXCPU", 24)):
        status = "time_limit_exceeded"
    elif runtime_ms > time_limit_ms:
        status = "time_limit_exceeded"
    elif returncode == 0:
        status = "ok"
    elif returncode < 0:
        # Killed by a signal. SIGKILL here is almost always the cgroup OOM
        # killer, which is how an over-limit allocation presents.
        status = "memory_limit_exceeded" if returncode == -9 else "runtime_error"
    else:
        status = "runtime_error"

    return {
        "status": status,
        "stdout": stdout_text,
        "stderr": stderr_text,
        "runtime_ms": runtime_ms,
        "memory_kb": memory_kb,
        "exit_code": returncode,
    }


def main() -> int:
    # Read the job to EOF before anything else. Submitted code gets its own
    # stdin from the pipe set up per case, so this stream is finished with by
    # the time any of it runs.
    raw = sys.stdin.read()
    if not raw.strip():
        json.dump({"error": "no job received on stdin"}, sys.stdout)
        return 2

    try:
        job = json.loads(raw)
    except json.JSONDecodeError as exc:
        json.dump({"error": f"malformed job: {exc}"}, sys.stdout)
        return 2

    source: str = job["source"]
    filename: str = job["filename"]
    compile_cmd: list[str] = job.get("compile_cmd") or []
    run_cmd: list[str] = job["run_cmd"]
    time_limit_ms: int = int(job.get("time_limit_ms", 1000))
    memory_bytes: int = int(job.get("memory_limit_mb", 256)) * 1024 * 1024
    use_as_rlimit: bool = bool(job.get("use_address_space_rlimit", True))
    cases: list[dict] = job.get("cases", [])

    WORKDIR.mkdir(parents=True, exist_ok=True)
    (WORKDIR / filename).write_text(source, encoding="utf-8")

    compiled, compile_output = compile_source(compile_cmd)
    if not compiled:
        json.dump(
            {
                "compiled": False,
                "compile_output": compile_output or "Compilation failed.",
                "cases": [],
            },
            sys.stdout,
        )
        return 0

    results = []
    for case in cases:
        outcome = run_case(
            run_cmd,
            case.get("input", ""),
            time_limit_ms,
            memory_bytes,
            use_as_rlimit,
        )
        outcome["id"] = case.get("id")
        results.append(outcome)

        # A program that cannot start will not start for case 40 either, and
        # every attempt costs a worker slot.
        if outcome["status"] == "internal_error":
            break

    json.dump(
        {"compiled": True, "compile_output": compile_output, "cases": results}, sys.stdout
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
