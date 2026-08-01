// Problem difficulty levels
export type Difficulty = 'easy' | 'medium' | 'hard'

// Verdict status types.
//
// These are the exact strings the Django backend emits — see
// apps/submissions/models.py::Verdict. The list is longer than it looks like
// it needs to be on purpose: the design doc (§7.1) requires resource-exhaustion
// kills to map to explicit verdicts rather than a generic internal error,
// because a user who sees "Internal Error" for their own fork bomb learns
// nothing.
export type VerdictStatus =
  // in-flight
  | 'pending'
  | 'queued'
  | 'compiling'
  | 'running'
  // terminal
  | 'accepted'
  | 'wrong_answer'
  | 'time_limit_exceeded'
  | 'memory_limit_exceeded'
  | 'output_limit_exceeded'
  | 'runtime_error'
  | 'compile_error'
  | 'presentation_error'
  | 'sandbox_violation'
  | 'internal_error'
  | 'cancelled'

// Programming languages supported
export type ProgrammingLanguage = 'javascript' | 'python' | 'cpp' | 'java' | 'csharp' | 'go' | 'rust'

// Test case structure
export interface TestCase {
  id: string
  input: string
  output: string
  isExample: boolean
}

// Problem interface
export interface Problem {
  id: string
  title: string
  slug: string
  difficulty: Difficulty
  description: string
  constraints: string[]
  examples: TestCase[]
  acceptanceRate: number
  tags: string[]
  totalSubmissions: number
  acceptedSubmissions: number
}

// Submission verdict
export interface Submission {
  id: string
  problemId: string
  userId: string
  code: string
  language: ProgrammingLanguage
  verdict: VerdictStatus
  runtime: number // in ms
  memory: number // in MB
  createdAt: string
  output?: string
}

// Contest interface
export interface Contest {
  id: string
  name: string
  description: string
  startTime: string
  endTime: string
  duration: number // in minutes
  problemCount: number
  participantCount: number
  problems: Problem[]
}

// User profile
export interface User {
  id: string
  username: string
  email: string
  displayName: string
  avatar?: string
  bio?: string
  problemsSolved: number
  totalSubmissions: number
  currentStreak: number
  maxStreak: number
  rating: number
  joinedAt: string
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  score: number
  problemsSolved: number
  lastSubmissionTime: string
}

// Test case result
export interface TestCaseResult {
  id: string
  caseNumber: number
  input: string
  expected: string
  actual: string
  status: 'accepted' | 'wrong_answer' | 'runtime_error' | 'time_limit_exceeded'
  runtime: number
  memory: number
}

// Execution result
export interface ExecutionResult {
  verdict: VerdictStatus
  runtime: number
  memory: number
  output: string
  testCases: TestCaseResult[]
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
