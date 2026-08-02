# Development plan

Status of the Sodak-Tech build, what remains, and the order it should be done in.

**Last updated:** 2026-08-02
**Target:** Alpha build to demo to the client
**Current state:** Backend and frontend both build clean. Learner portal and the
full admin panel are wired to the real API. Admin API verified end to end
against a running server. Deployment files in place (`deploy/nginx.conf`,
`backend/Procfile`, `docs/DEPLOYMENT.md`). The unsandboxed judge remains the
single most important outstanding item.

---

## 1. Where the project actually stands

### 1.1 Complete and verified

| Area | Detail |
|---|---|
| **Domain models** | Problems with immutable versions, weighted test groups, test cases, submissions pinned to a version, per-group results, normalized progress, contest lifecycle, editorials, audit log, users with five roles |
| **Scoring** | Pure function of stored results against a pinned rubric. 20 tests passing, covering all-or-nothing group credit, multiplier compounding, rubric precedence, and "incomplete judging must not read as accepted" |
| **Audit log** | Append-only, enforced by a Postgres trigger against `UPDATE`, `DELETE` **and `TRUNCATE`. Verified directly in psql, not just asserted in a test |
| **Migrations** | Apply cleanly to Postgres 18.4 from empty |
| **Learner API** | `auth/` (csrf, login, logout, me), `problems/`, `submissions/`, `progress/`, `contests/` |
| **Settings** | Split dev/prod, `check --deploy` clean, fail-closed startup assertions in prod |
| **Local infra** | Docker Compose — Postgres, Redis, PgBouncer (transaction pooling), API, worker, one-shot migrate service pointed at the DB directly |
| **Fresh install** | `manage.py bootstrap` creates one Super Admin and nothing else. `seed_demo` deleted — no demo data ships |

### 1.2 Verified end to end since the last update

| Area | Detail |
|---|---|
| **Admin API** | `/api/v1/admin/` — dashboard, users (list, role change, activate), problems (list, detail, create, update, soft-delete), versions (create, publish), tags, contests (list, create, lifecycle transition, attach/detach problems, editable times with `row_version` concurrency control), audit log, system health. Every mutation writes an audit entry; hidden test-data reads are audited per §8.3. **Exercised against a running server over a real session.** |
| **Admin panel UI** | 11 routes under `/admin` — overview, problems (list/new/detail with statement editor, immutable-version test-data editor), contests (list/new/detail with transitions and problem attach), users, tags, audit log, system health. Amber-accented shell per `docs/STITCH-PROMPTS.md` §12/§13 with the permanent unsandboxed-judge banner. |
| **Frontend build** | `npm run build` green (TypeScript strict, zero errors). `NITRO_PRESET=node-server` produces a runnable SSR server. |
| **Django admin** | Registered for all apps; audit log and test data read-only by construction; user roles/ratings read-only so privileged changes stay on the audited API path. |
| **Deployment** | `deploy/nginx.conf`, `backend/Procfile`, `docs/DEPLOYMENT.md` written. |

### 1.3 Frontend, learner-facing

Login, dashboard, problem list, problem detail with CodeMirror 6 editor, contests,
leaderboard, profile, settings. All wired to the real API. Settings was rebuilt
with a real toggle component, section rail, dirty-state save bar, and honest
disabled states for anything with no backend. Judge is LeetCode-style — signature
judging with a UI that matches.

---

## 2. Previously broken — resolved

The 10 TypeScript errors that once blocked the build are fixed (auth/guard
`exactOptionalPropertyTypes` issues, mock difficulty casing, `routeTree.gen.ts`
regeneration, create-page payloads). The admin pages deleted from the old
generated build (`analytics`, `categories`, `moderation`, `notifications`,
`settings`) stay deleted — they had no backend models. `contests` and
`system-health` were recreated against the real API under `/admin/contests` and
`/admin/health`.

## 3. Pending work, in priority order

### Priority 1 — Alpha blockers

These were the difference between "runs on my machine" and "can be shown to a client."

1. ~~**Fix the build**~~ — **done.** `npm run build` green, strict TypeScript.
2. ~~**Problem authoring UI**~~ — **done.** `/admin/problems/new` and
   `/admin/problems/{slug}` create a problem, add test groups with weights and
   sample/hidden flags, and publish an immutable version. An empty install can
   be populated entirely through the UI.
3. ~~**Recreate `/admin/contests` and system health**~~ — **done.**
   `/admin/contests` (list, create, detail, lifecycle transitions, problem
   attach/detach) and `/admin/health`.
4. ~~**Audit log viewer**~~ — **done.** `/admin/audit`, the single most
   convincing thing to show a client about platform integrity.
5. ~~**Verify the admin API end to end**~~ — **done.** Every endpoint exercised
   against a running server with a real session, including contest-time edits
   and the `row_version` concurrency check.
6. **Light/dark toggle, light default** — pending; verified for WCAG AA in both.

### Priority 2 — Needed before real users, not before a demo

7. **Sandboxed judging.** See §4 — this is the most important item in the document.
8. **Asynchronous judging.** Submissions currently judge synchronously inside the
   request. One slow submission blocks a worker thread; a dozen block the site.
   Celery is configured and a worker container exists, but the dispatch path is not
   built.
9. **MFA for privileged roles.** `User.mfa_enabled` and `requires_mfa` exist; nothing
   enforces them. Design doc §8.3 makes this a launch blocker.
10. **Re-authentication for destructive actions.** `HasRecentReauth` permission class
    exists and is applied nowhere.
11. **Rejudge.** Principle 6 calls it a first-class operation. `rescore_submission`
    exists; there is no endpoint, no dry-run count, no confirmation flow.
12. **Password change and account deletion.** Both surfaced in Settings as visibly
    disabled with reasons. Both need endpoints, re-auth, and audit entries.

### Priority 3 — Product completeness

13. Contest standings computation and the freeze/provisional/final workflow.
14. Rating calculation after a rated contest.
15. Editorial gating UI — the backend evaluates unlock conditions; the UI does not
    yet present the locked state properly.
16. Live verdict updates. Currently polling; SSE is the documented choice
    (stack doc §1).
17. Problem lists as curated learning tracks (design doc Phase 3).
18. Email delivery — nothing is configured; the weekly digest toggle is disabled
    because of it.
19. Virtual participation, similarity analysis, activity streaks.

### Priority 4 — Deployment

20. Production Docker Compose or Kubernetes manifests with the judge workers in a
    separate, network-isolated pool.
21. Managed Postgres, Redis, and queue rather than containers.
22. CI: lint, typecheck, tests, migration check, image build and scan.
23. Secrets from a managed store rather than `.env`.
24. Backup and restore rehearsal, including hidden test data.

**Landmark shipped:** single-host evaluation deployment documented and
configured — `deploy/nginx.conf` (one origin, TLS, backend routing, locked-down
`/django-admin`), `backend/Procfile`, and `docs/DEPLOYMENT.md`. This is the
evaluation shape design doc §5.3 allows; the items above are what turn it into a
production shape.

---

## 4. The blocker that matters most

**Judging runs untrusted code in a plain subprocess on the application host, with
no isolation from the filesystem, network, or database.**

This contradicts the architecture the design doc is built around. §3.1 defines three
trust zones and states the binding rule plainly: *"Zone 3 never connects to the
database."* Right now Zone 2 and Zone 3 are the same process on the same machine.

Concretely, submitted code today can read `.env` and the database credentials in it,
connect to Postgres directly, read every hidden test case, make outbound network
requests, and write anywhere the server user can write.

**This is acceptable for a controlled demo** where only you and the client submit
code. It is not acceptable the moment a student gets an account.

Closing it means: judge workers on separate machines with no DB route, jobs
delivered by queue with source and test data in the payload, results returned with a
short-lived token scoped to one submission, a seccomp/gVisor sandbox with CPU,
memory, process, and output caps, and the adversarial suite from §8.6 asserting each
containment holds.

Until then the admin dashboard carries a permanent warning banner saying exactly
this, so nobody deploys it by accident.

---

## 5. Launch readiness

Against design doc §10. Nothing here is satisfied yet, which is expected at this
stage — recorded so the gap is visible rather than assumed.

- [ ] Adversarial suite passes against every language image
- [ ] Judge workers verified to have no network route and no usable credentials
- [ ] Instance metadata hardening confirmed from inside a running sandbox
- [ ] Archive extraction hardened against traversal and decompression bombs
- [ ] Custom checker authoring restricted and sandboxed
- [ ] MFA enforced for all privileged roles
- [x] Audit log append-only — **done, trigger-enforced**
- [ ] Audit log externally replicated
- [x] Ownership checks on resource endpoints — **done for problems; unverified elsewhere**
- [x] Progress data normalized and concurrency-safe — **done**
- [ ] Rejudge exercised end to end
- [ ] Dependency vulnerability audit
- [ ] Backup and restore rehearsed
- [ ] Data retention and deletion policy documented

---

## 6. Known divergences from the specs

Recorded so nobody "fixes" the wrong side later.

1. **LMS layer deferred, not excluded.** The Figma design shows Courses, Assignments,
   Faculty Portal, and Departments. Design doc §1 lists all of it as out of scope.
   The decision was judge-core-first with clean seams. **Design doc §1 has not been
   amended and is currently wrong.**
2. **Not a fork.** Design doc line 5 calls this a fork of QingdaoU OnlineJudge. It is
   a fresh Django build. The upstream sandbox is still intended to be reused when
   §4 is addressed.
3. **Light theme default.** Originally dark-only, per the Figma design. Changed on
   client request. The Figma frames therefore no longer match the intended default
   appearance.

---

## 7. Also outstanding

- ~~`DESIGN.md`~~ — **written**, at the repository root.
- **Admin panel of the original generated build** claimed features that never
  existed — notifications with three distribution types, a moderation report queue,
  analytics. Those pages are deleted. If any are genuinely wanted, they need backend
  models first.
