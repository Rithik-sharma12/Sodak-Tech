# Sodak-Tech — Technology Stack

Stack selection, performance design, failure containment, and security hardening.

Companion to `SODAK-TECH-DESIGN.md`, which specifies the platform design. This document specifies what to build it with and how to keep it standing.

---

## 0. Framing

**"Crash-proof" is not an achievable property.** Processes die, nodes are reclaimed, dependencies time out, and someone eventually submits a program designed to break things. The achievable properties are:

- **No single failure takes the platform down** — every component has a redundant peer or a defined degraded mode
- **No failure loses accepted work** — a submission acknowledged to a user is judged, eventually, regardless of what crashes
- **Recovery is automatic** — no human is required to restore service after a routine failure
- **Blast radius is bounded** — a judge worker dying cannot affect the API; a contest cannot affect practice

Every choice below is made against those four properties. Where performance and stability conflict, stability wins — a fast platform that drops submissions during a contest is worse than a slower one that never does.

---

## 1. Stack Summary

| Layer | Selection | Status |
|---|---|---|
| API framework | Django + Django REST Framework | Inherited |
| Application server | Gunicorn, async worker class | Inherited, retune |
| Background jobs | Celery or Dramatiq | Inherited, retune |
| Relational database | PostgreSQL (current stable major) | Inherited |
| Connection pooler | PgBouncer | **Add — mandatory** |
| Cache and leaderboard | Redis (current stable major) | Inherited, expand use |
| Durable job queue | Managed cloud queue (SQS / Service Bus) | **Add** |
| Realtime updates | Server-Sent Events | **Add** |
| Frontend framework | Next.js + TypeScript | **Replace** |
| Code editor | CodeMirror 6 | **Replace** |
| Sandbox core | QingdaoU Judger (seccomp, C) | Inherited |
| Sandbox outer layer | gVisor or Kata Containers | **Add** |
| Container runtime | containerd | Inherited |
| Orchestration | ECS/EKS or AKS | **Add** |
| Edge and CDN | CloudFront or Front Door, with WAF | **Add** |
| Infrastructure as code | Terraform | **Add** |
| CI/CD | GitHub Actions | **Add** |
| Telemetry | OpenTelemetry to a managed backend | **Add** |
| Error tracking | Sentry | **Add** |
| Secrets | Secrets Manager or Key Vault | **Add** |

---

## 2. What the Fork Decides, and What It Doesn't

### 2.1 Keep the backend framework

Django and DRF are inherited. Keep them.

**The API is not your bottleneck.** A submission takes seconds to compile and execute. Shaving twenty milliseconds off request handling is invisible against that. Rewriting a working backend to gain throughput you do not need would consume the entire project timeline and reintroduce every authorization bug the upstream project already fixed.

Django additionally gives you a mature admin scaffold and a permission system, which the platform design leans on directly.

**Where the framework genuinely struggles:** high-concurrency realtime fan-out. Pushing live leaderboard updates to a thousand simultaneous contest participants is not what a synchronous request framework is good at. The fix is surgical, not structural — see §3.4.

### 2.2 Replace the frontend

**Vue 2 reached end of life in December 2023.** The upstream frontend is built on it and on a component library of the same vintage. It receives no security patches. This is not a preference; it is an unpatched dependency in the tier that renders untrusted user code.

You wanted a custom Sodak-Tech portal regardless, so this is a cost you were paying anyway.

**Next.js with TypeScript.** Server rendering matters here specifically because problem statements are public content, and a coding platform's growth depends on those pages being indexable and fast on first paint. Authenticated views render client-side where SSR adds nothing.

TypeScript is not optional. The submission and verdict domain has enough state variants — a dozen verdicts, seven contest states, four progress states — that untyped code will produce runtime errors you only discover mid-contest.

### 2.3 Replace the editor

**CodeMirror 6 over Monaco.** Monaco is the VS Code editor and carries several megabytes of JavaScript. CodeMirror 6 does the same job in roughly a tenth of that, and it is genuinely usable on mobile, where Monaco is not.

Your users are on varied connections and devices. Editor bundle size is the single largest lever on time-to-first-keystroke, which is the moment a learner decides whether the platform feels fast.

Choose Monaco only if rich IntelliSense-grade autocomplete is a product requirement. For competitive programming it generally is not, and many platforms deliberately limit it.

### 2.4 Keep the sandbox core, add a layer

The upstream seccomp judger is proven and hard to improve on. Keep it.

Add an outer isolation layer — gVisor or Kata Containers — so that a defect in the seccomp filter does not immediately mean host compromise. Two independent boundaries, so a single bypass is contained.

---

## 3. Performance Design

### 3.1 The ordering that matters

Perceived speed on this platform is determined, in order, by:

1. Editor time-to-interactive
2. Problem page first paint
3. Verdict latency after submit
4. Leaderboard update latency during contests

Everything else is noise. Optimize in that order and ignore the rest.

### 3.2 Frontend

- **Route-level code splitting.** The editor bundle loads on problem pages only, never on the problem list or profile.
- **Problem statements served from the CDN**, invalidated on edit. They change rarely and are read constantly.
- **Virtualized lists.** Submission history and standings render thousands of rows. Render the visible window only; a full render will freeze low-end devices.
- **Optimistic UI on submit.** Show the queued state immediately. Never block the interface on a network round trip.
- **Prefetch the editor bundle** on hover over a problem link.

### 3.3 Backend

- **Nothing slow happens in a request.** Rejudge, standings recomputation, rating updates, and bulk operations are background jobs. A synchronous admin action that touches thousands of rows will hold a worker and eventually exhaust the pool.
- **N+1 queries are the dominant backend defect** in this framework. Every list endpoint eagerly loads its relations. Enforce a query-count assertion in tests on the hot endpoints so regressions fail CI rather than production.
- **Index for the real access patterns:** unique on (user, problem) in progress; composite on (user, state) for solved counts; composite on (user, created_at) for submission history; partial index on pending submissions.
- **Materialize expensive aggregates.** Per-tag solve counts and global problem statistics are computed on a schedule, not per request.
- **Cache with explicit invalidation, never blind expiry.** Problem metadata, user progress summaries, and problem lists are cached and evicted on write.
- **Protect against cache stampede.** When a hot key expires under load, a thousand requests will hit the database simultaneously. Use probabilistic early refresh or a single-flight lock.

### 3.4 Realtime

**Server-Sent Events, not WebSockets**, for verdict and leaderboard updates.

The traffic is one-directional — the server pushes, the client listens. SSE gives you automatic reconnection with resume, it survives corporate proxies that break WebSocket upgrades, and it needs no separate protocol handling at the load balancer.

**Extract the realtime fan-out into a small dedicated service.** This is the one place where the inherited framework is a genuinely poor fit. A minimal service that holds open connections and pushes from Redis pub/sub handles a contest-scale audience on a fraction of the resources, and — more importantly — its failure does not affect submissions. If it dies, the client falls back to polling and the contest continues.

This is the only component worth writing outside the main framework. Resist expanding it.

### 3.5 Judge throughput

- **Warm container pool.** Cold start per submission adds seconds. Maintain warm sandboxes and reset rather than recreate.
- **Contest workers are a separate pool with a separate queue.** Practice traffic must not be able to delay contest judging, and vice versa.
- **Scale on queue depth**, with a baseline sized for lab hours rather than for idle.
- **Uniform CPU architecture across the fleet.** Mixed architectures produce different runtimes for identical code, which turns the time limit into a lottery. This is a correctness requirement that happens to look like a performance choice.

---

## 4. Stability and Crash Mitigation

### 4.1 Bounded queues and backpressure

**This is the single most important stability control.** The characteristic failure of a judge platform is accepting more submissions than it can judge, growing the queue without bound, and exhausting broker memory — taking down judging for everyone including the users already waiting.

- Every queue has a maximum depth.
- At the threshold, new submissions are rejected with a clear, honest message and a retry indication — not silently queued into a hole.
- Per-user in-flight caps mean one user cannot consume the queue.
- A managed cloud queue is used for judge jobs rather than an in-memory broker, because durability across a broker restart is the difference between "delayed" and "lost".

Rejecting work under overload is a feature. Accepting work you cannot complete is how outages become data loss.

### 4.2 Timeouts on everything

Every outbound call — database, cache, queue, judge, object storage, external service — carries an explicit timeout. **An unbounded wait is the most common cause of cascading failure**: one slow dependency holds every worker, the pool exhausts, and a slow component becomes a total outage.

Retries use exponential backoff with jitter and a bounded retry budget. Naive immediate retry amplifies an outage rather than absorbing it.

### 4.3 Connection pooling

**PgBouncer is mandatory, not an optimization.** Each application worker holds a database connection. Multiply replicas by workers and you exceed the database's connection limit, at which point every request fails — including the health checks, which triggers a restart storm that makes it worse.

Transaction-mode pooling in front of the database, with an application-side pool sized well below the pooler's limit.

### 4.4 Health checks

**Liveness and readiness are different signals and conflating them causes outages.**

- **Readiness** answers "should traffic route here?" It fails when a dependency is unavailable. The instance is removed from rotation and recovers on its own.
- **Liveness** answers "is this process wedged?" It fails only on unrecoverable local state. Failure means restart.

A liveness probe that checks the database will restart every replica when the database blips — converting a brief dependency hiccup into a full outage. Liveness checks the process. Readiness checks dependencies.

### 4.5 Graceful shutdown

Every component handles termination signals: stop accepting new work, complete what is in flight, then exit.

**Critical for judge workers on interruptible instances.** A worker terminated mid-judge must release its job back to the queue rather than leave a submission pending forever. Combined with at-least-once delivery and idempotent processing, an interruption becomes a delay of seconds rather than a lost submission.

### 4.6 Worker recycling

Application and job workers restart after a bounded number of requests or jobs. This is unglamorous and it silently absorbs the memory leaks that every long-running process eventually develops. Recycle on a staggered schedule so replicas do not restart together.

### 4.7 Resource limits everywhere

Every container declares CPU and memory limits. An unlimited container that leaks will consume its node and take down every other container on it. Limits convert a component failure into a component restart.

Judge sandboxes carry their own strict limits by design; the concern here is the **runner process** that supervises them, which is the one people forget.

### 4.8 Graceful degradation

Each dependency has a defined degraded mode rather than an error page:

| Unavailable | Degraded behaviour |
|---|---|
| Cache | Serve from database; slower, fully functional |
| Realtime service | Client falls back to polling |
| Leaderboard store | Serve last computed standings from the database, labelled as such |
| Judge workers | Accept submissions to the queue, display honest queue status |
| Object storage | Block new test data uploads; judging continues from cached data |
| Search | Fall back to basic filtering |

**Nothing in the degraded column returns an error to the user.** The platform gets slower or loses a convenience; it does not stop.

### 4.9 Redundancy

- Application tier: minimum three replicas across availability zones
- Database: multi-zone with automatic failover
- Cache: replicated, and treated as reconstructible rather than authoritative
- Judge workers: minimum two, across zones
- No component runs as a singleton without a documented recovery path

### 4.10 Failure mode reference

| Failure | Containment | Recovery |
|---|---|---|
| Judge worker crashes mid-submission | Queue visibility timeout | Job redelivered, bounded retries, then dead-letter |
| Memory-bomb submission | Sandbox memory ceiling | Reported as a resource verdict; worker unaffected |
| Fork-bomb submission | Process limit, group termination | Sandbox torn down; worker continues |
| Interruptible instance reclaimed | Graceful shutdown, job released | Rescheduled on another worker |
| Queue backlog during a contest | Depth cap and backpressure | Autoscaling drains; users see honest queue position |
| Database connection exhaustion | Pooler caps connections | Requests queue at the pooler instead of failing |
| Cache node lost | Application treats cache as optional | Rebuilds on demand from the database |
| Realtime service crash | Separate deployment | Client polls; submissions unaffected |
| Slow dependency | Per-call timeouts and circuit breaker | Fails fast, recovers when the dependency does |
| Bad deployment | Progressive rollout with automated health gates | Automatic rollback |
| Traffic spike at contest start | Rate limits, warm pool, pre-scaled capacity | Absorbed; excess queued within the depth cap |

### 4.11 What must never be lost

An acknowledged submission is a promise. Durable queue, idempotent processing, at-least-once delivery, and a dead-letter queue that is monitored — a dead-letter queue nobody watches is a silent data loss channel.

Test data and submission source are backed up, and **restore is rehearsed on a schedule.** An unrehearsed backup is a hypothesis.

---

## 5. Security Hardening by Layer

### 5.1 Frontend

- Strict content security policy. Submitted code is rendered in an isolated context with scripting disabled.
- No dangerous HTML injection paths anywhere near user-supplied content.
- Authentication tokens in HTTP-only, secure, same-site cookies — never in browser storage, which is readable by any injected script.
- Subresource integrity on anything loaded from outside your own origin.
- Dependency audit in CI; the build fails on known-exploitable advisories.

### 5.2 API

- Debug mode disabled and host allowlisting enforced in every non-development environment. A debug page leaks configuration including credentials.
- Full security header set: strict transport security, frame denial, content-type enforcement, referrer policy.
- Memory-hard password hashing, tuned to current hardware.
- CSRF protection on cookie-authenticated state changes.
- Rate limiting at both the edge and the application. The edge absorbs volume; the application enforces per-identity fairness.
- Ownership verified on every resource fetch. Direct object reference flaws are the most common defect in this class of platform.
- Uploaded archives validated before extraction — entry paths resolved inside the target, size and entry count capped, symbolic links rejected.

### 5.3 Data tier

- Encryption at rest and in transit, without exception.
- The application connects with a role that has no schema-modification rights. Migrations run under a separate role, in a separate step.
- Cache requires authentication and is never exposed outside the private network. Destructive commands disabled.
- Hidden test data encrypted at rest with restricted access, and **every read audited.** It is the platform's most valuable asset.

### 5.4 Judge tier

The full sandbox threat model is specified in the design document. The stack-level requirements:

- Two independent isolation layers — seccomp filtering inside an additional sandboxed runtime.
- Language images built from minimal bases, pinned by digest, scanned, signed, and rebuilt on a schedule.
- Workers carry no database credentials, no object storage keys, no API keys. Result submission uses a short-lived token scoped to one submission.
- No network route. No cluster credentials. Hardened instance metadata access.
- **The container runtime socket is never reachable from anything that runs untrusted code.** Access to it is equivalent to host root and is the most common way self-built judges are compromised.

### 5.5 Supply chain

- All dependencies pinned by lockfile; all images pinned by digest.
- Software bill of materials generated per build and retained.
- Images signed at build; the orchestrator verifies signatures at admission.
- Automated dependency updates, reviewed rather than auto-merged.
- **The adversarial submission suite gates every judge image promotion.** No image reaches production without demonstrating containment of process exhaustion, memory exhaustion, network attempts, metadata access, filesystem traversal, and unbounded output.

### 5.6 Secrets and access

- Secrets in a managed secret store, injected at runtime. Never in images, repositories, or environment files under version control.
- Rotation on a schedule and on personnel change.
- Infrastructure changes only through version-controlled code, reviewed and applied by automation. No console modifications to production.
- Multi-factor authentication on every cloud and repository account without exception.

---

## 6. Explicit Non-Choices

Things to deliberately not do, each of which is a common and expensive mistake:

- **Do not rewrite the backend framework.** It is not your bottleneck and the rewrite is the project.
- **Do not run judge workers on serverless container platforms.** The sandbox requires kernel-level control those platforms do not grant. This is not negotiable and discovering it late is costly.
- **Do not use an in-memory broker as the durable judge queue.** A broker restart during a contest loses submissions.
- **Do not build a microservice architecture.** One application, one realtime service, one judge fleet. Distributed systems complexity buys you nothing at this scale and costs you every debugging session.
- **Do not skip the connection pooler.** It is the difference between a slow database and a total outage.
- **Do not put business logic in the frontend.** The admin panel is JavaScript; anyone with a privileged token calls the API directly.
- **Do not adopt a service mesh, event sourcing, or CQRS** at this stage. Each solves a problem you do not have and adds failure modes you will have.

---

## 7. Implementation Order

1. **Containerize and decompose.** Split the inherited single-host composition. Managed database, managed cache, judge workers on their own isolated pool. Before any feature work — retrofitting the trust boundary is much harder later.
2. **Add the pooler, timeouts, health checks, graceful shutdown, and resource limits.** Unglamorous, and the foundation everything else stands on.
3. **Harden the fork.** Dependency audit, archive extraction, checker restriction, enforced multi-factor authentication.
4. **Build the adversarial suite and wire it into CI.** Highest-leverage work in the project.
5. **Replace the frontend.** New portal, CodeMirror, SSE client.
6. **Add durable queue and backpressure.** Depth caps, per-user in-flight limits, dead-letter monitoring.
7. **Extract the realtime service.**
8. **Telemetry and error tracking**, with alerts on queue depth, judge error rate, and dead-letter arrivals.
9. **Rehearse failure.** Kill a worker mid-judge. Take the cache down. Fill the queue. Restore from backup. **The first time you exercise a failure path must not be during a contest.**

---

## 8. Stability Readiness

Verify before public launch:

- [ ] Every outbound call has an explicit timeout
- [ ] Queue depth caps enforced and tested by saturation
- [ ] Per-user in-flight submission cap enforced
- [ ] Liveness and readiness probes distinct and correct
- [ ] Graceful shutdown verified for API and judge workers
- [ ] Worker recycling configured and staggered
- [ ] Resource limits declared on every container
- [ ] Connection pooler in place, application pool sized below its limit
- [ ] Every degraded mode from §4.8 tested by disabling the dependency
- [ ] Dead-letter queue monitored with alerting
- [ ] Backup restore rehearsed end to end
- [ ] Deployment rollback verified under load
- [ ] Contest-scale load test completed, including the start and end spikes
