export type Difficulty = "easy" | "medium" | "hard";
export type ProblemStatus = "solved" | "attempted" | "todo";

export type Problem = {
  id: number;
  slug: string;
  title: string;
  tags: string[];
  difficulty: Difficulty;
  acceptance: string;
  solvedBy: string;
  status: ProblemStatus;
  favourite: boolean;
};

export const problems: Problem[] = [
  {
    id: 1,
    slug: "1",
    title: "Two Sum",
    tags: ["Arrays", "Hashing"],
    difficulty: "easy",
    acceptance: "49.8%",
    solvedBy: "12.4M",
    status: "solved",
    favourite: true,
  },
  {
    id: 3,
    slug: "3",
    title: "Longest Substring Without Repeating Characters",
    tags: ["Hash Table", "String", "Sliding Window"],
    difficulty: "medium",
    acceptance: "33.8%",
    solvedBy: "5.1M",
    status: "attempted",
    favourite: false,
  },
  {
    id: 4,
    slug: "4",
    title: "Median of Two Sorted Arrays",
    tags: ["Arrays", "Binary Search", "Divide and Conquer"],
    difficulty: "hard",
    acceptance: "36.1%",
    solvedBy: "2.1M",
    status: "todo",
    favourite: false,
  },
  {
    id: 5,
    slug: "5",
    title: "Longest Palindromic Substring",
    tags: ["String", "Dynamic Programming"],
    difficulty: "medium",
    acceptance: "32.4%",
    solvedBy: "2.7M",
    status: "todo",
    favourite: false,
  },
  {
    id: 6,
    slug: "6",
    title: "Course Schedule II",
    tags: ["Graph", "Topological Sort"],
    difficulty: "medium",
    acceptance: "48.0%",
    solvedBy: "800K",
    status: "todo",
    favourite: false,
  },
  {
    id: 7,
    slug: "7",
    title: "Network Delay Time",
    tags: ["Graph", "Shortest Path"],
    difficulty: "medium",
    acceptance: "52.1%",
    solvedBy: "640K",
    status: "todo",
    favourite: false,
  },
  {
    id: 8,
    slug: "8",
    title: "Coin Change",
    tags: ["Dynamic Programming"],
    difficulty: "medium",
    acceptance: "42.3%",
    solvedBy: "1.2M",
    status: "todo",
    favourite: true,
  },
  {
    id: 9,
    slug: "9",
    title: "Valid Parentheses",
    tags: ["Stack", "String"],
    difficulty: "easy",
    acceptance: "40.7%",
    solvedBy: "4.3M",
    status: "solved",
    favourite: false,
  },
  {
    id: 10,
    slug: "10",
    title: "Merge Intervals",
    tags: ["Arrays", "Sorting"],
    difficulty: "medium",
    acceptance: "46.9%",
    solvedBy: "1.9M",
    status: "attempted",
    favourite: false,
  },
  {
    id: 11,
    slug: "11",
    title: "Word Ladder",
    tags: ["Graph", "BFS"],
    difficulty: "hard",
    acceptance: "38.2%",
    solvedBy: "520K",
    status: "todo",
    favourite: false,
  },
  {
    id: 12,
    slug: "12",
    title: "LRU Cache",
    tags: ["Design", "Hashing", "Linked List"],
    difficulty: "medium",
    acceptance: "41.2%",
    solvedBy: "1.5M",
    status: "todo",
    favourite: false,
  },
  {
    id: 13,
    slug: "13",
    title: "Binary Tree Maximum Path Sum",
    tags: ["Trees", "Recursion"],
    difficulty: "hard",
    acceptance: "39.4%",
    solvedBy: "780K",
    status: "todo",
    favourite: false,
  },
];

export const topicFilters = [
  "Arrays",
  "Hashing",
  "String",
  "Graph",
  "Dynamic Programming",
  "Trees",
  "Sorting",
];

export type Verdict = "Accepted" | "Wrong Answer" | "Time Limit" | "Runtime Error";

export const recentSubmissions: {
  problem: string;
  verdict: Verdict;
  lang: string;
  runtime: string;
  when: string;
}[] = [
  { problem: "Two Sum", verdict: "Accepted", lang: "C++", runtime: "12ms", when: "10m ago" },
  {
    problem: "Longest Palindromic...",
    verdict: "Wrong Answer",
    lang: "C++",
    runtime: "N/A",
    when: "1h ago",
  },
  {
    problem: "Merge Intervals",
    verdict: "Time Limit",
    lang: "Python",
    runtime: ">2000ms",
    when: "Yesterday",
  },
  {
    problem: "Merge Intervals",
    verdict: "Accepted",
    lang: "Python",
    runtime: "56ms",
    when: "Yesterday",
  },
];

export const weeklyActivity = [
  { day: "M", value: 4 },
  { day: "T", value: 7 },
  { day: "W", value: 3 },
  { day: "T", value: 9 },
  { day: "F", value: 6 },
  { day: "S", value: 11 },
  { day: "S", value: 5 },
];

export const topicMastery = [
  { topic: "Arrays", pct: 82 },
  { topic: "Hashing", pct: 74 },
  { topic: "Dynamic Programming", pct: 41 },
  { topic: "Graphs", pct: 35 },
  { topic: "Sorting", pct: 90 },
];

export const recommended = [
  {
    title: "Course Schedule II",
    difficulty: "medium" as Difficulty,
    meta: "Graphs • 48% Acc",
    id: "6",
  },
  {
    title: "Network Delay Time",
    difficulty: "medium" as Difficulty,
    meta: "Graphs • 52% Acc",
    id: "7",
  },
  {
    title: "Coin Change",
    difficulty: "medium" as Difficulty,
    meta: "Dynamic Prog. • 42% Acc",
    id: "8",
  },
];

export const podium = [
  {
    rank: 2,
    name: "Sarah Chen",
    handle: "@schen_dev",
    solved: 1142,
    points: 14205,
  },
  {
    rank: 1,
    name: "Alexey Ivanov",
    handle: "@alexey_iv",
    solved: 1280,
    points: 15890,
  },
  {
    rank: 3,
    name: "Priya Patel",
    handle: "@priya_code",
    solved: 1095,
    points: 13440,
  },
];

export const leaderboardRows = [
  {
    rank: 4,
    move: "up",
    name: "David Kim",
    handle: "@dkim99",
    solved: 982,
    streak: 42,
    points: 12100,
  },
  {
    rank: 5,
    move: "flat",
    name: "Elena Rostova",
    handle: "@elena_r",
    solved: 945,
    streak: 12,
    points: 11850,
  },
  {
    rank: 6,
    move: "up",
    name: "Marcus Webb",
    handle: "@mwebb",
    solved: 901,
    streak: 7,
    points: 11020,
  },
  {
    rank: 7,
    move: "down",
    name: "Yuki Tanaka",
    handle: "@yuki_t",
    solved: 878,
    streak: 19,
    points: 10740,
  },
  {
    rank: 8,
    move: "flat",
    name: "Omar Haddad",
    handle: "@omarh",
    solved: 830,
    streak: 3,
    points: 10310,
  },
] as const;

export const currentUserRow = {
  rank: 142,
  move: "down" as const,
  name: "Current User",
  handle: "@priya_s",
  solved: 312,
  streak: 8,
  points: 3240,
};

export const upcomingContests = [
  {
    id: "bi-weekly-48",
    name: "Bi-weekly Blitz 48",
    rated: true,
    when: "Tomorrow, 14:00 UTC",
    duration: "120 minutes",
    problems: "5 problems",
    registered: false,
  },
  {
    id: "algorithm-sprint",
    name: "Algorithm Sprint",
    rated: false,
    when: "Sat, Oct 28, 09:00 UTC",
    duration: "90 minutes",
    problems: "4 problems",
    registered: true,
  },
  {
    id: "new-year-cup",
    name: "New Year Cup",
    rated: true,
    when: "Dec 31, 22:00 UTC",
    duration: "180 minutes",
    problems: "8 problems",
    registered: false,
  },
];

export const pastContests = [
  { name: "Weekly Challenge 141", date: "Oct 14, 2023", rank: "#1,204", delta: 24, rated: true },
  { name: "Bi-weekly Blitz 47", date: "Oct 07, 2023", rank: "#3,412", delta: -12, rated: true },
  { name: "Weekly Challenge 140", date: "Sep 30, 2023", rank: "#842", delta: null, rated: false },
  { name: "Autumn Festival Cup", date: "Sep 23, 2023", rank: "#215", delta: 58, rated: true },
  { name: "Weekly Challenge 139", date: "Sep 16, 2023", rank: "#2,105", delta: 4, rated: true },
];

export const contestProblems = [
  {
    label: "A",
    title: "Two Sum",
    difficulty: "easy" as Difficulty,
    status: "solved",
    points: "100 / 100",
    attempts: 1,
  },
  {
    label: "B",
    title: "Longest Substring",
    difficulty: "medium" as Difficulty,
    status: "attempted",
    points: "0 / 200",
    attempts: 3,
  },
  {
    label: "C",
    title: "Median of Two Arrays",
    difficulty: "hard" as Difficulty,
    status: "none",
    points: "0 / 300",
    attempts: 0,
  },
  {
    label: "D",
    title: "Valid Parentheses",
    difficulty: "easy" as Difficulty,
    status: "none",
    points: "0 / 100",
    attempts: 0,
  },
];

export const contestStandings = [
  { rank: 1, name: "tourist", score: 600 },
  { rank: 2, name: "Benq", score: 600 },
  { rank: 3, name: "ecnerwala", score: 500 },
  { rank: 9, name: "rng_58", score: 300 },
  { rank: 10, name: "Petr", score: 300 },
];

export const testGroups = [
  { name: "Handles empty input", passed: 1, total: 1, weight: 1, score: "10.00", ok: true },
  { name: "Small cases", passed: 5, total: 5, weight: 3, score: "30.00", ok: true },
  {
    name: "Large cases",
    passed: 3,
    total: 8,
    weight: 4,
    score: "0.00",
    ok: false,
    note: "First failure at case 4.",
  },
  { name: "Edge cases", passed: 0, total: 2, weight: 2, score: "0.00", ok: false },
];

export const submittedCode = `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Naive approach leading to TLE/Wrong Answer on large edge cases
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [i, j]

        return [] # Fallback for empty/invalid`;

export const starterCode = `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, n in enumerate(nums):
            if target - n in seen:
                return [seen[target - n], i]
            seen[n] = i
        return []`;

export const profile = {
  name: "Priya Sharma",
  handle: "@priya_s",
  bio: "CS student at Sodak U. Focusing on algorithms and distributed systems.",
  location: "Brookings, SD",
  joined: "Joined March 2026",
  link: "github.com/priyas",
  stats: [
    { label: "Rating", value: "1450" },
    { label: "Peak Rating", value: "1502" },
    { label: "Global Rank", value: "#142" },
    { label: "Contests", value: "8" },
  ],
  solved: [
    { label: "EASY", value: 32, total: 120, tone: "easy" as const },
    { label: "MED", value: 13, total: 140, tone: "medium" as const },
    { label: "HARD", value: 2, total: 52, tone: "hard" as const },
  ],
  topicStrength: [
    { topic: "Arrays", solved: 14, total: 45 },
    { topic: "Hashing", solved: 8, total: 20 },
    { topic: "Dynamic Programming", solved: 2, total: 50 },
    { topic: "Trees", solved: 5, total: 35 },
  ],
};

// Deterministic pseudo-random activity heatmap (53 weeks x 7 days).
export const activityHeatmap: number[] = Array.from({ length: 371 }, (_, i) => {
  const v = (i * 7919) % 97;
  if (v < 45) return 0;
  if (v < 65) return 1;
  if (v < 80) return 2;
  if (v < 91) return 3;
  return 4;
});
