# Problem Detail Page Documentation

## Overview

The Problem Detail Page (`/problems/[slug]`) is a high-performance, responsive interface for solving competitive programming problems. It features a split-pane layout with a draggable divider, an advanced code editor, and real-time execution feedback.

## Route

**URL:** `/problems/[slug]`

Example: `/problems/two-sum`, `/problems/reverse-string`, etc.

The slug is matched against both the problem ID and slug field for flexibility.

## Layout

### Two-Pane Split Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         App Shell                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Left Pane (50%)        │  Right Pane (50%)                    │
│  ────────────────────   │  ─────────────────                   │
│                         │                                      │
│  Tabs:                  │  Code Editor                        │
│  ├─ Description         │  (CodeMirror 6)                    │
│  ├─ Editorial (LOCKED)  │                                      │
│  └─ Submissions         │  ┌───────────────────────────┐      │
│                         │  │ Toolbar:                  │      │
│  Tab Content            │  │ • Language selector       │      │
│  ├─ Problem statement   │  │ • Run button (secondary)  │      │
│  │ ├─ Title & difficulty│  │ • Submit button (primary) │      │
│  │ ├─ Tags              │  │ • Copy button             │      │
│  │ ├─ Description       │  └───────────────────────────┘      │
│  │ ├─ Examples          │                                      │
│  │ ├─ Time/Memory limits│  Editor                            │
│  │ └─ Constraints       │  (language syntax highlighting)     │
│  │                      │                                      │
│  └─ Editorial (Locked) │  ┌───────────────────────────┐      │
│     └─ Lock UI:        │  │ Results Panel (Draggable  │      │
│        • 3 Unlock      │  │ Divider)                  │      │
│          conditions    │  │                           │      │
│        • Progress bars │  │ Tabs:                     │      │
│        • Countdown     │  │ • Console                 │      │
│                        │  │ • Test Cases              │      │
│  └─ Submissions:       │  │ • Output                  │      │
│     • Verdict badge    │  │                           │      │
│     • Runtime/Memory   │  │ Test Cases:               │      │
│     • Expandable rows  │  │ (Expandable per-group)    │      │
│                        │  └───────────────────────────┘      │
│                        │                                      │
└────────────────────────┴──────────────────────────────────────┘
```

## Features

### Left Pane: Problem Details

#### Description Tab

- **Title & Difficulty Badge**: Problem name with color-coded difficulty (Easy/Medium/Hard)
- **Metadata**: Acceptance rate, total submissions
- **Tags**: Topic tags as clickable chips
- **Problem Statement**: Full problem description with markdown rendering
- **Examples**: Sample test cases with input/output blocks
- **Constraints**: Time and memory limits
- **Worked Examples**: Formatted input/output pairs

#### Editorial Tab

**Status**: Locked by default

Unlock conditions (any one):
1. Solve the problem (get "Accepted" verdict)
2. Make 3 genuine attempts (tracked submission counter)
3. Wait 24 hours (countdown timer)

**Lock UI** shows:
- Visual lock icon
- Progress for each condition
- Countdown timer for 24-hour wait
- Progress bars for attempt tracking

**Content** (when unlocked):
- Solution explanations
- Multiple approaches with complexity analysis
- Code examples
- Trade-off discussions

#### Submissions Tab

Shows user's submission history:
- Status badge (Accepted, Wrong Answer, TLE, etc.)
- Language used
- Runtime and memory
- Relative submission time
- **Expandable rows** to view per-test-group results

### Right Pane: Code Editor & Results

#### Toolbar

Located at top of editor:
- **Language selector** dropdown (JavaScript, Python, C++, Java, C#)
- **Copy button** (copies code to clipboard)
- **Run button** (secondary style, runs sample tests only)
- **Submit button** (primary style, runs all tests)

#### CodeMirror 6 Editor

- **Language syntax highlighting** based on selected language
- **Debounced onChange** events (500ms) for performance
- **Keyboard shortcuts** (Ctrl+Enter to submit)
- **Line numbers and visual guides**
- **Automatic indentation**

#### Results Panel

Three tabs: Console | Test Cases | Output

**Test Cases Tab** (Primary):
- One row per sample test case
- Status indicator (green dot = passed, red dot = failed)
- Expandable rows show:
  - Input
  - Expected output
  - Actual output
  - Runtime (ms)
  - Memory (MB)
- Color-coded output comparison (green for pass, red for fail)

**Console Tab**:
- Program output and logs
- Error messages
- Runtime errors displayed here

**Output Tab**:
- Raw execution output
- Submission result summary

## Behavior

### Run (Sample Tests Only)

1. **Trigger**: Click "Run" button or Ctrl+Enter
2. **Scope**: Executes only against example/sample test cases
3. **UI State**: Shows "Running..." while executing
4. **Results**: Test cases populated in Results panel
5. **No Blocking**: UI remains responsive

### Submit (All Tests)

1. **Trigger**: Click "Submit" button
2. **Immediate Feedback**: Shows "pending" verdict and queued message instantly (optimistic update)
3. **UI State**: Submit button disabled, shows "Submitting..."
4. **Polling**: Starts polling `/api/judge/verdict` every 1 second
5. **Poll Limit**: 30-second maximum (30 polls)
6. **Result Display**: When verdict received:
   - Verdict badge updates (Accepted, Wrong Answer, TLE, etc.)
   - Test cases populate with pass/fail status
   - Runtime and memory displayed
   - Results panel shows full feedback

**Key**: Never blocks on network—UI updates immediately with pending state.

### Lock State (Editorial)

By default, editorial shows a locked UI explaining:
- The three unlock conditions
- Visual progress toward each condition
- Countdown timer for 24-hour wait

The API response includes `editorial_unlocked` boolean:
- `false`: Never fetch/render content, just show lock
- `true`: Render the editorial content

This prevents fetching content only to hide it.

## API Integration

### Required Endpoints

```
GET /api/problems/:slug     - Get problem details
POST /api/solutions/run     - Run sample tests
POST /api/solutions/submit  - Submit solution
GET /api/judge/verdict/:id  - Poll submission verdict
```

### Response Types

```typescript
// Problem detail
{
  id: string
  slug: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  description: string
  examples: TestCase[]
  constraints: string[]
  tags: string[]
  acceptanceRate: number
  editorial_unlocked: boolean  // Key: don't fetch if false
}

// Execution result
{
  verdict: VerdictStatus
  runtime: number      // ms
  memory: number       // MB
  testCases: [{
    id: string
    caseNumber: number
    input: string
    expected: string
    actual: string
    status: 'accepted' | 'wrong_answer' | ...
    runtime: number
    memory: number
  }]
}

// Submission for polling
{
  id: string
  verdict: 'pending' | 'running' | 'accepted' | ...
  runtime: number
  memory: number
}
```

## Performance Optimizations

1. **Dynamic Imports**: CodeEditor, ResultsPanel, and tab content lazily loaded
2. **Component Memoization**: Sidebar, TopBar, all components wrapped in memo()
3. **Debounced Events**: 500ms debounce on code changes
4. **useCallback Handlers**: Event handlers are stable references
5. **Split Pane**: Draggable divider with smooth constraints (20%-80%)
6. **Polling Non-Blocking**: Submit polls in background, UI updates optimistically

## Dark Mode Design

- **Colors**: Uses Sodak token system (primary blue #2d5fff, accent orange)
- **Typography**: Geist Sans (headings), Inter (body), JetBrains Mono (code)
- **Contrast**: WCAG AA compliant throughout
- **Code Blocks**: Distinct syntax highlighting per language

## Mobile Responsive

- **Desktop**: Full split-pane side-by-side layout
- **Tablet**: Stacked layout with tabs to switch panels
- **Mobile**: Full-width stacking with clear separation

## Usage Example

```typescript
// Access problem by slug
// Navigate to: /problems/two-sum

// User flow:
1. Page loads, problem fetches via getProblem('two-sum')
2. Code editor shows with language selector
3. User writes solution and clicks "Run"
4. Sample tests execute, results appear in panel
5. User clicks "Submit"
6. Shows "pending" state immediately
7. Polls every 1s for verdict
8. When ready, shows full results with all test cases
9. If wrong answer, user can view expected vs actual
10. User can view editorial after 3 attempts or 24 hours
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Page shows 404 | Check slug matches problem in mock data or backend |
| Editor not loading | Ensure CodeMirror is installed (`pnpm add @codemirror/*`) |
| Submit never completes | Check polling endpoint responds correctly |
| Lock UI shows incorrect time | Verify backend returns correct hours remaining |
| Results don't show | Ensure test case data includes all required fields |
| Syntax highlighting missing | Verify language is in languageMap |

## Future Enhancements

- [ ] Collaborative code editor
- [ ] AI-powered hints
- [ ] Discussion/comments section
- [ ] Solution code snippets
- [ ] Time tracking
- [ ] Difficulty rating by user
- [ ] Problem difficulty adjustment based on solve rate

---

Created: 2026-07-31  
Last Updated: 2026-07-31  
Status: Production Ready
