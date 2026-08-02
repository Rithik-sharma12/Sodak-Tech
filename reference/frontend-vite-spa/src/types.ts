export type Role = 'Student' | 'Problem Setter' | 'Contest Manager' | 'Admin' | 'Super Admin';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type Verdict = 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Compilation Error' | 'Pending';

export type ProgrammingLanguage = 'python' | 'cpp' | 'java' | 'javascript' | 'go' | 'rust';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  explanation?: string;
}

export interface Editorial {
  summary: string;
  approaches: {
    title: string;
    complexityTime: string;
    complexitySpace: string;
    description: string;
    codeSnippet: Record<ProgrammingLanguage, string>;
  }[];
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  acceptanceRate: number;
  solvedCount: number;
  totalSubmissions: number;
  timeLimit: string;
  memoryLimit: string;
  topics: string[];
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  sampleCases: TestCase[];
  hiddenCases?: TestCase[];
  starterTemplates: Record<ProgrammingLanguage, string>;
  editorial?: Editorial;
  author?: string;
  isPublished: boolean;
}

export interface Submission {
  id: string;
  problemId: string;
  problemTitle: string;
  difficulty: Difficulty;
  userId: string;
  userName: string;
  userHandle: string;
  language: ProgrammingLanguage;
  code: string;
  verdict: Verdict;
  runtimeMs: number;
  memoryMb: number;
  passedTests: number;
  totalTests: number;
  submittedAt: string;
  score?: number;
  testDetails?: {
    caseNumber: number;
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    runtimeMs: number;
  }[];
}

export interface ContestProblem {
  problemId: string;
  title: string;
  difficulty: Difficulty;
  points: number;
  label: 'A' | 'B' | 'C' | 'D' | 'E';
  solvedCount: number;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  status: 'LIVE' | 'UPCOMING' | 'PAST';
  startTime: string;
  endTime: string;
  durationMinutes: number;
  problems: ContestProblem[];
  registeredUsersCount: number;
  isRegistered?: boolean;
  myRank?: number;
  myScore?: number;
  maxScore?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  email: string;
  role: Role;
  avatarUrl: string;
  bio: string;
  location: string;
  joinedDate: string;
  githubUrl?: string;
  rating: number;
  peakRating: number;
  globalRank: number;
  streakDays: number;
  problemsSolved: {
    easy: number;
    totalEasy: number;
    medium: number;
    totalMedium: number;
    hard: number;
    totalHard: number;
  };
  topicMastery: {
    topic: string;
    percentage: number;
    solved: number;
  }[];
  activityHeatmap: {
    date: string;
    count: number;
  }[];
  contestsAttended: number;
}

export interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  rating: number;
  solvedCount: number;
  streakDays: number;
  points: number;
  cohort: string;
  isCurrentUser?: boolean;
}

export interface UserSetting {
  defaultLanguage: ProgrammingLanguage;
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  theme: 'light' | 'dark';
  emailNotifications: boolean;
  contestAlerts: boolean;
}
