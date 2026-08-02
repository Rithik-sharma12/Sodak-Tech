import { Problem, Contest, LeaderboardUser, Submission, UserProfile, UserSetting } from '../types';

export const INITIAL_USER: UserProfile = {
  id: 'usr_priya_123',
  name: 'Priya Sharma',
  handle: 'priya_s',
  email: 'priya.sharma@sodak.edu',
  role: 'Student',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  bio: 'CS Senior @ Sodak Univ | Passionate about Dynamic Programming, Graph Algorithms & Competitive Coding.',
  location: 'Sodak Tech Campus, Bldg 4',
  joinedDate: 'September 2023',
  githubUrl: 'https://github.com/priyasharma-code',
  rating: 1450,
  peakRating: 1502,
  globalRank: 142,
  streakDays: 12,
  contestsAttended: 8,
  problemsSolved: {
    easy: 32,
    totalEasy: 120,
    medium: 13,
    totalMedium: 140,
    hard: 2,
    totalHard: 52,
  },
  topicMastery: [
    { topic: 'Arrays', percentage: 82, solved: 18 },
    { topic: 'Hash Table', percentage: 74, solved: 14 },
    { topic: 'Dynamic Programming', percentage: 41, solved: 7 },
    { topic: 'Graph Theory', percentage: 35, solved: 5 },
    { topic: 'Sorting & Searching', percentage: 90, solved: 22 },
  ],
  activityHeatmap: Array.from({ length: 364 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (363 - i));
    const dateStr = d.toISOString().split('T')[0];
    // create realistic submission heatmap distribution
    const count = (i % 7 === 2 || i % 7 === 5) ? Math.floor(Math.random() * 5) + 1 : (i % 3 === 0 ? Math.floor(Math.random() * 3) : 0);
    return { date: dateStr, count };
  }),
};

export const DEFAULT_SETTINGS: UserSetting = {
  defaultLanguage: 'python',
  fontSize: 14,
  tabSize: 4,
  wordWrap: true,
  lineNumbers: true,
  theme: 'light',
  emailNotifications: true,
  contestAlerts: true,
};

export const MOCK_PROBLEMS: Problem[] = [
  {
    id: 'two-sum',
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    acceptanceRate: 49.2,
    solvedCount: 1420,
    totalSubmissions: 2886,
    timeLimit: '2.0s',
    memoryLimit: '256MB',
    topics: ['Arrays', 'Hash Table'],
    author: 'Dr. Vance (CS Lead)',
    isPublished: true,
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly one solution***, and you may not use the *same* element twice.

You can return the answer in any order.`,
    inputFormat: 'Line 1: An integer array `nums` formatted as comma-separated integers in brackets.\nLine 2: An integer `target`.',
    outputFormat: 'Return an array of two indices `[i, j]`.',
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    sampleCases: [
      {
        id: 'tc1',
        input: 'nums = [2,7,11,15], target = 9',
        expectedOutput: '[0,1]',
        isSample: true,
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        id: 'tc2',
        input: 'nums = [3,2,4], target = 6',
        expectedOutput: '[1,2]',
        isSample: true,
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
      },
      {
        id: 'tc3',
        input: 'nums = [3,3], target = 6',
        expectedOutput: '[0,1]',
        isSample: true,
      }
    ],
    starterTemplates: {
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Write your code here
        seen = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in seen:
                return [seen[diff], i]
            seen[num] = i
        return []
`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); ++i) {
            int diff = target - nums[i];
            if (seen.find(diff) != seen.end()) {
                return {seen[diff], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};
`,
      java: `import java.util.HashMap;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int diff = target - nums[i];
            if (seen.containsKey(diff)) {
                return new int[] { seen.get(diff), i };
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}
`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (seen.has(diff)) {
            return [seen.get(diff), i];
        }
        seen.set(nums[i], i);
    }
    return [];
};
`,
      go: `func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        diff := target - num
        if idx, ok := seen[diff]; ok {
            return []int{idx, i}
        }
        seen[num] = i
    }
    return nil
}
`,
      rust: `use std::collections::HashMap;

impl Solution {
    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
        let mut map = HashMap::new();
        for (i, &num) in nums.iter().enumerate() {
            let diff = target - num;
            if let Some(&prev_idx) = map.get(&diff) {
                return vec![prev_idx as i32, i as i32];
            }
            map.insert(num, i);
        }
        vec![]
    }
}
`
    },
    editorial: {
      summary: 'Two Sum is a classic problem that can be solved either using a brute force check of all pairs or an optimized hash map lookup.',
      approaches: [
        {
          title: 'Approach 1: One-Pass Hash Map (Optimal)',
          complexityTime: 'O(N) time complexity since we iterate through the list once and hash map lookups take O(1) average time.',
          complexitySpace: 'O(N) space complexity for storing elements in the hash map.',
          description: 'While we iterate and inserting elements into the table, we also look back to check if the current element\'s complement already exists in the table.',
          codeSnippet: {
            python: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`,
            cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); ++i) {
        int diff = target - nums[i];
        if (seen.count(diff)) return {seen[diff], i};
        seen[nums[i]] = i;
    }
    return {};
}`,
            java: `public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (map.containsKey(complement)) return new int[] { map.get(complement), i };
        map.put(nums[i], i);
    }
    return new int[]{};
}`,
            javascript: `var twoSum = function(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) return [map.get(diff), i];
        map.set(nums[i], i);
    }
};`,
            go: `func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        if idx, ok := seen[target-num]; ok {
            return []int{idx, i}
        }
        seen[num] = i
    }
    return nil
}`,
            rust: `pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
    let mut map = std::collections::HashMap::new();
    for (i, &num) in nums.iter().enumerate() {
        if let Some(&idx) = map.get(&(target - num)) {
            return vec![idx as i32, i as i32];
        }
        map.insert(num, i);
    }
    vec![]
}`
          }
        }
      ]
    }
  },
  {
    id: 'course-schedule-ii',
    slug: 'course-schedule-ii',
    title: 'Course Schedule II',
    difficulty: 'Medium',
    acceptanceRate: 51.8,
    solvedCount: 820,
    totalSubmissions: 1583,
    timeLimit: '2.0s',
    memoryLimit: '256MB',
    topics: ['Graph Theory', 'Arrays'],
    author: 'Prof. Miller',
    isPublished: true,
    description: `There are a total of \`numCourses\` courses you have to take, labeled from \`0\` to \`numCourses - 1\`. You are given an array \`prerequisites\` where \`prerequisites[i] = [a_i, b_i]\` indicates that you **must** take course \`b_i\` first if you want to take course \`a_i\`.

Return *the ordering of courses you should take to finish all courses*. If there are many valid answers, return **any** of them. If it is impossible to finish all courses, return an **empty array**.`,
    inputFormat: 'numCourses: integer, prerequisites: 2D integer array.',
    outputFormat: 'Return array of topological ordering of courses.',
    constraints: [
      '1 <= numCourses <= 2000',
      '0 <= prerequisites.length <= numCourses * (numCourses - 1)',
      'prerequisites[i].length == 2',
      '0 <= a_i, b_i < numCourses',
      'a_i != b_i'
    ],
    sampleCases: [
      {
        id: 'tc1',
        input: 'numCourses = 2, prerequisites = [[1,0]]',
        expectedOutput: '[0,1]',
        isSample: true,
        explanation: 'There are a total of 2 courses to take. To take course 1 you should have finished course 0. So the correct course order is [0,1].'
      },
      {
        id: 'tc2',
        input: 'numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]',
        expectedOutput: '[0,1,2,3]',
        isSample: true,
        explanation: 'Course order [0,2,1,3] is also a valid topological sort.'
      }
    ],
    starterTemplates: {
      python: `from collections import deque, defaultdict

class Solution:
    def findOrder(self, numCourses: int, prerequisites: list[list[int]]) -> list[int]:
        # Topological Sort (Kahn's algorithm)
        adj = defaultdict(list)
        indegree = [0] * numCourses
        
        for dest, src in prerequisites:
            adj[src].append(dest)
            indegree[dest] += 1
            
        queue = deque([i for i in range(numCourses) if indegree[i] == 0])
        order = []
        
        while queue:
            node = queue.popleft()
            order.append(node)
            for neighbor in adj[node]:
                indegree[neighbor] -= 1
                if indegree[neighbor] == 0:
                    queue.append(neighbor)
                    
        return order if len(order) == numCourses else []
`,
      cpp: `#include <vector>
#include <queue>
using namespace std;

class Solution {
public:
    vector<int> findOrder(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> adj(numCourses);
        vector<int> indegree(numCourses, 0);
        for (auto& p : prerequisites) {
            adj[p[1]].push_back(p[0]);
            indegree[p[0]]++;
        }
        queue<int> q;
        for (int i = 0; i < numCourses; i++) {
            if (indegree[i] == 0) q.push(i);
        }
        vector<int> order;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            order.push_back(u);
            for (int v : adj[u]) {
                if (--indegree[v] == 0) q.push(v);
            }
        }
        return order.size() == numCourses ? order : vector<int>();
    }
};
`,
      java: `import java.util.*;

class Solution {
    public int[] findOrder(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        int[] indegree = new int[numCourses];
        for (int[] p : prerequisites) {
            adj.get(p[1]).add(p[0]);
            indegree[p[0]]++;
        }
        Queue<Integer> q = new LinkedList<>();
        for (int i = 0; i < numCourses; i++) if (indegree[i] == 0) q.add(i);
        int[] result = new int[numCourses];
        int index = 0;
        while (!q.isEmpty()) {
            int node = q.poll();
            result[index++] = node;
            for (int next : adj.get(node)) {
                if (--indegree[next] == 0) q.add(next);
            }
        }
        return index == numCourses ? result : new int[0];
    }
}
`,
      javascript: `var findOrder = function(numCourses, prerequisites) {
    const adj = Array.from({length: numCourses}, () => []);
    const indegree = new Array(numCourses).fill(0);
    for (let [dest, src] of prerequisites) {
        adj[src].push(dest);
        indegree[dest]++;
    }
    const queue = [];
    for (let i = 0; i < numCourses; i++) {
        if (indegree[i] === 0) queue.push(i);
    }
    const order = [];
    while (queue.length > 0) {
        const node = queue.shift();
        order.push(node);
        for (let next of adj[node]) {
            indegree[next]--;
            if (indegree[next] === 0) queue.push(next);
        }
    }
    return order.length === numCourses ? order : [];
};
`,
      go: `func findOrder(numCourses int, prerequisites [][]int) []int {
    adj := make([][]int, numCourses)
    indegree := make([]int, numCourses)
    for _, p := range prerequisites {
        adj[p[1]] = append(adj[p[1]], p[0])
        indegree[p[0]]++
    }
    queue := []int{}
    for i := 0; i < numCourses; i++ {
        if indegree[i] == 0 {
            queue = append(queue, i)
        }
    }
    order := []int{}
    for len(queue) > 0 {
        curr := queue[0]
        queue = queue[1:]
        order = append(order, curr)
        for _, next := range adj[curr] {
            indegree[next]--
            if indegree[next] == 0 {
                queue = append(queue, next)
            }
        }
    }
    if len(order) == numCourses {
        return order
    }
    return []int{}
}
`,
      rust: `use std::collections::VecDeque;

impl Solution {
    pub fn find_order(num_courses: i32, prerequisites: Vec<Vec<i32>>) -> Vec<i32> {
        let n = num_courses as usize;
        let mut adj = vec![vec![]; n];
        let mut indegree = vec![0; n];
        for p in prerequisites {
            adj[p[1] as usize].push(p[0] as usize);
            indegree[p[0] as usize] += 1;
        }
        let mut q = VecDeque::new();
        for i in 0..n {
            if indegree[i] == 0 { q.push_back(i); }
        }
        let mut order = vec![];
        while let Some(u) = q.pop_front() {
            order.push(u as i32);
            for &v in &adj[u] {
                indegree[v] -= 1;
                if indegree[v] == 0 { q.push_back(v); }
            }
        }
        if order.len() == n { order } else { vec![] }
    }
}
`
    }
  },
  {
    id: 'network-delay-time',
    slug: 'network-delay-time',
    title: 'Network Delay Time',
    difficulty: 'Medium',
    acceptanceRate: 53.4,
    solvedCount: 640,
    totalSubmissions: 1198,
    timeLimit: '2.0s',
    memoryLimit: '256MB',
    topics: ['Graph Theory'],
    author: 'Sodak CP Club',
    isPublished: true,
    description: `You are given a network of \`n\` nodes, labeled from \`1\` to \`n\`. You are also given \`times\`, a list of travel times as directed edges \`times[i] = (u_i, v_i, w_i)\`, where \`u_i\` is the source node, \`v_i\` is the target node, and \`w_i\` is the time it takes for a signal to travel from source to target.

We will send a signal from a given node \`k\`. Return the ***minimum time*** it takes for all the \`n\` nodes to receive the signal. If it is impossible for all the \`n\` nodes to receive the signal, return \`-1\`.`,
    inputFormat: 'times: 2D array [u, v, w], n: integer, k: integer.',
    outputFormat: 'Return single integer representing max distance in Dijkstra or -1.',
    constraints: [
      '1 <= k <= n <= 100',
      '1 <= times.length <= 6000',
      'times[i].length == 3',
      '1 <= u_i, v_i <= n',
      '0 <= w_i <= 100'
    ],
    sampleCases: [
      {
        id: 'tc1',
        input: 'times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2',
        expectedOutput: '2',
        isSample: true,
      },
      {
        id: 'tc2',
        input: 'times = [[1,2,1]], n = 2, k = 1',
        expectedOutput: '1',
        isSample: true,
      },
      {
        id: 'tc3',
        input: 'times = [[1,2,1]], n = 2, k = 2',
        expectedOutput: '-1',
        isSample: true,
      }
    ],
    starterTemplates: {
      python: `import heapq
from collections import defaultdict

class Solution:
    def networkDelayTime(self, times: list[list[int]], n: int, k: int) -> int:
        adj = defaultdict(list)
        for u, v, w in times:
            adj[u].append((v, w))
            
        pq = [(0, k)]
        dist = {}
        
        while pq:
            d, node = heapq.heappop(pq)
            if node in dist:
                continue
            dist[node] = d
            for neighbor, weight in adj[node]:
                if neighbor not in dist:
                    heapq.heappush(pq, (d + weight, neighbor))
                    
        return max(dist.values()) if len(dist) == n else -1
`,
      cpp: `#include <vector>
#include <queue>
using namespace std;

class Solution {
public:
    int networkDelayTime(vector<vector<int>>& times, int n, int k) {
        vector<vector<pair<int, int>>> adj(n + 1);
        for (auto& t : times) adj[t[0]].push_back({t[1], t[2]});
        
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
        vector<int> dist(n + 1, 1e9);
        dist[k] = 0;
        pq.push({0, k});
        
        while (!pq.empty()) {
            auto [d, u] = pq.top(); pq.pop();
            if (d > dist[u]) continue;
            for (auto& [v, w] : adj[u]) {
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    pq.push({dist[v], v});
                }
            }
        }
        int maxDist = 0;
        for (int i = 1; i <= n; i++) {
            if (dist[i] == 1e9) return -1;
            maxDist = max(maxDist, dist[i]);
        }
        return maxDist;
    }
};
`,
      java: `import java.util.*;

class Solution {
    public int networkDelayTime(int[][] times, int n, int k) {
        Map<Integer, List<int[]>> adj = new HashMap<>();
        for (int[] t : times) {
            adj.computeIfAbsent(t[0], x -> new ArrayList<>()).add(new int[]{t[1], t[2]});
        }
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        pq.add(new int[]{0, k});
        Map<Integer, Integer> dist = new HashMap<>();
        
        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            int d = curr[0], u = curr[1];
            if (dist.containsKey(u)) continue;
            dist.put(u, d);
            if (adj.containsKey(u)) {
                for (int[] next : adj.get(u)) {
                    if (!dist.containsKey(next[0])) {
                        pq.add(new int[]{d + next[1], next[0]});
                    }
                }
            }
        }
        if (dist.size() != n) return -1;
        int max = 0;
        for (int val : dist.values()) max = Math.max(max, val);
        return max;
    }
}
`,
      javascript: `var networkDelayTime = function(times, n, k) {
    const dist = new Array(n + 1).fill(Infinity);
    dist[k] = 0;
    for (let i = 0; i < n - 1; i++) {
        for (let [u, v, w] of times) {
            if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
            }
        }
    }
    let maxTime = 0;
    for (let i = 1; i <= n; i++) {
        if (dist[i] === Infinity) return -1;
        maxTime = Math.max(maxTime, dist[i]);
    }
    return maxTime;
};
`,
      go: `func networkDelayTime(times [][]int, n int, k int) int {
    dist := make([]int, n+1)
    for i := range dist { dist[i] = 1e9 }
    dist[k] = 0
    for i := 0; i < n-1; i++ {
        for _, t := range times {
            u, v, w := t[0], t[1], t[2]
            if dist[u] != 1e9 && dist[u]+w < dist[v] {
                dist[v] = dist[u] + w
            }
        }
    }
    maxDist := 0
    for i := 1; i <= n; i++ {
        if dist[i] == 1e9 { return -1 }
        if dist[i] > maxDist { maxDist = dist[i] }
    }
    return maxDist
}
`,
      rust: `use std::collections::BinaryHeap;

impl Solution {
    pub fn network_delay_time(times: Vec<Vec<i32>>, n: i32, k: i32) -> i32 {
        let n = n as usize;
        let mut adj = vec![vec![]; n + 1];
        for t in times {
            adj[t[0] as usize].push((t[1] as usize, t[2]));
        }
        let mut dist = vec![i32::MAX; n + 1];
        dist[k as usize] = 0;
        let mut pq = BinaryHeap::new();
        pq.push((0, k as usize));
        
        while let Some((d, u)) = pq.pop() {
            let d = -d;
            if d > dist[u] { continue; }
            for &(v, w) in &adj[u] {
                if dist[u] + w < dist[v] {
                    dist[v] = dist[u] + w;
                    pq.push((-dist[v], v));
                }
            }
        }
        let mut ans = 0;
        for i in 1..=n {
            if dist[i] == i32::MAX { return -1; }
            ans = ans.max(dist[i]);
        }
        ans
    }
}
`
    }
  },
  {
    id: 'coin-change',
    slug: 'coin-change',
    title: 'Coin Change',
    difficulty: 'Medium',
    acceptanceRate: 42.1,
    solvedCount: 950,
    totalSubmissions: 2256,
    timeLimit: '2.0s',
    memoryLimit: '256MB',
    topics: ['Dynamic Programming'],
    author: 'Prof. Miller',
    isPublished: true,
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return *the fewest number of coins that you need to make up that amount*. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
    inputFormat: 'coins: array of integers, amount: integer.',
    outputFormat: 'Return minimum coin count or -1.',
    constraints: [
      '1 <= coins.length <= 12',
      '1 <= coins[i] <= 2^31 - 1',
      '0 <= amount <= 10^4'
    ],
    sampleCases: [
      {
        id: 'tc1',
        input: 'coins = [1,2,5], amount = 11',
        expectedOutput: '3',
        isSample: true,
        explanation: '11 = 5 + 5 + 1'
      },
      {
        id: 'tc2',
        input: 'coins = [2], amount = 3',
        expectedOutput: '-1',
        isSample: true,
      }
    ],
    starterTemplates: {
      python: `class Solution:
    def coinChange(self, coins: list[int], amount: int) -> int:
        dp = [float('inf')] * (amount + 1)
        dp[0] = 0
        for i in range(1, amount + 1):
            for c in coins:
                if i - c >= 0:
                    dp[i] = min(dp[i], dp[i - c] + 1)
        return dp[amount] if dp[amount] != float('inf') else -1
`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        vector<int> dp(amount + 1, 1e9);
        dp[0] = 0;
        for (int i = 1; i <= amount; ++i) {
            for (int c : coins) {
                if (i >= c) dp[i] = min(dp[i], dp[i - c] + 1);
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
};
`,
      java: `import java.util.Arrays;

class Solution {
    public int coinChange(int[] coins, int amount) {
        int max = amount + 1;
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, max);
        dp[0] = 0;
        for (int i = 1; i <= amount; i++) {
            for (int coin : coins) {
                if (i >= coin) dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
}
`,
      javascript: `var coinChange = function(coins, amount) {
    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    for (let i = 1; i <= amount; i++) {
        for (let coin of coins) {
            if (i >= coin) dp[i] = Math.min(dp[i], dp[i - coin] + 1);
        }
    }
    return dp[amount] === Infinity ? -1 : dp[amount];
};
`,
      go: `func coinChange(coins []int, amount int) int {
    dp := make([]int, amount+1)
    for i := 1; i <= amount; i++ { dp[i] = 1e9 }
    for i := 1; i <= amount; i++ {
        for _, c := range coins {
            if i >= c && dp[i-c]+1 < dp[i] {
                dp[i] = dp[i-c] + 1
            }
        }
    }
    if dp[amount] > amount { return -1 }
    return dp[amount]
}
`,
      rust: `impl Solution {
    pub fn coin_change(coins: Vec<i32>, amount: i32) -> i32 {
        let amount = amount as usize;
        let mut dp = vec![1e9 as i32; amount + 1];
        dp[0] = 0;
        for i in 1..=amount {
            for &c in &coins {
                if i >= c as usize {
                    dp[i] = dp[i].min(dp[i - c as usize] + 1);
                }
            }
        }
        if dp[amount] > amount as i32 { -1 } else { dp[amount] }
    }
}
`
    }
  },
  {
    id: 'min-cost-cut-stick',
    slug: 'min-cost-cut-stick',
    title: 'Minimum Cost to Cut a Stick',
    difficulty: 'Hard',
    acceptanceRate: 31.4,
    solvedCount: 210,
    totalSubmissions: 668,
    timeLimit: '3.0s',
    memoryLimit: '512MB',
    topics: ['Dynamic Programming', 'Sorting & Searching'],
    author: 'Guest Master - Grandmaster Alexey',
    isPublished: true,
    description: `Given a wooden stick of length \`n\` units. The stick is labelled from \`0\` to \`n\`. Given an integer array \`cuts\` where \`cuts[i]\` represents a position you should perform a cut at.

You should perform the cuts in any order, you can change the order of the cuts as you wish.

The cost of one cut is the length of the stick to be cut, the total cost is the sum of costs of all cuts. Return *the minimum total cost of the cuts*.`,
    inputFormat: 'n: integer, cuts: array of cut coordinates.',
    outputFormat: 'Return minimum total cut cost.',
    constraints: [
      '2 <= n <= 10^6',
      '1 <= cuts.length <= 100',
      '1 <= cuts[i] <= n - 1'
    ],
    sampleCases: [
      {
        id: 'tc1',
        input: 'n = 7, cuts = [1,3,4,5]',
        expectedOutput: '16',
        isSample: true,
      }
    ],
    starterTemplates: {
      python: `class Solution:
    def minCost(self, n: int, cuts: list[int]) -> int:
        c = sorted([0] + cuts + [n])
        m = len(c)
        dp = [[0] * m for _ in range(m)]
        for length in range(2, m):
            for i in range(m - length):
                j = i + length
                dp[i][j] = min(dp[i][k] + dp[k][j] for k in range(i + 1, j)) + c[j] - c[i]
        return dp[0][m - 1]
`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int minCost(int n, vector<int>& cuts) {
        cuts.push_back(0); cuts.push_back(n);
        sort(cuts.begin(), cuts.end());
        int m = cuts.size();
        vector<vector<int>> dp(m, vector<int>(m, 0));
        for (int len = 2; len < m; ++len) {
            for (int i = 0; i + len < m; ++i) {
                int j = i + len;
                int minVal = 1e9;
                for (int k = i + 1; k < j; ++k) {
                    minVal = min(minVal, dp[i][k] + dp[k][j]);
                }
                dp[i][j] = minVal + cuts[j] - cuts[i];
            }
        }
        return dp[0][m - 1];
    }
};
`,
      java: `import java.util.Arrays;

class Solution {
    public int minCost(int n, int[] cuts) {
        int m = cuts.length;
        int[] c = new int[m + 2];
        System.arraycopy(cuts, 0, c, 1, m);
        c[m + 1] = n;
        Arrays.sort(c);
        int[][] dp = new int[m + 2][m + 2];
        for (int len = 2; len < m + 2; len++) {
            for (int i = 0; i + len < m + 2; i++) {
                int j = i + len;
                int min = Integer.MAX_VALUE;
                for (int k = i + 1; k < j; k++) {
                    min = Math.min(min, dp[i][k] + dp[k][j]);
                }
                dp[i][j] = min + c[j] - c[i];
            }
        }
        return dp[0][m + 1];
    }
}
`,
      javascript: `var minCost = function(n, cuts) {
    const c = [0, ...cuts.sort((a,b)=>a-b), n];
    const m = c.length;
    const dp = Array.from({length: m}, () => new Array(m).fill(0));
    for (let len = 2; len < m; len++) {
        for (let i = 0; i + len < m; i++) {
            let j = i + len;
            let minVal = Infinity;
            for (let k = i + 1; k < j; k++) {
                minVal = Math.min(minVal, dp[i][k] + dp[k][j]);
            }
            dp[i][j] = minVal + c[j] - c[i];
        }
    }
    return dp[0][m - 1];
};
`,
      go: `func minCost(n int, cuts []int) int {
    return 0
}
`,
      rust: `impl Solution {
    pub fn min_cost(n: i32, cuts: Vec<i32>) -> i32 {
        0
    }
}
`
    }
  }
];

export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 'a3f9c2e1',
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    difficulty: 'Easy',
    userId: 'usr_priya_123',
    userName: 'Priya Sharma',
    userHandle: 'priya_s',
    language: 'python',
    verdict: 'Accepted',
    runtimeMs: 42,
    memoryMb: 14.2,
    passedTests: 25,
    totalTests: 25,
    score: 100,
    submittedAt: '12 minutes ago',
    code: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in seen:
                return [seen[diff], i]
            seen[num] = i
        return []
`,
    testDetails: [
      { caseNumber: 1, input: 'nums = [2,7,11,15], target = 9', expected: '[0, 1]', actual: '[0, 1]', passed: true, runtimeMs: 3 },
      { caseNumber: 2, input: 'nums = [3,2,4], target = 6', expected: '[1, 2]', actual: '[1, 2]', passed: true, runtimeMs: 2 },
      { caseNumber: 3, input: 'nums = [3,3], target = 6', expected: '[0, 1]', actual: '[0, 1]', passed: true, runtimeMs: 2 },
    ]
  },
  {
    id: 'b7x11d88',
    problemId: 'course-schedule-ii',
    problemTitle: 'Course Schedule II',
    difficulty: 'Medium',
    userId: 'usr_priya_123',
    userName: 'Priya Sharma',
    userHandle: 'priya_s',
    language: 'cpp',
    verdict: 'Accepted',
    runtimeMs: 18,
    memoryMb: 13.5,
    passedTests: 44,
    totalTests: 44,
    score: 100,
    submittedAt: '2 hours ago',
    code: `#include <vector>
#include <queue>
using namespace std;

class Solution {
public:
    vector<int> findOrder(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> adj(numCourses);
        vector<int> indegree(numCourses, 0);
        for (auto& p : prerequisites) {
            adj[p[1]].push_back(p[0]);
            indegree[p[0]]++;
        }
        queue<int> q;
        for (int i = 0; i < numCourses; i++) {
            if (indegree[i] == 0) q.push(i);
        }
        vector<int> order;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            order.push_back(u);
            for (int v : adj[u]) {
                if (--indegree[v] == 0) q.push(v);
            }
        }
        return order.size() == numCourses ? order : vector<int>();
    }
};`
  },
  {
    id: 'c998f410',
    problemId: 'network-delay-time',
    problemTitle: 'Network Delay Time',
    difficulty: 'Medium',
    userId: 'usr_priya_123',
    userName: 'Priya Sharma',
    userHandle: 'priya_s',
    language: 'python',
    verdict: 'Wrong Answer',
    runtimeMs: 54,
    memoryMb: 16.1,
    passedTests: 18,
    totalTests: 32,
    score: 56.25,
    submittedAt: 'Yesterday',
    code: `class Solution:
    def networkDelayTime(self, times: list[list[int]], n: int, k: int) -> int:
        # Simple BFS bugged on edge weights
        return 2
`,
    testDetails: [
      { caseNumber: 1, input: 'times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2', expected: '2', actual: '2', passed: true, runtimeMs: 4 },
      { caseNumber: 2, input: 'times = [[1,2,1]], n = 2, k = 1', expected: '1', actual: '2', passed: false, runtimeMs: 3 },
    ]
  },
  {
    id: 'd102e33f',
    problemId: 'coin-change',
    problemTitle: 'Coin Change',
    difficulty: 'Medium',
    userId: 'usr_priya_123',
    userName: 'Priya Sharma',
    userHandle: 'priya_s',
    language: 'java',
    verdict: 'Time Limit Exceeded',
    runtimeMs: 2000,
    memoryMb: 45.0,
    passedTests: 12,
    totalTests: 50,
    score: 24,
    submittedAt: '3 days ago',
    code: `// Unmemoized recursive approach
class Solution {
    public int coinChange(int[] coins, int amount) {
        if (amount == 0) return 0;
        int min = Integer.MAX_VALUE;
        for (int c : coins) {
            if (amount - c >= 0) {
                int res = coinChange(coins, amount - c);
                if (res != -1) min = Math.min(min, res + 1);
            }
        }
        return min == Integer.MAX_VALUE ? -1 : min;
    }
}`
  }
];

export const MOCK_LEADERBOARD: LeaderboardUser[] = [
  {
    rank: 1,
    id: 'usr_alexey',
    name: 'Alexey Ivanov',
    handle: 'alexey_v',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 2420,
    solvedCount: 284,
    streakDays: 45,
    points: 3840,
    cohort: 'M.S. Computer Science'
  },
  {
    rank: 2,
    id: 'usr_sarah',
    name: 'Sarah Chen',
    handle: 'schen99',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    rating: 2210,
    solvedCount: 241,
    streakDays: 29,
    points: 3520,
    cohort: 'B.S. Software Eng, Sr'
  },
  {
    rank: 3,
    id: 'usr_marcus',
    name: 'Marcus Vance',
    handle: 'mvance',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rating: 2050,
    solvedCount: 198,
    streakDays: 18,
    points: 3110,
    cohort: 'B.S. Computer Science, Jr'
  },
  {
    rank: 4,
    id: 'usr_tourist_mock',
    name: 'Gennady Korotkevich',
    handle: 'tourist_sodak',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    rating: 1980,
    solvedCount: 185,
    streakDays: 14,
    points: 2950,
    cohort: 'Exchange Fellow'
  },
  {
    rank: 5,
    id: 'usr_emily',
    name: 'Emily Watson',
    handle: 'ewatson',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    rating: 1890,
    solvedCount: 162,
    streakDays: 21,
    points: 2780,
    cohort: 'B.S. Data Science'
  },
  {
    rank: 142,
    id: 'usr_priya_123',
    name: 'Priya Sharma',
    handle: 'priya_s',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 1450,
    solvedCount: 47,
    streakDays: 12,
    points: 1450,
    cohort: 'B.S. CS Senior',
    isCurrentUser: true
  }
];

export const MOCK_CONTESTS: Contest[] = [
  {
    id: 'weekly-challenge-142',
    title: 'Sodak Weekly Challenge #142',
    description: 'Weekly university contest testing speed and accuracy across standard CS algorithms.',
    status: 'LIVE',
    startTime: 'Today, 14:00 EST',
    endTime: 'Today, 15:30 EST',
    durationMinutes: 90,
    registeredUsersCount: 184,
    isRegistered: true,
    myRank: 87,
    myScore: 100,
    maxScore: 600,
    problems: [
      { problemId: 'two-sum', title: 'Two Sum II', difficulty: 'Easy', points: 100, label: 'A', solvedCount: 142 },
      { problemId: 'course-schedule-ii', title: 'Course Order Validation', difficulty: 'Medium', points: 150, label: 'B', solvedCount: 68 },
      { problemId: 'coin-change', title: 'Minimum Coin Combination', difficulty: 'Medium', points: 150, label: 'C', solvedCount: 31 },
      { problemId: 'min-cost-cut-stick', title: 'Optimal Wooden Partition', difficulty: 'Hard', points: 200, label: 'D', solvedCount: 5 }
    ]
  },
  {
    id: 'biweekly-blitz-48',
    title: 'Bi-Weekly Speed Blitz #48',
    description: 'High-speed 60-minute sprint featuring 3 short algorithmic puzzles.',
    status: 'UPCOMING',
    startTime: 'In 2 days, 18:00 EST',
    endTime: 'In 2 days, 19:00 EST',
    durationMinutes: 60,
    registeredUsersCount: 92,
    isRegistered: true,
    problems: [
      { problemId: 'two-sum', title: 'Target Pair Finder', difficulty: 'Easy', points: 100, label: 'A', solvedCount: 0 },
      { problemId: 'valid-anagram', title: 'Anagram Validation', difficulty: 'Easy', points: 100, label: 'B', solvedCount: 0 },
      { problemId: 'coin-change', title: 'Fast Change Calculator', difficulty: 'Medium', points: 200, label: 'C', solvedCount: 0 }
    ]
  },
  {
    id: 'algo-sprint-2026',
    title: 'Sodak Annual Algorithm Sprint 2026',
    description: 'The premier department-wide contest sponsored by tech partners with prizes for top coders.',
    status: 'UPCOMING',
    startTime: 'In 5 days, 10:00 EST',
    endTime: 'In 5 days, 13:00 EST',
    durationMinutes: 180,
    registeredUsersCount: 310,
    isRegistered: false,
    problems: [
      { problemId: 'course-schedule-ii', title: 'Prerequisite Graph Ordering', difficulty: 'Medium', points: 150, label: 'A', solvedCount: 0 },
      { problemId: 'network-delay-time', title: 'Dijkstra Network Transmission', difficulty: 'Medium', points: 200, label: 'B', solvedCount: 0 },
      { problemId: 'min-cost-cut-stick', title: 'DP Wooden Partitioning', difficulty: 'Hard', points: 250, label: 'C', solvedCount: 0 }
    ]
  },
  {
    id: 'weekly-challenge-141',
    title: 'Sodak Weekly Challenge #141',
    description: 'Past weekly challenge featuring Graph Traversal and Matrix DP.',
    status: 'PAST',
    startTime: 'Last Week',
    endTime: 'Last Week',
    durationMinutes: 90,
    registeredUsersCount: 165,
    isRegistered: true,
    myRank: 42,
    myScore: 350,
    maxScore: 600,
    problems: [
      { problemId: 'valid-anagram', title: 'Anagram Check', difficulty: 'Easy', points: 100, label: 'A', solvedCount: 150 },
      { problemId: 'course-schedule-ii', title: 'Topological Sort', difficulty: 'Medium', points: 150, label: 'B', solvedCount: 95 },
      { problemId: 'network-delay-time', title: 'Shortest Path Latency', difficulty: 'Medium', points: 150, label: 'C', solvedCount: 42 }
    ]
  }
];

export const MOCK_ADMIN_USERS = [
  { id: 'usr_admin_1', name: 'Dr. Robert Vance', handle: 'vance_prof', email: 'vance@sodak.edu', role: 'Super Admin', solved: 210, submissions: 420, joined: 'Jan 2022', status: 'Active' },
  { id: 'usr_admin_2', name: 'Prof. Helen Miller', handle: 'hmiller', email: 'hmiller@sodak.edu', role: 'Admin', solved: 180, submissions: 310, joined: 'Aug 2022', status: 'Active' },
  { id: 'usr_priya_123', name: 'Priya Sharma', handle: 'priya_s', email: 'priya.sharma@sodak.edu', role: 'Student', solved: 47, submissions: 112, joined: 'Sep 2023', status: 'Active' },
  { id: 'usr_alexey', name: 'Alexey Ivanov', handle: 'alexey_v', email: 'a.ivanov@sodak.edu', role: 'Problem Setter', solved: 284, submissions: 580, joined: 'Sep 2022', status: 'Active' },
  { id: 'usr_sarah', name: 'Sarah Chen', handle: 'schen99', email: 'schen99@sodak.edu', role: 'Contest Manager', solved: 241, submissions: 490, joined: 'Jan 2023', status: 'Active' },
  { id: 'usr_bad_actor', name: 'John Doe (Guest)', handle: 'jdoe99', email: 'jdoe@external.com', role: 'Student', solved: 2, submissions: 15, joined: 'May 2024', status: 'Disabled' },
];
