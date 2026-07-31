# Sodak-Tech — Platform Design

Competitive programming practice and contest platform. Learners solve problems in a browser editor, submit code for automated judging against hidden test cases, receive scored verdicts, track progress, and compete in timed contests.

Built as a fork of the QingdaoU OnlineJudge project (MIT). This document specifies the design, not the implementation.

---

## 1. Scope

**In scope**
- Problem bank with tags, difficulty, versioned test data
- Browser editor with Run (sample tests) and Submit (all tests)
- Asynchronous sandboxed judging with per-test feedback
- Weighted scoring and verdict reporting
- Progress tracking: solved state, per-tag skill breakdown, submission history
- Curated problem lists as learning tracks
- Editorials with server-enforced unlock rules
- Timed contests with live leaderboards, freeze, and finalization
- Contest rating as the primary progression signal
- Privileged admin panel with role-based CRUD across the platform

**Explicitly out of scope**
- Courses, modules, lessons, prerequisite graphs
- Cohorts, assignments, deadlines outside contests, gradebooks
- Any learning-management structure above the problem level

Progression is delivered through problem lists and rating, not curriculum.

---

## 2. Design Principles

1. **The server is the only authority.** Scores, timestamps, unlock state, contest state, and permissions are computed and enforced server-side. The client is a rendering layer that can lie about anything.
2. **All learner code is hostile code.** Design as if a competent attacker is a registered user, because eventually one is.
3. **Trust zones are physically separated.** The machine that runs untrusted code holds no secrets and has no path to the database.
4. **Store raw facts, compute derived values.** Persist which tests passed. Compute score from a versioned rubric. A stored final score that cannot be recomputed is unrecoverable when the rubric is wrong.
5. **Content is versioned data.** Problems, test sets, and rubrics carry versions. Every submission pins the version it was judged against.
6. **Rejudge is a first-class operation**, not an emergency script. A wrong test case will ship.
7. **Idempotent and resumable.** Double submissions, dropped connections, and crashed workers are the normal case.
8. **Least privilege at every layer**, and assume every layer eventually fails.
9. **Every privileged action is auditable.** Admin capability without an audit trail is indistinguishable from compromise.
10. **Fail closed.** If the sandbox cannot be verified as configured, reject the submission rather than run it.

---

## 3. Architecture

### 3.1 Trust zones

| Zone | Contains | Holds secrets | Network |
|---|---|---|---|
| **Zone 1 — Client** | Browser, editor, admin panel UI | No | Public |
| **Zone 2 — Application core** | API, database, cache, queue, object storage | Yes | Private, egress controlled |
| **Zone 3 — Judge workers** | Sandbox runners, language runtimes | **No** | **None** |

**The binding rule:** Zone 3 never connects to the database. Workers receive source code and test data inside the job payload and return only a verdict, authenticated by a short-lived, single-purpose token scoped to that one submission. A sandbox escape lands the attacker in an empty machine with no credentials and no network route.

### 3.2 Submission flow

1. Client submits code with an idempotency key.
2. API validates size, rate limit, and in-flight cap; persists the submission as pending; enqueues a job.
3. Worker claims the job, compiles if required, and runs each test group inside the sandbox.
4. Worker returns per-test verdicts, runtime, and memory.
5. API computes score from the pinned rubric, updates progress, and pushes the result to the client.

Run and Submit share this pipeline. Run executes sample tests only; Submit executes all test groups.

### 3.3 Core domain

| Entity | Purpose |
|---|---|
| Users | Identity, role, rating |
| Problems | Statement, tags, difficulty, current version |
| Problem versions | Immutable snapshot of limits and test set |
| Test groups | Weighted, named groups of test cases; sample or hidden |
| Submissions | Source, language, pinned problem version, verdict, optional contest reference |
| Submission results | Per-test-group verdict, runtime, memory |
| Progress | Per user per problem: state, best score, attempts, first solve, editorial view |
| Problem lists | Ordered curated tracks |
| Editorials | Solution content with an unlock policy |
| Contests | Lifecycle state, mode, timing window, freeze point |
| Contest problems | Pinned problem versions with contest labels |
| Registrations | Participation status per contest |
| Audit log | Append-only record of every privileged action |

Progress must be a normalized table with a unique constraint on (user, problem) — not a serialized blob on the user record. Blob storage cannot be indexed, cannot be aggregated by tag without loading every user, and loses concurrent updates silently.

### 3.4 Roles

| Role | Grants | Denied |
|---|---|---|
| **Super Admin** | All capabilities, role assignment, system config, judge server management, audit log access | Modifying or deleting audit entries |
| **Admin** | All problems and contests, user management, announcements, rejudge | Role assignment, system config, judge servers |
| **Contest Manager** | Contest CRUD and lifecycle, clarifications, standings adjustment, rejudge within own contests | User management, problems outside own contests |
| **Problem Setter** | CRUD on own problems, test data upload, editorials | User management, contests, other setters' problems |
| **User** | Solve, submit, register, view unlocked editorials | All of the above |

Roles are additive and checked server-side per resource. Hiding a control in the UI is not access control.

### 3.5 Scoring

Score is a pure function of stored results:

```
raw    = sum(weight of fully-passed test groups) / sum(all weights)
final  = raw × editorial_multiplier × hint_multiplier
```

Partial credit is awarded per test group, not per individual test — group weights encode meaning ("handles empty input") rather than an arbitrary fraction.

**Mastery is tracked separately from score.** A problem solved after viewing the editorial produces a score but not mastery. Mastery requires an unaided solve.

Attempt penalties are omitted in practice mode. Punishing iteration teaches the wrong lesson on a learning platform. Contests apply penalties according to their scoring mode.

### 3.6 Editorial gating

Unlocked when any condition holds, evaluated server-side on every fetch:
- The user has an accepted submission, or
- The user has made N genuine attempts (compiled and ran; empty submissions do not count), or
- A cooldown has elapsed since first attempt, or
- An admin has released editorials for the problem

Editorial content must never appear in the response for a locked problem. It is served from a dedicated endpoint that performs its own authorization and returns a denial otherwise. Shipping the content and hiding it client-side is not gating.

The unlock event is recorded before content is returned.

### 3.7 Contest lifecycle

`Draft → Published → Running → Frozen → Ended → Provisional → Final`

Plus an out-of-band **Paused** state, enterable from Running or Frozen by an admin, which stops the clock and blocks submissions. Without it, the only options during a bad-test-case incident are to continue with a broken problem or cancel.

| State | Meaning |
|---|---|
| Draft | Authoring; invisible to users |
| Published | Visible; registration open; problems still hidden |
| Running | Submissions accepted; live leaderboard |
| Frozen | Still running; public leaderboard stops updating |
| Ended | Submissions closed; judge queue draining |
| Provisional | Standings computed; appeal window open |
| Final | Standings locked; editorials released |

Lifecycle transitions are explicit operations, never direct field edits. Each writes an audit entry.

**Scoring modes**

| Mode | Ranking |
|---|---|
| Partial (default) | Sum of best score per problem; ties broken by time to reach that score; no penalty |
| ICPC | Problems solved, then penalty = elapsed minutes to each solve + fixed penalty per wrong attempt on solved problems |

---

## 4. Delivery Phases

### Phase 0 — Harden the fork
Non-negotiable, before any public exposure. Dependency upgrade and vulnerability audit; archive extraction hardening; restriction of custom-checker authoring; enforced multi-factor authentication for privileged roles; verified sandbox isolation.

### Phase 1 — Practice platform
Authentication and profiles; problem bank with tags, difficulty, and versioned test groups; editor with Run and Submit; asynchronous judging on isolated workers; per-test feedback; submission history; normalized progress with per-tag breakdown; editorial gating; audit log and the role model.

### Phase 2 — Contests
Contest lifecycle state machine; pinned problem versions; both scoring modes; live leaderboard with freeze; dedicated priority queue lane and reserved worker capacity; clarifications; provisional-to-final workflow with an appeal window.

### Phase 3 — Progression and community
Problem lists; rating system; virtual participation on past contests; community discussion; submission similarity analysis; activity streaks.

**Hard dependency:** Phase 2 requires the priority queue lane in place before the first real contest. Phase 1's judge must be uneventful before contests are attempted — a judge defect in practice is an annoyance, the same defect in a contest is a public fairness incident.

---

## 5. Containerization Design

### 5.1 The governing constraint

The sandbox requires kernel-level control: seccomp filter installation, process tracing, and fine-grained resource accounting. This demands either elevated container privileges, added capabilities, or a custom security profile.

**Consequence:** judge workers cannot run on serverless container platforms. They require virtual machines or cluster nodes whose kernel and container runtime are under your control. The stateless application tier has no such constraint.

The deployment therefore splits along the same trust boundary as the design.

### 5.2 Image structure

| Image | Role | Privilege |
|---|---|---|
| Frontend | Static assets | None |
| API | Application logic | None |
| Worker runner | Claims jobs, orchestrates sandbox execution | Elevated, node-resident |
| Language runtime (one per language) | Compilation and execution environment | Executes inside the sandbox |

**Rules**
- Every image pinned by digest, never by mutable tag. "Latest compiler" causes silent drift in reference timings.
- One image per language, version-pinned. Language version is displayed to users and recorded on the submission.
- The runner image stays thin; language images carry the toolchains.
- **The container runtime socket is never exposed to any container reachable by untrusted code.** Access to it is equivalent to host root and is the most common way self-built judges are compromised.
- Images are built in CI, vulnerability-scanned, signed, and rebuilt on a schedule so runtime advisories do not accumulate.
- Language images are promoted only after passing the adversarial suite (Section 9.6).

### 5.3 Composition

The upstream single-host composition is suitable for local evaluation only. Production requires decomposition: managed database, managed cache, managed queue, and judge workers relocated to a dedicated, network-isolated pool.

**Decompose before adding features.** Retrofitting the trust boundary after code depends on single-host assumptions is substantially harder.

---

## 6. Cloud Deployment

Both providers are viable. The architecture is identical; only service names differ.

| Layer | AWS | Azure |
|---|---|---|
| Static frontend | S3 + CloudFront | Blob static site + Front Door |
| Edge protection | WAF on ALB | WAF on Application Gateway |
| API tier | ECS Fargate or EKS | Container Apps or AKS |
| Database | RDS PostgreSQL, Multi-AZ | Database for PostgreSQL Flexible Server |
| Cache and leaderboard | ElastiCache | Cache for Redis |
| Object storage | S3, encrypted at rest | Blob Storage, encrypted at rest |
| Queue | SQS (visibility timeout, dead-letter) | Service Bus (lock duration, dead-letter) |
| **Judge workers** | **EC2 Auto Scaling Group** | **AKS tainted node pool or VM Scale Set** |
| Image registry | ECR | ACR |
| Secrets | Secrets Manager | Key Vault |
| Autoscaling signal | Queue depth per instance | Queue length via event-driven autoscaler |

### 6.1 Judge worker isolation

The configuration that matters most. Both providers, same requirements:

- **Dedicated subnet with no outbound internet route.** No NAT gateway, no default route.
- **Egress restricted to private endpoints** for the queue and object storage only.
- **Instance metadata hardened** — session-token-required mode, single network hop. This is the control that prevents credential theft from inside a sandbox escape.
- **Identity scoped to two permissions**: receive from one queue, read from one storage prefix. Nothing else.
- **No cluster credentials or service account tokens** mounted into worker pods.
- **Uniform CPU architecture across the entire judge fleet.** Mixing processor architectures produces different runtimes for identical submissions and turns the time-limit boundary into a lottery. This is a fairness requirement, not a cost optimization.
- **Interruptible instances with a small always-on baseline.** The at-least-once queue design already tolerates interruption.
- **A second worker pool and queue** dedicated to contest traffic.

### 6.2 Choosing a provider

Existing organizational commitment should decide it. Absent that, the differentiators are event-driven queue autoscaling maturity on Azure and interruptible-instance handling on AWS. Neither is decisive.

Cost is dominated by judge workers, which idle most of the day and spike during peak practice hours and contests. Size for the spike; scale to a minimal baseline otherwise.

---

## 7. Edge Cases

### 7.1 Judging

| Case | Handling |
|---|---|
| Duplicate submission from a double click | Client-supplied idempotency key; repeat returns the existing submission |
| Worker dies mid-judge | Queue visibility timeout returns the job; bounded retries; dead-letter thereafter |
| Non-deterministic time-limit results | Measure CPU time not wall clock; dedicated cores; limits set well above reference; re-run once when within margin of the boundary |
| Trailing whitespace and line-ending mismatch | Normalize line endings and strip trailing whitespace before comparison |
| Floating-point answers | Tolerance-based comparison, tolerance declared in the statement |
| Multiple valid answers | Per-problem checker receiving input, submitted output, and expected output |
| Memory-limit kill misreported | Map resource-exhaustion kills and signals to explicit verdicts, never a generic internal error |
| Compiler or runtime version drift | Pin versions per problem version; display to users |
| Oversized test input or output | Stream test data; hard cap output bytes and terminate on exceed |
| Empty or whitespace-only submission | Rejected at the API before consuming a worker |
| Test case discovered to be wrong | Rejudge all submissions for that problem version, reconcile scores, notify affected users, write an audit entry |
| Language deprecated after submission | Archive the language; preserve history; block new submissions |

### 7.2 Contests

| Case | Handling |
|---|---|
| Client clock skew | Countdown derived from a server-provided time offset, never the browser clock |
| Submission arriving at the buzzer | Cutoff on server receive time; grace window published in advance or explicitly zero |
| Queue backlog at contest end | All submissions received before the deadline are judged regardless of duration; ranks remain provisional until the queue drains |
| Bad test case mid-contest | Pause, correct, rejudge, extend duration, broadcast clarification, resume — a written runbook, not improvisation |
| Rejudge after finalization | Requires explicit override, audit entry, and participant notification |
| Registered but never participated | Excluded from standings entirely |
| Ties at the top | Tiebreak rule published before the contest |
| Disqualification | Status change and rank recomputation; all data retained |
| Setters and admins participating | Forced to unofficial status; visible to them, absent from standings |
| Virtual participation after the contest | Personal timer, separate standings, never merged with official results |

### 7.3 Administration

| Case | Handling |
|---|---|
| Two setters editing one problem | Optimistic concurrency on the modification timestamp; conflict returned, never silent overwrite |
| Deleting a problem with submissions | Soft delete only; history preserved |
| Bulk rejudge on a popular problem | Dry-run count shown and confirmation required before thousands of jobs are queued |
| Test data replaced without a version bump | Blocked; replacement creates a new version |
| Contest state edited directly | Blocked; state changes only via explicit lifecycle operations |
| Privilege escalation via self-edit | Users cannot modify their own role under any circumstances |

---

## 8. Security

### 8.1 Sandbox

| Threat | Control |
|---|---|
| Process-spawning exhaustion | Hard process limit; termination by process group, not by name |
| Memory exhaustion | Enforced memory ceiling; resource-exhaustion kill reported as an explicit verdict |
| Unbounded output filling storage | Output byte cap, read-only root filesystem, size-limited scratch space |
| Outbound abuse — mining, proxying, exfiltration | No network namespace access, plus a node-level egress deny as defense in depth |
| Reading the hidden test set from disk | The full test set is never placed inside the sandbox; cases are supplied one at a time, expected output never leaves the application core |
| Cloud credential theft via metadata endpoint | Blocked at the network layer, hardened metadata service, and a near-empty worker identity |
| Environment secret leakage | Environment fully scrubbed before execution |
| Container escape via kernel defect | Additional isolation runtime; patched hosts; isolated node pool with no cluster credentials |
| Process surviving the judge | Termination by namespace and control group |
| Language-level sandbox bypass | Language sandboxes are not relied upon; operating-system isolation is the only boundary |

### 8.2 Application

- **Ownership verification on every resource fetch.** Direct object reference flaws are the most common defect in this class of platform. Submissions, drafts, editorials, and contest data are all authorized against the requesting identity, never by identifier alone.
- **Submitted code rendered safely.** Learner code appears in submission viewers and discussions. It is escaped and rendered in an isolated context with a restrictive content policy.
- **Problem statements sanitized.** Setter-authored content is still user input.
- **Compilation treated as a separate resource budget.** Pathological compilation is a denial-of-service vector distinct from execution.
- **Rate and concurrency limits.** Submissions per user per interval, plus a cap on in-flight submissions per user.
- **Judge workers hold no secrets.** Authentication to the result endpoint is by a short-lived token scoped to a single submission.
- **Data protection.** Learner records are personal data; retention, export, and deletion paths are defined before launch, not retrofitted.

### 8.3 Admin panel

An administrator can read every hidden test case. That is the platform's most valuable asset.

- Multi-factor authentication **enforced**, not optional, for Admin and above.
- **Re-authentication for destructive actions**: role changes, deletion, contest finalization, test data replacement.
- Shorter session lifetime for privileged sessions than for learner sessions.
- Network-based access restriction for Super Admin where operationally feasible.
- **The audit log is not deletable through the application by anyone, including Super Admin.** Append-only, no deletion path, replicated to external storage.
- **Every hidden test data read is itself an audited event.**
- Impersonation, if implemented, is read-only, visibly indicated, and always audited.

### 8.4 Fork-specific hazards

Two upstream behaviours require deliberate mitigation:

**Archive uploads for test data.** Path traversal via crafted archive entries and decompression bombs are both live risks. Every entry path is resolved and verified to fall inside the target directory before extraction; uncompressed size and entry count are capped; absolute paths and symbolic links are rejected.

**Custom checker code.** The platform compiles and executes setter-supplied checker programs. **This is an arbitrary code execution path granted to whoever holds problem-setter rights.** Checker authoring is restricted to Admin and above, checker compilation and execution occur inside the same sandbox as submissions, and every change is audited. A Problem Setter able to author checkers is effectively root on the judge fleet.

### 8.5 Integrity

- **Hidden tests stay hidden.** Feedback during contests is limited to the verdict and at most a failing test index — never input, never a diff. Detailed diagnostics remain a practice-mode feature.
- **Submission flooding as an oracle.** Per-problem submission cooldowns prevent binary-searching test data through repeated probes.
- **Editorial and discussion lockdown** on any problem appearing in a running contest.
- **Multi-accounting.** Rating is the primary status signal and therefore the primary target. Account creation is rate-limited and unusual rating trajectories are surfaced for human review.
- **Similarity analysis** runs after contest finalization across all submissions. Results are a signal for human adjudication, never an automatic verdict.
- **Problem statement leakage before contest start.** Contest problems are unreadable until the start time and are authorized on every fetch. They are not preloaded to the client, not served from guessable paths, and not cached at a public edge.

### 8.6 Adversarial verification

A maintained suite of malicious submissions — process exhaustion, memory exhaustion, outbound network attempts, metadata endpoint access, filesystem traversal, unbounded output — asserts that the sandbox contains each one. It runs against every judge image before promotion. This is the highest-leverage test suite in the project.

---

## 9. Operational Best Practices

- **Soft delete throughout.** Nothing with history attached is ever hard-deleted.
- **Audit entries written in the same transaction as the change**, so the change cannot exist without the record.
- **Validation enforced server-side.** The admin interface is client code; anyone holding a privileged token can call the API directly.
- **Observability from day one:** queue depth, per-language judge latency, verdict distribution per problem, and sandbox termination reasons. A spike in internal errors for one language reveals a broken runtime image before users report it.
- **Feature-flagged language rollout**, exercised by setters first.
- **Published rules before every contest:** scoring mode, penalty structure, tiebreak, grace period, rejudge policy, appeal window. Most contest disputes are rule ambiguity rather than defects.
- **Equal information at equal times.** Clarifications broadcast simultaneously to all participants.
- **Determinism over throughput.** Where judging fast and judging identically conflict, judge identically.

---

## 10. Launch Readiness

The platform is not ready for public exposure until all of the following hold:

- [ ] Adversarial suite passes against every language image
- [ ] Judge workers verified to have no network route and no usable credentials
- [ ] Instance metadata hardening confirmed from inside a running sandbox
- [ ] Archive extraction hardened and tested against traversal and decompression bombs
- [ ] Custom checker authoring restricted and sandboxed
- [ ] Multi-factor authentication enforced for all privileged roles
- [ ] Audit log append-only and externally replicated
- [ ] Ownership checks verified on every resource endpoint
- [ ] Progress data normalized and concurrency-safe
- [ ] Rejudge exercised end-to-end on a problem with existing submissions
- [ ] Dependency vulnerability audit clean
- [ ] Backup and restore rehearsed, including hidden test data
- [ ] Data retention and deletion policy documented

Contests additionally require:

- [ ] Priority queue lane and reserved worker capacity operational
- [ ] Freeze verified to be enforced server-side, not in the client
- [ ] Contest problem statements confirmed unreachable before start time
- [ ] Incident runbook written for the mid-contest bad-test-case scenario
- [ ] A full rehearsal contest completed with real participants
