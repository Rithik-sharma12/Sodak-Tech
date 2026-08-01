import type {
  Problem,
  Submission,
  Contest,
  User,
  LeaderboardEntry,
  ExecutionResult,
  ProgrammingLanguage,
} from './types'

// Mock data
const mockProblems: Problem[] = [
  {
    id: '1',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'easy',
    description: `Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    examples: [
      {
        id: '1-1',
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        isExample: true,
      },
      {
        id: '1-2',
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        isExample: true,
      },
    ],
    acceptanceRate: 47.3,
    tags: ['Array', 'Hash Table'],
    totalSubmissions: 28500,
    acceptedSubmissions: 13500,
  },
  {
    id: '2',
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring',
    difficulty: 'medium',
    description: `Given a string s, find the length of the longest substring without repeating characters.`,
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.',
    ],
    examples: [
      {
        id: '2-1',
        input: 's = "abcabcbb"',
        output: '3',
        isExample: true,
      },
    ],
    acceptanceRate: 33.2,
    tags: ['Hash Table', 'String', 'Sliding Window'],
    totalSubmissions: 15200,
    acceptedSubmissions: 5050,
  },
  {
    id: '3',
    title: 'Median of Two Sorted Arrays',
    slug: 'median-of-two-sorted',
    difficulty: 'hard',
    description: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).`,
    constraints: [
      'nums1.length == m',
      'nums2.length == n',
      '0 <= m <= 1000',
      '0 <= n <= 1000',
      '0 <= nums1[i], nums2[j] <= 1000',
    ],
    examples: [
      {
        id: '3-1',
        input: 'nums1 = [1,3], nums2 = [2]',
        output: '2.0',
        isExample: true,
      },
    ],
    acceptanceRate: 27.5,
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    totalSubmissions: 8900,
    acceptedSubmissions: 2450,
  },
  {
    id: '4',
    title: 'Reverse Integer',
    slug: 'reverse-integer',
    difficulty: 'easy',
    description: `Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-2^31, 2^31 - 1], then return 0.`,
    constraints: ['-2^31 <= x <= 2^31 - 1'],
    examples: [
      {
        id: '4-1',
        input: 'x = 123',
        output: '321',
        isExample: true,
      },
    ],
    acceptanceRate: 25.6,
    tags: ['Math'],
    totalSubmissions: 12300,
    acceptedSubmissions: 3150,
  },
  {
    id: '5',
    title: 'Palindrome Number',
    slug: 'palindrome-number',
    difficulty: 'easy',
    description: `Given an integer x, return true if x is palindrome integer. An integer is a palindrome when it reads the same backward as forward.`,
    constraints: ['-2^31 <= x <= 2^31 - 1'],
    examples: [
      {
        id: '5-1',
        input: 'x = 121',
        output: 'true',
        isExample: true,
      },
    ],
    acceptanceRate: 51.2,
    tags: ['Math'],
    totalSubmissions: 9800,
    acceptedSubmissions: 5000,
  },
]

const mockContests: Contest[] = [
  {
    id: '1',
    name: 'Weekly Contest 365',
    description: 'A weekly competitive programming contest',
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    duration: 90,
    problemCount: 4,
    participantCount: 3500,
    problems: mockProblems.slice(0, 4),
  },
  {
    id: '2',
    name: 'Biweekly Contest 120',
    description: 'A biweekly competitive programming contest',
    startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    duration: 90,
    problemCount: 4,
    participantCount: 2800,
    problems: mockProblems.slice(1, 5),
  },
]

const mockUser: User = {
  id: 'user-1',
  username: 'johndoe',
  email: 'john@example.com',
  displayName: 'John Doe',
  bio: 'Passionate about competitive programming and algorithms',
  problemsSolved: 156,
  totalSubmissions: 542,
  currentStreak: 12,
  maxStreak: 45,
  rating: 1850,
  joinedAt: '2023-01-15T00:00:00Z',
}

const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: 'user-2',
    username: 'algorithmiclover',
    score: 2150,
    problemsSolved: 487,
    lastSubmissionTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    rank: 2,
    userId: 'user-3',
    username: 'codeninja',
    score: 2045,
    problemsSolved: 451,
    lastSubmissionTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    rank: 3,
    userId: 'user-1',
    username: 'johndoe',
    score: 1850,
    problemsSolved: 156,
    lastSubmissionTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    rank: 4,
    userId: 'user-4',
    username: 'datastructuremaster',
    score: 1720,
    problemsSolved: 298,
    lastSubmissionTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    rank: 5,
    userId: 'user-5',
    username: 'recursionexpert',
    score: 1650,
    problemsSolved: 275,
    lastSubmissionTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
]

export const mockAPI = {
  async getProblems(filters?: any) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return {
      problems: mockProblems,
      total: mockProblems.length,
    }
  },

  async getProblem(idOrSlug: string) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return mockProblems.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || mockProblems[0]
  },

  async getProblemEditorial(id: string) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return {
      editorial: `# Solution Explanation

## Approach 1: Brute Force (O(n^2))
Iterate through each element and check if the complement exists.

## Approach 2: Hash Map (O(n))
Use a hash map to store seen numbers for O(1) lookup.

## Complexity Analysis
- Time: O(n)
- Space: O(n)`,
    }
  },

  async submitSolution(problemId: string, code: string, language: ProgrammingLanguage) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const submission = {
      id: 'sub-' + Date.now(),
      problemId,
      userId: 'user-1',
      code,
      language,
      verdict: 'accepted' as const,
      runtime: 48,
      memory: 12,
      createdAt: new Date().toISOString(),
    } satisfies Submission

    // Same return shape as the real client. The mock and the real client must
    // be interchangeable or the switch in index.ts is a type error waiting for
    // whichever branch is not currently selected.
    return { submission, result: await this.runTests(problemId, code, language) }
  },

  async runTests(problemId: string, code: string, language: ProgrammingLanguage) {
    await new Promise((resolve) => setTimeout(resolve, 800))
    const problem =
      mockProblems.find((p) => p.id === problemId || p.slug === problemId) || mockProblems[0]
    return {
      verdict: 'accepted' as const,
      runtime: 42,
      memory: 11,
      output: 'All tests passed',
      testCases: problem.examples.map((tc, index) => ({
        id: tc.id,
        caseNumber: index + 1,
        input: tc.input,
        expected: tc.output,
        actual: tc.output,
        status: 'accepted' as const,
        runtime: 42,
        memory: 11,
      })),
    } satisfies ExecutionResult
  },

  async getSubmissions(problemId?: string, userId?: string) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return [
      {
        id: 'sub-1',
        problemId: problemId || '1',
        userId: userId || 'user-1',
        code: 'function twoSum(nums, target) { /* solution */ }',
        language: 'javascript' as const,
        verdict: 'accepted' as const,
        runtime: 48,
        memory: 12,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'sub-2',
        problemId: problemId || '1',
        userId: userId || 'user-1',
        code: 'function twoSum(nums, target) { /* attempt 1 */ }',
        language: 'javascript' as const,
        verdict: 'wrong_answer' as const,
        runtime: 55,
        memory: 13,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
    ] satisfies Submission[]
  },

  async getSubmission(id: string) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return {
      id,
      problemId: '1',
      userId: 'user-1',
      code: 'function solution() { }',
      language: 'javascript' as const,
      verdict: 'accepted' as const,
      runtime: 48,
      memory: 12,
      createdAt: new Date().toISOString(),
    } satisfies Submission
  },

  async getContests(filters?: any) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return mockContests
  },

  async getContest(id: string) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return mockContests.find((c) => c.id === id) || mockContests[0]
  },

  async getUser(id: string) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return mockUser
  },

  async getCurrentUser() {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return mockUser
  },

  async updateUser(id: string, data: any) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return { ...mockUser, ...data }
  },

  async getLeaderboard(limit?: number, offset?: number) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const start = offset || 0
    const end = start + (limit || 50)
    return mockLeaderboard.slice(start, end)
  },
}
