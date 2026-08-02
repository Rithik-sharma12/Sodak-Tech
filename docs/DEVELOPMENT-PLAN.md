# Development plan

Status of the Sodak-Tech build, what remains, and the order it should be done in.

**Last updated:** 2026-08-02
**Target:** Alpha build to demo to the client
**Current state:** Backend substantially complete. Frontend consolidated from
Lovable (`ui-magic-wand-55`) into `frontend/` — TanStack Start with 9 learner
routes. Admin UI and several API integrations still pending.

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

### 1.2 Built but not yet verified end to end

| Area | Detail |
|---|---|
| **Admin API** | `/api/v1/admin/` — dashboard, users (list, role change, activate), problems (list, detail, create, update, soft-delete), versions (create, publish), tags, contests (list, create, lifecycle transition), audit log, system health. Every mutation writes an audit entry; hidden test-data reads are audited per §8.3. **Never exercised against a running server.** |
| **Design system** | Rebuilt in Tailwind v4 `@theme inline` with light/dark token pairs, light as default |

### 1.3 Frontend, learner-facing

Login, dashboard, problem list, problem detail with CodeMirror 6 editor, contests,
leaderboard, profile, settings. All wired to the real API. Settings was rebuilt
with a real toggle component, section rail, dirty-state save bar, and honest
disabled states for anything with no backend.

---

## 2. Broken right now — fix before anything else

The frontend has **10 TypeScript errors** and will not build. All are consequences
of an in-flight refactor, not design problems.

### 2.1 Deleted admin pages still referenced by Next's route validator

`analytics`, `categories`, `moderation`, `notifications`, `settings` were removed
deliberately — they had no backend models behind them and rendered invented data.
`contests` and `system-health` were removed to be rewritten and have not been
recreated yet.

**Fix:** clear `.next/dev/types`, recreate `contests` and `system-health` against
the real API, and leave the other five deleted.

### 2.2 `User` type has no `role` field

`admin-shell.tsx` and `admin/users/page.tsx` read `user.role`, but the learner-facing
`User` type in `lib/api/types.ts` does not declare it, even though the API returns it.

**Fix:** add `role` to the `User` type and map it in the client's user normaliser.

### 2.3 Theme switching is defined but not wired

`globals.css` now carries complete light and dark token sets, but nothing sets
`data-theme` on `<html>` and there is no toggle. The app renders light-only.

**Fix:** a `ThemeProvider` that defaults to light, persists the choice, and applies
`data-theme` before first paint via a blocking inline script (otherwise the page
flashes the wrong theme on load). Toggle in the top bar.

### 2.4 Admin pages linked but not built

`/admin/problems/new` and `/admin/problems/[slug]` are linked from the problems
list. Without them, an empty install cannot be populated through the UI at all —
which makes them Alpha-blocking, not nice-to-have.

---

## 3. Pending work, in priority order

### Priority 1 — Alpha blockers

These are the difference between "runs on my machine" and "can be shown to a client."

1. **Fix the build** (§2.1–2.3). Nothing else can be verified until this is green.
2. **Problem authoring UI** — `/admin/problems/new` and `/admin/problems/[slug]`.
   Create a problem, add test groups with weights and sample/hidden flags, publish a
   version. This is the only path to a usable platform from an empty database.
3. **Recreate `/admin/contests` and `/admin/system-health`** against the real API.
4. **Audit log viewer** at `/admin/audit`. Already has a backend endpoint; it is the
   single most convincing thing to show a client about platform integrity.
5. **Verify the admin API end to end** — every endpoint, against a running server,
   with a fresh database.
6. **Light/dark toggle**, light default, verified for WCAG AA contrast in both.

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
