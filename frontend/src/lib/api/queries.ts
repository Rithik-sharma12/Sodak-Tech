/**
 * TanStack Query hooks over the API client.
 *
 * Query keys are declared once in `keys` so an invalidation after a mutation
 * cannot miss a cache entry because two call sites spelled the key differently.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { api, rows } from "./client";
import type {
  AdminContest,
  AdminDashboard,
  AdminProblemDetail,
  AdminProblemSummary,
  AdminTag,
  AdminTestGroup,
  AdminUser,
  AuditEntry,
  Contest,
  ContestList,
  Difficulty,
  LeaderboardRow,
  Paginated,
  ProblemDetail,
  ProblemSummary,
  ProgressSummary,
  Role,
  Submission,
  SubmissionStatus,
  SystemHealth,
  Tag,
  User,
} from "./types";
import { isTerminal } from "./types";

export const keys = {
  me: ["me"] as const,
  problems: (filters?: unknown) => ["problems", filters ?? null] as const,
  problem: (slug: string) => ["problem", slug] as const,
  tags: ["tags"] as const,
  submissions: (filters?: unknown) => ["submissions", filters ?? null] as const,
  submission: (id: string) => ["submission", id] as const,
  submissionStatus: (id: string) => ["submission-status", id] as const,
  progress: ["progress"] as const,
  leaderboard: ["leaderboard"] as const,
  contests: ["contests"] as const,
  contest: (slug: string) => ["contest", slug] as const,
  adminDashboard: ["admin", "dashboard"] as const,
  adminHealth: ["admin", "health"] as const,
  adminUsers: (q?: string) => ["admin", "users", q ?? ""] as const,
  adminProblems: (q?: string) => ["admin", "problems", q ?? ""] as const,
  adminProblem: (slug: string) => ["admin", "problem", slug] as const,
  adminContests: ["admin", "contests"] as const,
  adminTags: ["admin", "tags"] as const,
  audit: (q?: string) => ["admin", "audit", q ?? ""] as const,
};

/* -------------------------------------------------------------------------
 * Identity
 * ---------------------------------------------------------------------- */

/**
 * The signed-in user, or null.
 *
 * A 401/403 is a legitimate answer ("nobody is signed in"), not a failure, so
 * it resolves to null instead of throwing. Retrying is pointless and would
 * delay the redirect to the login page.
 */
export function useMe(options?: Partial<UseQueryOptions<User | null>>) {
  return useQuery<User | null>({
    queryKey: keys.me,
    queryFn: async () => {
      try {
        return await api.get<User>("/auth/me/");
      } catch (error) {
        if (error && typeof error === "object" && "isUnauthenticated" in error) {
          if ((error as { isUnauthenticated: boolean }).isUnauthenticated) return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
    ...options,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.post<User>("/auth/login/", credentials),
    onSuccess: (user) => {
      qc.setQueryData(keys.me, user);
      // Everything cached belongs to whoever was signed in before.
      qc.invalidateQueries();
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>("/auth/logout/"),
    onSettled: () => {
      // Clear on failure too: if the server dropped the session and the
      // response was lost, keeping stale data on screen is worse than a
      // redundant refetch.
      qc.setQueryData(keys.me, null);
      qc.clear();
    },
  });
}

/* -------------------------------------------------------------------------
 * Problems
 * ---------------------------------------------------------------------- */

export interface ProblemFilters {
  search?: string;
  difficulty?: Difficulty | "";
  tag?: string;
  status?: string;
}

export function useProblems(filters: ProblemFilters = {}) {
  return useQuery({
    queryKey: keys.problems(filters),
    queryFn: () =>
      api
        .get<Paginated<ProblemSummary>>("/problems/", {
          search: filters.search,
          difficulty: filters.difficulty,
          tags: filters.tag,
          status: filters.status,
        })
        .then(rows),
    staleTime: 30_000,
  });
}

export function useProblem(slug: string, enabled = true) {
  return useQuery({
    queryKey: keys.problem(slug),
    queryFn: () => api.get<ProblemDetail>(`/problems/${slug}/`),
    enabled: enabled && Boolean(slug),
  });
}

export function useTags() {
  return useQuery({
    queryKey: keys.tags,
    queryFn: () => api.get<Tag[]>("/problems/tags/"),
    staleTime: 5 * 60_000,
  });
}

/* -------------------------------------------------------------------------
 * Submissions
 * ---------------------------------------------------------------------- */

export function useSubmissions(filters: { problem?: string; includeRuns?: boolean } = {}) {
  return useQuery({
    queryKey: keys.submissions(filters),
    queryFn: () =>
      api
        .get<Paginated<Submission>>("/submissions/", {
          problem: filters.problem,
          include_runs: filters.includeRuns ? "true" : undefined,
        })
        .then(rows),
    staleTime: 10_000,
  });
}

export function useSubmission(id: string, enabled = true) {
  return useQuery({
    queryKey: keys.submission(id),
    queryFn: () => api.get<Submission>(`/submissions/${id}/`),
    enabled: enabled && Boolean(id),
  });
}

/**
 * Poll a submission until it reaches a terminal verdict.
 *
 * Polling, not SSE. The stack doc (§3.4) specifies Server-Sent Events for
 * verdict updates and that remains the target; this is the documented interim
 * and is written so the swap is a change of transport, not of component —
 * every caller sees the same `{verdict, is_terminal}` either way.
 */
export function useSubmissionStatus(id: string | null) {
  return useQuery({
    queryKey: keys.submissionStatus(id ?? ""),
    queryFn: () => api.get<SubmissionStatus>(`/submissions/${id}/status/`),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const data = query.state.data as SubmissionStatus | undefined;
      if (!data) return 1000;
      // Stop the moment it settles, otherwise a finished submission polls
      // forever and every open tab is a permanent load on the API.
      return data.is_terminal || isTerminal(data.verdict) ? false : 1200;
    },
    refetchIntervalInBackground: false,
  });
}

export function useCreateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      problem_slug: string;
      language: string;
      source_code: string;
      kind: "run" | "submit";
      idempotency_key?: string;
    }) => api.post<Submission>("/submissions/create/", payload),
    onSuccess: (submission) => {
      qc.invalidateQueries({ queryKey: ["submissions"] });
      qc.invalidateQueries({ queryKey: keys.progress });
      qc.invalidateQueries({ queryKey: keys.problem(submission.problem_slug) });
    },
  });
}

/* -------------------------------------------------------------------------
 * Progress, leaderboard, contests
 * ---------------------------------------------------------------------- */

export function useProgress() {
  return useQuery({
    queryKey: keys.progress,
    queryFn: () => api.get<ProgressSummary>("/progress/me/"),
    staleTime: 30_000,
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: keys.leaderboard,
    queryFn: () => api.get<LeaderboardRow[]>("/progress/leaderboard/"),
    staleTime: 60_000,
  });
}

export function useContests() {
  return useQuery({
    queryKey: keys.contests,
    queryFn: () => api.get<ContestList>("/contests/"),
    staleTime: 30_000,
  });
}

export function useContest(slug: string) {
  return useQuery({
    queryKey: keys.contest(slug),
    queryFn: () => api.get<Contest>(`/contests/${slug}/`),
    enabled: Boolean(slug),
  });
}

/* -------------------------------------------------------------------------
 * Admin
 * ---------------------------------------------------------------------- */

export function useAdminDashboard() {
  return useQuery({
    queryKey: keys.adminDashboard,
    queryFn: () => api.get<AdminDashboard>("/admin/dashboard/"),
    staleTime: 15_000,
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: keys.adminHealth,
    queryFn: () => api.get<SystemHealth>("/admin/health/"),
    refetchInterval: 15_000,
  });
}

export function useAdminUsers(search?: string) {
  return useQuery({
    queryKey: keys.adminUsers(search),
    queryFn: () =>
      api.get<Paginated<AdminUser>>("/admin/users/", { search }).then(rows),
  });
}

export function useChangeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      api.post<AdminUser>(`/admin/users/${userId}/role/`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "audit"] });
    },
  });
}

export function useSetUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      api.post<AdminUser>(`/admin/users/${userId}/active/`, { is_active: isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "audit"] });
    },
  });
}

export function useAdminProblems(search?: string) {
  return useQuery({
    queryKey: keys.adminProblems(search),
    queryFn: () =>
      api.get<Paginated<AdminProblemSummary>>("/admin/problems/", { search }).then(rows),
  });
}

export function useAdminProblem(slug: string, enabled = true) {
  return useQuery({
    queryKey: keys.adminProblem(slug),
    queryFn: () => api.get<AdminProblemDetail>(`/admin/problems/${slug}/`),
    enabled: enabled && Boolean(slug),
    // Every read of this endpoint writes a TEST_DATA_READ audit entry, because
    // it exposes hidden test data (§8.3). Refetching it on window focus would
    // fill the audit log with events nobody performed.
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
}

export interface ProblemWrite {
  slug?: string;
  title?: string;
  statement?: string;
  input_format?: string;
  output_format?: string;
  constraints?: string;
  notes?: string;
  difficulty?: Difficulty;
  is_public?: boolean;
  tag_slugs?: string[];
  expected_row_version?: number;
}

export function useCreateProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProblemWrite) =>
      api.post<AdminProblemDetail>("/admin/problems/create/", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useUpdateProblem(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProblemWrite) =>
      api.patch<AdminProblemDetail>(`/admin/problems/${slug}/`, payload),
    onSuccess: (problem) => {
      qc.setQueryData(keys.adminProblem(problem.slug), problem);
      qc.invalidateQueries({ queryKey: ["admin", "problems"] });
    },
  });
}

export function useDeleteProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => api.delete<void>(`/admin/problems/${slug}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export interface VersionWrite {
  time_limit_ms: number;
  memory_limit_mb: number;
  comparison_mode: "exact" | "float" | "checker";
  float_tolerance?: number | null;
  change_note?: string;
  publish: boolean;
  test_groups: {
    name: string;
    description?: string;
    weight: number;
    is_sample: boolean;
    cases: { input_data: string; expected_output: string }[];
  }[];
}

export function useCreateVersion(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VersionWrite) =>
      api.post<AdminProblemDetail>(`/admin/problems/${slug}/versions/`, payload),
    onSuccess: (problem) => {
      qc.setQueryData(keys.adminProblem(slug), problem);
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function usePublishVersion(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (versionNumber: number) =>
      api.post<AdminProblemDetail>(
        `/admin/problems/${slug}/versions/${versionNumber}/publish/`,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useAdminTags() {
  return useQuery({
    queryKey: keys.adminTags,
    queryFn: () => api.get<AdminTag[]>("/admin/tags/"),
  });
}

export function useAdminContests() {
  return useQuery({
    queryKey: keys.adminContests,
    queryFn: () => api.get<Paginated<AdminContest>>("/admin/contests/").then(rows),
  });
}

export function useCreateContest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AdminContest>) =>
      api.post<AdminContest>("/admin/contests/create/", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useTransitionContest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, toState }: { slug: string; toState: string }) =>
      api.post<AdminContest>(`/admin/contests/${slug}/transition/`, { to_state: toState }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: keys.contests });
    },
  });
}

export function useAuditLog(search?: string) {
  return useQuery({
    queryKey: keys.audit(search),
    queryFn: () =>
      api.get<Paginated<AuditEntry>>("/admin/audit/", { search }).then(rows),
    staleTime: 10_000,
  });
}

export type { AdminTestGroup };
