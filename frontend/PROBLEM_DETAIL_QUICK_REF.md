# Problem Detail Screen - Quick Reference

## Access the Page

**URL**: `/problems/[slug]`

Example URLs:
- `/problems/two-sum`
- `/problems/reverse-string`
- `/problems/binary-search`

## Layout Overview

```
┌───────────────────────────┬──────────────────────────┐
│   LEFT PANE (50%)         │   RIGHT PANE (50%)       │
│ Description               │ Code Editor              │
│ Editorial (Locked)        │ • Language selector      │
│ Submissions               │ • Syntax highlighting    │
│                           │ • Run/Submit buttons     │
│                           │                          │
│                           │ Results Panel            │
│                           │ • Console output         │
│                           │ • Test cases (expand)    │
└───────────────────────────┴──────────────────────────┘
```

**Draggable divider** between panes (blue highlight on hover)

## Left Pane Tabs

### Description Tab
- Problem title + difficulty badge
- Acceptance rate & submission count
- Topic tags
- Full statement (markdown)
- Example input/output pairs
- Constraints & limits
- Worked examples

### Editorial Tab
- **LOCKED by default** (shows lock UI)
- Unlock via:
  1. Solve the problem (Accepted)
  2. Make 3 attempts (progress bar)
  3. Wait 24 hours (countdown)
- Once unlocked: Shows solution explanations & approaches

### Submissions Tab
- Your submission history
- Status badge (Accepted/Wrong Answer/TLE/etc)
- Language, runtime, memory
- Clickable to expand and see test results

## Right Pane: Editor

### Toolbar
- **Language**: Select programming language
- **Run**: Execute sample tests only (secondary button)
- **Submit**: Submit for full judging (primary button)
- **Copy**: Copy code to clipboard
- **Theme/Font Size**: Editor preferences

### Editor
- Full syntax highlighting
- Line numbers
- Keyboard shortcuts (Ctrl+Enter to submit)
- Debounced auto-save

### Results Panel (Below Editor)

**Tabs**:
1. **Console**: Program output & errors
2. **Test Cases**: Per-test results ← **START HERE**
3. **Output**: Raw output

**Test Cases**:
- Green dot = Passed
- Red dot = Failed
- Click to expand and see:
  - Input (blue background)
  - Expected (green background)
  - Actual (green/red based on result)
  - Runtime & memory

## Workflows

### Run Sample Tests
```
1. Write code in editor
2. Click "Run" button
3. See sample tests execute in Test Cases tab
4. Compare expected vs actual output
```

### Submit Solution
```
1. Write code in editor
2. Click "Submit" button
3. See "Submission pending..." instantly (optimistic)
4. Panel polls for verdict every 1 second
5. Results appear when ready
6. Click test cases to view details
```

### View Editorial
```
1. Solve problem (Accepted) OR make 3 attempts OR wait 24h
2. Click "Editorial" tab
3. View solution explanations & code examples
4. Compare with your approach
```

### Check Submission History
```
1. Click "Submissions" tab
2. See all your attempts with verdicts
3. Click any to expand and view test details
```

## Key Features

✅ **Non-blocking Submit**: Shows pending immediately, polls in background
✅ **Expandable Tests**: Click any test to see input/expected/actual
✅ **Draggable Divider**: Resize panes by dragging the divider
✅ **Language Support**: JavaScript, Python, C++, Java, C#, Go, Rust
✅ **Syntax Highlighting**: Full language support with CodeMirror
✅ **Dark Theme**: Dark mode optimized with Sodak colors
✅ **Mobile Responsive**: Stacked layout on smaller screens
✅ **Lock UI**: Editorial locked by design, shows progress

## Buttons & Controls

| Button | Style | Action | Scope |
|--------|-------|--------|-------|
| Run | Secondary (gray) | Run tests | Sample cases only |
| Submit | Primary (blue) | Submit solution | All test cases |
| Copy | Secondary | Copy code to clipboard | Current code |
| Language | Dropdown | Switch programming language | Editor |

## Color Codes

| Color | Meaning |
|-------|---------|
| 🟢 Green dot | Test case passed |
| 🔴 Red dot | Test case failed |
| 🔵 Blue | Input data |
| 🟢 Green bg | Expected output |
| 🟢 Green bg | Actual output (if pass) |
| 🔴 Red bg | Actual output (if fail) |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Submit solution |
| `Ctrl + C` | Copy code |
| `Tab` | Indent code |
| `Shift + Tab` | Unindent code |

## Editorial Lock States

### Locked State Shows:
```
[🔒] Editorial is Locked

Unlock by doing ONE of these:
☐ Solve the problem (get "Accepted")
☐ Make 3 genuine attempts [===-] 2/3
⏱ Wait 24 hours [======---] 18h remaining
```

### Unlocked State Shows:
```
Solution explanation with:
- Multiple approaches
- Code examples
- Time/space complexity
- Trade-off discussions
```

## Result States

### After "Run":
```
✓ 3/3 Test Cases Passed
Runtime: 12ms
Memory: 2.1MB
```

### After "Submit" (Pending):
```
⏳ Pending
Submission queued...
(polls every 1 second)
```

### After Verdict:
```
✓ Accepted
Runtime: 8ms  
Memory: 2.3MB

Test Cases [3]:
✓ Test 1
✓ Test 2
✓ Test 3
```

Or:

```
✗ Wrong Answer
Runtime: 10ms
Memory: 2.5MB

Test Cases [5]:
✓ Test 1
✓ Test 2
✗ Test 3
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Page shows 404 | Verify slug matches problem ID |
| Editor not loading | Refresh page, check browser console |
| Submit never returns | Check network tab, might be backend issue |
| Lock UI shows wrong time | API backend might not be returning correct data |
| Test cases not showing | Ensure test data returned from API |

## API Integration

Once backend connected:

1. **Environment Variables**:
   ```
   NEXT_PUBLIC_JUDGE_API_URL=https://api.judge/
   ```

2. **Endpoints Needed**:
   ```
   GET    /problems/:slug
   POST   /solutions/run
   POST   /solutions/submit
   GET    /judge/verdict/:submissionId
   ```

3. **Response Format**:
   ```typescript
   // Problem
   { id, slug, title, difficulty, description, 
     examples, constraints, editorial_unlocked }
   
   // Execution result
   { verdict, runtime, memory, 
     testCases: [{ input, expected, actual, 
                   status, runtime, memory }] }
   ```

## Performance Tips

✅ Results load instantly (optimistic update)
✅ Polling non-blocking (UI always responsive)
✅ Editor debounced (500ms, reduces API calls)
✅ Components memoized (prevent re-renders)
✅ Lazy loading (components load on demand)

---

**Status**: Production Ready  
**Last Updated**: 2026-07-31  
**Documentation**: See PROBLEM_DETAIL_PAGE.md for full reference
