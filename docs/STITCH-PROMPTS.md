# Google Stitch prompts

Complete, self-contained prompts for designing each Sodak-Tech screen.

**Each prompt below is standalone.** Copy one whole block into a new Stitch
conversation — it carries the project description, the design system, and the
screen specification. Nothing needs to be pasted first.

---

## How the output gets used

Stitch produces **visual designs and standalone HTML/CSS**, and exports to Figma.
It does not produce React components wired to an API.

This project already has a working Next.js app with a design system, a typed API
client, and real backend endpoints. **Do not paste Stitch's HTML into
`frontend/`.** It would arrive with its own colours, its own class names, and no
connection to the data layer — the same problem the earlier v0 output caused,
which took a day to unpick.

**The workflow:**

1. Generate the screen in Stitch until layout and hierarchy look right.
2. Screenshot at desktop width, or export to Figma and export a PNG.
3. Save into `design/frames/` using the naming in [design/README.md](../design/README.md).
4. Tell me which screen it is — I implement it against the real components and API.

**Working notes:** one screen per conversation; refine by chatting ("narrower
sidebar", "remove the gradient") rather than rewriting the prompt; use
Experimental mode for screens 5, 12, and 13, Standard for the rest.

---

## Screen index

| # | Screen | Priority |
|---|---|---|
| 1 | Login | Alpha |
| 2 | Register | Alpha |
| 3 | Student dashboard | Alpha |
| 4 | Problem list | Alpha |
| 5 | **Problem workspace (editor)** | **Alpha — do this first** |
| 6 | Submission detail | Alpha |
| 7 | Leaderboard | Later |
| 8 | Contest list | Later |
| 9 | Contest detail | Later |
| 10 | User profile | Later |
| 11 | Settings | Alpha |
| 12 | Admin overview | Alpha |
| 13 | **Admin test group editor** | **Alpha — hardest screen** |
| 14 | Admin problem authoring | Alpha |
| 15 | Admin users | Alpha |
| 16 | Admin audit log | Alpha |
| 17 | Empty states and errors | Alpha |

---

# 1. Login

```
Design a login screen for Sodak-Tech.

ABOUT THE PRODUCT
Sodak-Tech is a competitive programming practice platform used by a university.
Students solve algorithm problems in a browser code editor, submit their code,
and it is automatically judged against hidden test cases. They get a verdict
(Accepted, Wrong Answer, Time Limit Exceeded), a score, and progress tracking.
They also compete in timed contests with live standings and a rating system.
Think LeetCode or HackerRank, built for one institution.

Users are computer science students aged 18-24, plus faculty who author problems.
They use it for hours at a time, often under time pressure during contests.

DESIGN LANGUAGE
A professional productivity tool, not a marketing website. Reference points:
Linear, GitHub, Stripe Dashboard, DataLemur. Clean, dense, fast, information
first. The interface should recede so the user can focus on their work.

Forbidden: hero sections, marketing copy, decorative illustrations, gradients,
glassmorphism, neumorphism, heavy shadows, stock photography, gaming aesthetics,
particle effects, parallax.

THEME: Light mode. White cards on a very light grey page.

COLOURS
Page background   #F7F8FA
Card background   #FFFFFF
Hover / inset     #F1F3F7
Primary text      #14181F
Secondary text    #5B6474
Border            #E3E7EE   1px hairline — borders separate, not shadows
Primary accent    #2573E6   buttons, links, active states
Success           #0F7A3D
Warning           #A15C00
Danger            #C62828

TYPOGRAPHY
Inter for all UI text. JetBrains Mono for code, IDs, and numbers.
Body 14px, secondary 13px, caption 12px. Headings semibold, tight tracking.

LAYOUT
8-point spacing scale: 8, 16, 24, 32, 48.
Radius 8px on buttons and inputs, 12px on cards.
Desktop 1440px wide.

THE SCREEN
Full-height split layout.

LEFT PANEL (55%) — light grey #F7F8FA:
Top left: a small rounded square logo mark with the letter S, next to the
wordmark "Sodak-Tech".
Vertically centred: headline "Practice. Compete. Improve." in large semibold
text, and one supporting line "Sharpen your algorithms with instant automated
feedback."
Below that, three feature rows stacked with 24px gaps. Each row is a small
outline icon in a light circle, then a bold label and a grey description line:
  - "Real-time editor" / "Write and run code without leaving the browser"
  - "Instant verdicts" / "Automated judging against hidden test cases"
  - "Timed contests" / "Compete with live standings and ratings"
Bottom left: small grey text "Sri Sai University · Department of Computer Science".

RIGHT PANEL (45%) — white:
Centred form card, max width 380px, no border or shadow — it sits directly on
white.
"Sign in" heading, 24px semibold.
Subtitle "Continue to your dashboard" in secondary grey.
32px gap, then the form:
  - Email field with label above
  - Password field with label above and a show/hide eye icon inside on the right
  - A row: "Remember me" checkbox on the left, "Forgot password?" blue link right
  - Full-width solid blue primary button "Sign in", 40px tall
  - A divider line with the word "or" centred on it
  - Full-width outlined button "Continue with Google" with the Google mark
  - Footer line, centred: "New here? Create an account" with the last two words
    as a blue link

STATES TO SHOW
Render the password field in its error state: red border, and red 13px text
beneath reading "Incorrect email or password."
```

---

# 2. Register

```
Design a registration screen for Sodak-Tech.

ABOUT THE PRODUCT
Sodak-Tech is a competitive programming practice platform used by a university.
Students solve algorithm problems in a browser code editor, submit code, and it
is automatically judged against hidden test cases producing a verdict and score.
They also compete in timed contests with ratings. Think LeetCode built for one
institution. Users are CS students aged 18-24 plus faculty who author problems.

DESIGN LANGUAGE
A professional productivity tool, not a marketing website. Reference points:
Linear, GitHub, Stripe Dashboard. Clean, dense, information first.
Forbidden: hero sections, marketing copy, illustrations, gradients,
glassmorphism, heavy shadows, stock photography, gaming aesthetics.

THEME: Light mode. White cards on a very light grey page.

COLOURS
Page #F7F8FA · Card #FFFFFF · Inset #F1F3F7 · Text #14181F ·
Secondary #5B6474 · Border #E3E7EE (1px hairline) · Accent #2573E6 ·
Success #0F7A3D · Warning #A15C00 · Danger #C62828

TYPOGRAPHY
Inter for UI, JetBrains Mono for code and numbers.
Body 14px, secondary 13px, caption 12px. Headings semibold, tight tracking.

LAYOUT
8-point spacing: 8, 16, 24, 32, 48. Radius 8px controls, 12px cards.
Desktop 1440px.

THE SCREEN
Same split layout as the login screen — light grey left panel with the product
pitch, white right panel with the form.

LEFT PANEL (55%): logo and wordmark top left. Centred headline "Join the
platform." Below it, three short value lines with small icons: "312 problems
across 14 topics", "Weekly rated contests", "Track your progress by topic".

RIGHT PANEL (45%), form card max width 400px:
"Create your account" heading, subtitle "It takes less than a minute."
Fields, each with a label above and a 13px grey hint below where noted:
  - Display name
  - Username — with an inline status on the right of the input
  - Email — hint "Use your university email if you have one"
  - Password — with a four-segment strength meter directly beneath, and hint
    "At least 12 characters"
  - Confirm password
  - A checkbox row: "I agree to the terms of use and privacy policy" with the
    last two phrases as blue links
  - Full-width solid blue button "Create account"
  - Centred footer "Already have an account? Sign in"

STATES TO SHOW
Username field showing a green check icon inside the right edge with green 13px
text beneath reading "Available".
Password strength meter filled to three of four segments in amber, with the
label "Good" to its right.
```

---

# 3. Student dashboard

```
Design the main dashboard for Sodak-Tech.

ABOUT THE PRODUCT
Sodak-Tech is a competitive programming practice platform used by a university.
Students solve algorithm problems in a browser code editor, submit code, and it
is automatically judged against hidden test cases. Each submission gets a verdict
(Accepted, Wrong Answer, Time Limit Exceeded, Runtime Error) and a score from
weighted test groups. Students track progress per topic and compete in timed,
rated contests. Think LeetCode built for one institution.

This is the screen a student sees on signing in. It should answer three questions
instantly: how am I doing, what should I work on next, and what is happening now.

DESIGN LANGUAGE
A professional productivity tool, not a marketing website. Reference points:
Linear, GitHub, Stripe Dashboard. Clean, dense, information first. Use a modular
bento grid of cards — every card is one idea.
Forbidden: hero sections, marketing copy, illustrations, gradients,
glassmorphism, heavy shadows, gaming aesthetics, decorative animation.

THEME: Light mode. White cards on a very light grey page.

COLOURS
Page #F7F8FA · Card #FFFFFF · Inset #F1F3F7 · Text #14181F ·
Secondary #5B6474 · Border #E3E7EE (1px hairline) · Accent #2573E6 ·
Success #0F7A3D · Warning #A15C00 · Danger #C62828

TYPOGRAPHY
Inter for UI, JetBrains Mono for numbers, code, runtimes, and IDs.
Body 14px, secondary 13px, caption 12px. Large stat figures 28px semibold.
All numeric columns use tabular figures so digits do not shift.

LAYOUT
8-point spacing: 8, 16, 24, 32, 48. Radius 8px controls, 12px cards.
Desktop 1440px. Content max width 1152px, centred.

THE SCREEN

LEFT SIDEBAR, 240px, white, hairline right border:
Logo mark and "Sodak-Tech" wordmark at top, 64px tall header area.
Nav items, 36px tall each, small outline icons: Dashboard, Problems, Contests,
Leaderboard, Profile, Settings.
"Dashboard" is active: light grey #F1F3F7 background, a 2px blue bar on its far
left edge, icon and label in full-strength text. Inactive items are grey.
Pinned at the bottom: a divider, then avatar, display name, and "1450 rating" in
small grey monospace, with a small sign-out icon on the right.

TOP BAR, 64px, white, hairline bottom border:
Left: a search input, 320px wide, with a magnifier icon and placeholder "Search
problems…" and a small "⌘K" key hint pill inside the right edge.
Right: a bell icon, a sun/moon theme toggle, and a 28px avatar.

MAIN CONTENT, 32px padding:
Greeting header: "Welcome back, Priya" 24px semibold, with a subtitle "You are on
a 12 day streak — keep it going."

ROW 1 — four equal stat cards in a grid, 16px gaps. Each card 24px padding:
small grey uppercase label, large monospace number, and a small delta line.
  - "Problems solved" / 47 / green "+5 this week"
  - "Acceptance rate" / 68% / green "+3%"
  - "Current streak" / 12 days / grey "Best: 21"
  - "Rating" / 1450 / green "+24 last contest"

ROW 2 — two cards side by side, equal width:
  Card A "Weekly activity": seven vertical bars, one per weekday, blue, with day
  initials beneath and a light grey baseline. A small "This week" label top right.
  Card B "Topic mastery": five horizontal rows, each a label on the left, a thin
  progress track, and a right-aligned percentage. Rows: Arrays 82%, Hashing 74%,
  Dynamic Programming 41%, Graphs 35%, Sorting 90%. Bars are blue; anything under
  50% is amber.

ROW 3 — two cards side by side:
  Card C "Recent submissions", with a "View all" blue link top right: a compact
  five-row table with columns Problem, Verdict, Language, Runtime, When.
  Verdict cells are pill badges with a text label — "Accepted" dark green on very
  light green, "Wrong Answer" dark red on very light red, "Time Limit Exceeded"
  amber on very light amber. Runtime in monospace, right aligned.
  Card D "Recommended for you": three rows, each with problem title, a difficulty
  pill (Easy green, Medium amber, Hard red), and a right-aligned acceptance
  percentage. A one-line grey explanation at the top: "Based on your weakest
  topics."

RULES
Every status uses a text label, never colour alone.
Numbers right-aligned in tables and in monospace.
```

---

# 4. Problem list

```
Design the problem browsing screen for Sodak-Tech.

ABOUT THE PRODUCT
Sodak-Tech is a competitive programming practice platform used by a university.
Students solve algorithm problems in a browser code editor; submissions are
automatically judged against hidden test cases and receive a verdict and score.
Problems have a difficulty (Easy, Medium, Hard), topic tags, and an acceptance
rate. Students filter and search this catalogue to find what to solve next.
Think LeetCode's problem list, built for one institution.

This screen is a dense data table. Scanning speed matters more than decoration.

DESIGN LANGUAGE
A professional productivity tool. Reference points: Linear, GitHub, Stripe
Dashboard, DataLemur. Clean, dense, information first.
Forbidden: hero sections, marketing copy, illustrations, gradients,
glassmorphism, heavy shadows, gaming aesthetics.

THEME: Light mode. White cards on a very light grey page.

COLOURS
Page #F7F8FA · Card #FFFFFF · Inset/hover #F1F3F7 · Text #14181F ·
Secondary #5B6474 · Border #E3E7EE (1px hairline) · Accent #2573E6 ·
Success #0F7A3D · Warning #A15C00 · Danger #C62828

TYPOGRAPHY
Inter for UI, JetBrains Mono for numbers and percentages.
Body 14px, secondary 13px, caption 12px. Tabular figures in all numeric columns.

LAYOUT
8-point spacing: 8, 16, 24, 32, 48. Radius 8px controls, 12px cards.
Desktop 1440px, content max width 1280px for this dense table.

THE SCREEN

LEFT SIDEBAR, 240px, white: logo at top; nav items Dashboard, Problems,
Contests, Leaderboard, Profile, Settings. "Problems" is active — light grey
background with a 2px blue bar on its far left edge. User avatar, name, rating
pinned at the bottom.

TOP BAR, 64px, white: search input with ⌘K hint on the left; bell, theme toggle,
avatar on the right.

MAIN, 32px padding:
Header row: "Problems" 24px semibold on the left with a grey subtitle "312
problems · 47 solved" beneath.

FILTER BAR, a white card, 16px padding, 16px below the header:
Left: a search input, 280px, magnifier icon, placeholder "Search by title…".
Then three dropdowns, 140px each: "Difficulty", "Topics", "Status".
Right: a grey "Reset" text button.
Show the Topics dropdown as active with two selected chips beneath the filter bar
— "Arrays ×" and "Hashing ×" — small grey pills with remove icons.

TABLE, a white card with 12px radius, 16px below the filter bar:
Sticky header row: small 12px uppercase grey labels with letter spacing.
Columns and alignment:
  Status      40px, centred — a filled green check circle (solved), a half-filled
              amber circle (attempted), or an empty grey circle (untried)
  Title       flexible, left — problem title in medium weight; beneath it, topic
              tags as 12px grey chips
  Difficulty  120px, left — a pill: Easy dark green on pale green, Medium amber on
              pale amber, Hard dark red on pale red
  Acceptance  120px, right — monospace percentage
  Solved by   120px, right — monospace count
  Favourite   40px, centred — a star outline icon

Twelve rows. Rows are separated by 1px bottom borders only — no zebra striping.
Row hover fills with #F1F3F7. The title is a blue link on hover.
Sortable column headers show a small chevron; "Acceptance" shows an active
descending chevron in blue.

PAGINATION, below the table, 16px gap:
Left: grey text "Showing 1–12 of 312".
Right: prev arrow, page buttons 1 2 3 … 26, next arrow. Page 1 is active with a
blue fill and white text. The prev arrow is disabled and greyed.

RULES
Status uses an icon shape plus colour, never colour alone.
Numbers right-aligned and monospace.
```

---

# 5. Problem workspace — the editor screen

```
Design the problem-solving workspace for Sodak-Tech. This is the most important
screen in the product — users spend hours here, often under contest time
pressure. It must be calm, dense, and free of distraction.

ABOUT THE PRODUCT
Sodak-Tech is a competitive programming practice platform used by a university.
A student reads an algorithm problem, writes a solution in a browser code editor,
and submits it. The server compiles and runs the code against test cases inside a
sandbox and returns a verdict — Accepted, Wrong Answer, Time Limit Exceeded,
Memory Limit Exceeded, Runtime Error, or Compile Error.

Two actions exist and they differ:
  "Run" executes only the visible sample test cases, for quick feedback.
  "Submit" executes every test case including hidden ones, and produces the
  official score.

Scoring is by weighted test GROUPS, not individual tests. A group like "handles
empty input" either fully passes or scores zero — partial credit is per group.

DESIGN LANGUAGE
A professional developer tool. Reference points: VS Code, Linear, GitHub,
DataLemur's SQL editor. Clean, dense, information first. Maximise working area.
Forbidden: marketing copy, illustrations, gradients, glassmorphism, heavy
shadows, gaming aesthetics, decorative animation.

THEME: Light mode. White panels on a very light grey page.

COLOURS
Page #F7F8FA · Card #FFFFFF · Inset/code background #F1F3F7 · Text #14181F ·
Secondary #5B6474 · Border #E3E7EE (1px hairline) · Accent #2573E6 ·
Success #0F7A3D · Warning #A15C00 · Danger #C62828

TYPOGRAPHY
Inter for UI. JetBrains Mono for all code, inputs, outputs, runtimes, and memory
figures. Body 14px, secondary 13px, code 13px.

LAYOUT
8-point spacing. Radius 8px controls, 12px panels. Desktop 1440px.

THE SCREEN
NO SIDEBAR — this screen uses full width to maximise the working area.

TOP BAR, 56px, white, hairline bottom border:
Left: a back chevron, then "Two Sum" 15px semibold, then an "Easy" green pill,
then small grey monospace "1000ms · 256MB".
Centre: nothing.
Right: a monospace timer "12:34", a bookmark outline icon, a settings gear, and a
28px avatar.

BODY split into two panes with a 4px draggable vertical divider that shows a grey
grip on hover.

LEFT PANE (45%), white, its own scroll:
Tab row at the top, 44px, hairline bottom border: "Description", "Editorial",
"Submissions". Description is active — text in full strength with a 2px blue
underline; the others grey. "Editorial" has a small padlock icon beside it.
Content, 24px padding:
  Problem statement, two paragraphs of 14px text with comfortable line height.
  "Example 1" as a 13px semibold label, then two stacked blocks on #F1F3F7 inset
  background with 8px radius and 12px padding, each labelled in 12px grey —
  "Input" then monospace `nums = [2,7,11,15], target = 9`, and "Output" then
  monospace `[0,1]`. Then a grey italic explanation line.
  "Example 2" in the same pattern.
  "Constraints" label, then a bulleted list in monospace 13px:
    2 <= nums.length <= 10^4
    -10^9 <= nums[i] <= 10^9
    Only one valid answer exists.
  At the bottom, "Topics" label and three grey chips: Array, Hash Table, Two
  Pointers.

RIGHT PANE (55%), split horizontally into editor above and results below.

  EDITOR SECTION (70% of the pane height):
  Toolbar, 44px, white, hairline bottom border: a language dropdown showing
  "Python 3.13" on the left; on the right a font-size stepper "14", a reset
  circular-arrow icon, and a fullscreen icon.
  Code editor area: white background, a 48px left gutter in #F1F3F7 holding grey
  monospace line numbers 1 to 18, and syntax-highlighted Python. Use restrained
  syntax colours suitable for a light theme — keywords blue-violet, strings
  green, numbers orange, comments grey italic, function names dark blue. Show a
  realistic 18-line two-sum solution using a hash map. Show a thin blue cursor on
  line 12 and that line very faintly highlighted.
  Action bar, 56px, white, hairline top border, contents right-aligned with 8px
  gap: an outlined button "Run" with a play icon, and a solid blue button
  "Submit" with an upload icon. On the left of this bar, small grey text
  "Ctrl+Enter to run".

  RESULTS PANEL (30% of the pane height), hairline top border:
  Tab row, 40px: "Console", "Test Cases", "Output". Test Cases active with a blue
  underline. On the right of the tab row, a chevron to collapse the panel.
  Summary strip, 36px, on #F1F3F7: a green check icon, then "2 / 3 passed" in
  semibold, then grey monospace "· 42ms · 14.2MB", and on the right a green pill
  reading "Sample tests only".
  Below, three test case rows:
    Case 1 — collapsed. Green check, "Case 1", right-aligned monospace
    "38ms · 14.1MB".
    Case 2 — EXPANDED and failing. Red cross, "Case 2", right-aligned monospace
    "42ms · 14.2MB". Its expanded body shows three labelled monospace blocks on
    inset background: "Input" `nums = [3,2,4], target = 6`, "Expected" `[1,2]`,
    and "Your output" `[0,1]` — the last one with a light red background and a
    red left border.
    Case 3 — collapsed. Green check, "Case 3", "40ms · 14.0MB".

RULES
Every verdict and status carries a text label, never colour alone.
All runtimes, memory figures, inputs, and outputs in monospace.
No horizontal scrolling anywhere in the layout.
```

---

# 6. Submission detail

```
Design the submission result screen for Sodak-Tech.

ABOUT THE PRODUCT
Sodak-Tech is a competitive programming platform used by a university. Students
submit code which is judged against hidden test cases. Crucially, scoring is by
weighted test GROUPS rather than individual tests — a group such as "handles
empty input" scores its full weight or nothing at all, because half of "handles
empty input" is not a meaningful quantity. This screen explains exactly why a
submission scored what it did.

DESIGN LANGUAGE
A professional developer tool. Reference points: GitHub Actions run detail,
Linear, Stripe Dashboard. Clean, dense, forensic, information first.
Forbidden: marketing copy, illustrations, gradients, glassmorphism, heavy
shadows, gaming aesthetics.

THEME: Light mode. White cards on a very light grey page.

COLOURS
Page #F7F8FA · Card #FFFFFF · Inset #F1F3F7 · Text #14181F · Secondary #5B6474 ·
Border #E3E7EE (1px hairline) · Accent #2573E6 · Success #0F7A3D ·
Warning #A15C00 · Danger #C62828

TYPOGRAPHY
Inter for UI, JetBrains Mono for code, scores, runtimes, memory, and IDs.
Body 14px, secondary 13px, code 13px. Tabular figures for all numbers.

LAYOUT
8-point spacing. Radius 8px controls, 12px cards. Desktop 1440px,
content max width 1024px, centred.

THE SCREEN
Standard 240px left sidebar and 64px top bar, as on other signed-in screens.

MAIN, 32px padding:
Breadcrumb row, 13px: "Problems / Two Sum / Submission" with the first two as
blue links.

Header block:
Left: "Submission" 24px semibold, and a 13px grey monospace line beneath —
"a3f9c2e1 · submitted 12 minutes ago · Python 3.13".
Right: a large verdict badge — "Wrong Answer" in dark red on pale red with a red
border, 16px text, with a cross icon.

SUMMARY CARD, white, four columns divided by vertical hairlines, 24px padding:
  Verdict  — "Wrong Answer" in red semibold
  Score    — "40.00" large monospace, with "/ 100" small and grey after it
  Runtime  — "42ms" monospace
  Memory   — "14.2MB" monospace

TEST GROUPS CARD, below with a 16px gap:
Header row inside the card: "Test groups" 15px semibold on the left, and on the
right a small grey line "Score is the sum of fully-passed group weights."
Then four group rows separated by hairlines, each 56px tall:
  Row layout — a pass or fail icon on the left, then the group name in medium
  weight with a small grey line beneath showing the case count, then a weight
  chip, then a right-aligned points value in monospace.
  1. Green check · "Handles empty input" / "1 of 1 cases passed" · chip "weight 1"
     · "10.00" in green
  2. Green check · "Small cases" / "5 of 5 cases passed" · chip "weight 3" ·
     "30.00" in green
  3. Red cross · "Large cases" / "3 of 8 cases passed" · chip "weight 4" ·
     "0.00" in grey. This row has a 3px red left border and a very pale red
     background. Beneath its name, an extra 13px red line: "First failure at
     case 4."
  4. Red cross · "Edge cases" / "0 of 2 cases passed" · chip "weight 2" ·
     "0.00" in grey. Same red left border and pale red background.
Footer strip inside the card on inset background: "Earned 4 of 10 weight" on the
left, "40.00 / 100" in monospace semibold on the right.

SUBMITTED CODE CARD, below with a 16px gap:
Header: "Submitted code" on the left; on the right a "Python 3.13" grey chip and
a copy icon button.
Body: monospace 13px with a grey line-number gutter on inset background, showing
about 16 lines of a Python solution.

RULES
Every verdict carries a text label, never colour alone.
Failed groups are marked by an icon, a border, and a label — not colour alone.
```

---

# 7. Leaderboard

```
Design the leaderboard screen for Sodak-Tech.

ABOUT THE PRODUCT
Sodak-Tech is a competitive programming practice platform used by a university.
Students solve judged algorithm problems and compete in rated contests. Rating is
the platform's primary progression signal, so the leaderboard carries real
social weight — but it must stay a data table, not a trophy cabinet.

DESIGN LANGUAGE
A professional productivity tool. Reference points: Linear, GitHub, Stripe
Dashboard. Clean, dense, information first. Restrained celebration — no confetti,
no large medals, no gaming aesthetics.
Forbidden: marketing copy, illustrations, gradients, glassmorphism, heavy
shadows, decorative animation.

THEME: Light mode. White cards on a very light grey page.

COLOURS
Page #F7F8FA · Card #FFFFFF · Inset/hover #F1F3F7 · Text #14181F ·
Secondary #5B6474 · Border #E3E7EE (1px hairline) · Accent #2573E6 ·
Success #0F7A3D · Warning #A15C00 · Danger #C62828

TYPOGRAPHY
Inter for UI, JetBrains Mono for ranks, points, and streaks.
Body 14px, secondary 13px, caption 12px. Tabular figures throughout.

LAYOUT
8-point spacing. Radius 8px controls, 12px cards. Desktop 1440px,
content max width 1152px.

THE SCREEN
Standard 240px left sidebar with "Leaderboard" active, and 64px top bar.

MAIN, 32px padding:
Header: "Leaderboard" 24px semibold on the left, grey subtitle "Season 3 · ends
in 14 days" beneath. On the right, two small stat blocks: "Your rank #142" and
"Your points 3,240", each with a small grey label above a monospace figure.

CONTROL ROW: a segmented control on the left with Overall / Weekly / Monthly,
Overall selected with a white pill on a grey track. On the right, a search input
280px wide, placeholder "Find a student…".

TOP THREE — three cards in a row, 16px gaps, the middle one 16px taller and
visually first:
Each card: a 4px top border in gold, silver, or bronze; a large rank numeral in
light grey behind the content; a 48px avatar; display name semibold; @username in
13px grey; then two stats side by side — points in monospace semibold, and
problems solved. Restrained, no medal illustrations.
Order the cards visually as 2nd, 1st, 3rd.

MAIN TABLE, a white card, below with a 24px gap:
Sticky header: 12px uppercase grey labels.
Columns:
  Rank     80px, left — monospace number, then a small green up-chevron with a
           change count, or a red down-chevron, or a grey dash for no change
  Student  flexible, left — 28px avatar, display name in medium weight, @username
           in 12px grey beneath
  Solved   100px, right — monospace
  Streak   100px, right — monospace with a small flame icon
  Points   120px, right — monospace semibold
Fifteen rows, separated by hairlines, no zebra striping, hover fills #F1F3F7.

One row — rank #142 — is the signed-in user: pale blue background, a 3px blue
left border, the name followed by a small blue "You" chip. It is pinned visually
between rows 12 and 13 with a subtle dashed separator above it and a small grey
label "Your position".

Pagination below: "Showing 1–15 of 1,248", page controls on the right.

RULES
Rank movement uses an arrow shape plus colour, never colour alone.
All numeric columns right-aligned and monospace.
```

---

# 8. Contest list

```
Design the contests screen for Sodak-Tech.

ABOUT THE PRODUCT
Sodak-Tech is a competitive programming practice platform used by a university.
Beyond everyday practice, it runs timed contests: a fixed set of problems, a
start and end time, live standings, and a rating change afterwards. Contests move
through states — Published (registration open), Running, Frozen (standings stop
updating near the end), Ended, and Final. A student registers in advance and
enters when it starts.

Countdowns are derived from server time, never the browser clock, so a wrong
local clock cannot mislead a participant.

DESIGN LANGUAGE
A professional productivity tool. Reference points: Linear, GitHub, Stripe
Dashboard. Clean, dense, information first. Urgency conveyed by clear typography
and a live countdown, not by animation.
Forbidden: marketing copy, illustrations, gradients, glassmorphism, heavy
shadows, gaming aesthetics, countdown animation effects.

THEME: Light mode. White cards on a very light grey page.

COLOURS
Page #F7F8FA · Card #FFFFFF · Inset #F1F3F7 · Text #14181F · Secondary #5B6474 ·
Border #E3E7EE (1px hairline) · Accent #2573E6 · Success #0F7A3D ·
Warning #A15C00 · Danger #C62828

TYPOGRAPHY
Inter for UI, JetBrains Mono for countdowns, ranks, ratings, and dates.
Body 14px, secondary 13px. Countdown 32px monospace semibold.

LAYOUT
8-point spacing. Radius 8px controls, 12px cards. Desktop 1440px,
content max width 1152px.

THE SCREEN
Standard 240px sidebar with "Contests" active, 64px top bar.

MAIN, 32px padding:
Header: "Contests" 24px semibold. On the right, two stat blocks: "Rating 1450"
and "Global rank #4,821" in monospace.

LIVE CARD — full width, white, with a 3px blue left border and a very pale blue
background tint:
Top row: a red "LIVE" pill with a small solid dot, then "Weekly Challenge 142"
18px semibold, then a grey "Rated" chip.
Below: a metadata row in 13px grey, separated by middle dots — "4 problems ·
90 minutes · 1,204 participants · Ends 14:30 UTC".
Left-bottom: a small grey label "Time remaining" above a 32px monospace countdown
"01:14:23".
Right side, vertically centred: a small block showing "Your rank" with a
monospace "#87", and beneath it a solid blue button "Enter contest" with a
right-arrow icon.

UPCOMING SECTION, 32px above it:
Section heading "Upcoming" 15px semibold with a grey count "3" beside it.
Three cards in a row, 16px gaps. Each: contest name semibold; a "Rated" or
"Unrated" chip; then three metadata rows with a small icon each — start date and
time, duration, problem count; then a full-width outlined button "Register".
One of the three shows a registered state instead: a green check icon with the
text "Registered", and the button replaced by a grey outlined "Cancel
registration".

PAST SECTION, 32px above it:
Heading "Past contests".
A table card: columns Contest, Date, Your rank, Rating change, and an empty
header for the action column.
Five rows. Rating change is monospace with a sign and colour — "+24" green,
"−12" red — each preceded by an up or down arrow. The action column holds a blue
"Standings" link.

RULES
Rating change uses an arrow plus sign plus colour, never colour alone.
The countdown is monospace so its digits do not shift.
```

---

# 9. Contest detail

```
Design the contest detail screen for Sodak-Tech, shown while a contest is running.

ABOUT THE PRODUCT
Sodak-Tech is a competitive programming platform used by a university. During a
contest, participants see a fixed problem set labelled A, B, C, D, a countdown to
the end, and live standings. Near the end the standings FREEZE — they stop
updating publicly so the finish is suspenseful, though submissions still judge
normally. Participants must still be able to see their own results while frozen.

Scoring here is partial: each problem awards points, and ties break on time to
reach the score.

DESIGN LANGUAGE
A professional productivity tool. Reference points: Linear, GitHub, Stripe
Dashboard. Clean, dense, information first.
Forbidden: marketing copy, illustrations, gradients, glassmorphism, heavy
shadows, gaming aesthetics.

THEME: Light mode. White cards on a very light grey page.

COLOURS
Page #F7F8FA · Card #FFFFFF · Inset #F1F3F7 · Text #14181F · Secondary #5B6474 ·
Border #E3E7EE (1px hairline) · Accent #2573E6 · Success #0F7A3D ·
Warning #A15C00 · Danger #C62828

TYPOGRAPHY
Inter for UI, JetBrains Mono for countdown, scores, ranks, and times.
Body 14px, secondary 13px. Countdown 28px monospace semibold.

LAYOUT
8-point spacing. Radius 8px controls, 12px cards. Desktop 1440px,
content max width 1152px.

THE SCREEN
No sidebar — a contest is a focused mode. Instead a slim contest header bar.

HEADER BAR, 72px, white, hairline bottom border:
Left: a back chevron, then "Weekly Challenge 142" 16px semibold, then a red
"LIVE" pill.
Centre: a small grey label "Time remaining" above a 28px monospace countdown
"01:14:23".
Right: "Your rank" small grey label above monospace "#87", then an avatar.

A FROZEN BANNER directly beneath, amber tinted with an amber left border and a
snowflake icon: "Standings are frozen. Your own results still update; public
ranks do not." 13px text.

MAIN, 32px padding, two columns with a 24px gap.

LEFT COLUMN (65%) — "Problems" card:
A table with columns: Label, Problem, Status, Points, Attempts.
Four rows for A, B, C, D:
  Label   — a 28px square chip with the letter, in blue fill if solved, grey
            outline if not attempted, amber outline if attempted unsolved
  Problem — title as a blue link, with a small difficulty pill beneath
  Status  — a text label with icon: "Solved" green check, "Attempted" amber half
            circle, "Not attempted" grey dash
  Points  — monospace, right aligned, showing earned over available like
            "100 / 100" or "0 / 200"
  Attempts— monospace, right aligned
Row A is solved, B attempted, C and D untouched.

RIGHT COLUMN (35%), two stacked cards:
  "Your progress": a large monospace score "100" with "/ 600" grey beside it, a
  thin progress bar beneath, and two small rows — "Solved 1 of 4" and "Last solve
  00:23:14".
  "Standings (frozen)": a compact top-10 list, each row rank, name, and score in
  monospace. Rows are shown at 60% opacity with a small amber "frozen" chip in
  the card header. The signed-in user's row is highlighted in pale blue at full
  opacity with a "You" chip, and sits below the ten with a dashed separator.

RULES
Status uses an icon and a text label, never colour alone.
The countdown and all scores are monospace.
```

---

# 10. User profile

```
Design the user profile screen for Sodak-Tech.

ABOUT THE PRODUCT
Sodak-Tech is a competitive programming practice platform used by a university.
Students solve judged algorithm problems and compete in rated contests. The
profile summarises a student's progress: what they have solved, how consistently
they practise, their rating history, and their strongest topics. It is viewable
by others, so it reads as a public record rather than a private dashboard.

DESIGN LANGUAGE
A professional productivity tool. Reference points: GitHub profile, Linear,
Stripe Dashboard. Clean, dense, information first. Restrained achievement
display — no trophies, no gaming aesthetics.
Forbidden: marketing copy, illustrations, gradients, glassmorphism, heavy
shadows, decorative animation.

THEME: Light mode. White cards on a very light grey page.

COLOURS
Page #F7F8FA · Card #FFFFFF · Inset #F1F3F7 · Text #14181F · Secondary #5B6474 ·
Border #E3E7EE (1px hairline) · Accent #2573E6 · Success #0F7A3D ·
Warning #A15C00 · Danger #C62828

TYPOGRAPHY
Inter for UI, JetBrains Mono for ratings, counts, and dates.
Body 14px, secondary 13px, caption 12px. Tabular figures for numbers.

LAYOUT
8-point spacing. Radius 8px controls, 12px cards. Desktop 1440px,
content max width 1152px.

THE SCREEN
Standard 240px sidebar with "Profile" active, 64px top bar.

MAIN, 32px padding, two columns with a 24px gap.

LEFT COLUMN, 300px fixed:
  Identity card: a 96px circular avatar; display name 18px semibold; "@priya_s"
  13px grey monospace; a two-line bio; then three metadata rows with small
  outline icons — location, "Joined March 2026", and a GitHub link in blue.
  A full-width outlined button "Edit profile".
  Stats card beneath: four rows, each a grey label on the left and a monospace
  value on the right — Rating 1450, Peak rating 1502, Global rank #142, Contests
  entered 8.

RIGHT COLUMN, flexible, stacked cards with 16px gaps:

  "Solved problems" card: three progress rings in a row, each with a percentage
  in its centre and a label beneath — Easy 32/120 in green, Medium 13/140 in
  amber, Hard 2/52 in red. To their right, a divider, then a total block: "47"
  large monospace with "of 312 solved" grey beneath.

  "Activity" card: a GitHub-style contribution heatmap — 52 columns of 7 small
  rounded squares, five intensity levels from very pale grey-green to strong
  green. Month labels along the top, weekday labels down the left. Beneath, a
  row: "312 submissions in the last year" on the left, and a "Less ▢▢▢▢▢ More"
  legend on the right.

  "Topic strength" card: a horizontal bar list, eight topics, each with the topic
  name, a thin bar, and a right-aligned "solved / total" monospace count.

  "Badges" card: a grid of six badges, three columns. Each is a small circular
  icon with a label and a 12px grey date beneath. Three are earned and in full
  colour; three are locked, greyed out, with a small padlock and the unlock
  condition as the label.

  "Recent activity" card: a vertical timeline with a thin left rule and small dot
  markers. Six entries, each with an icon, a sentence, and a relative timestamp
  on the right — solved a problem, entered a contest, earned a badge, rating
  changed.

RULES
Difficulty and status use text labels, never colour alone.
All counts and ratings in monospace.
```

---

# 11. Settings

```
Design the settings screen for Sodak-Tech.

ABOUT THE PRODUCT
Sodak-Tech is a competitive programming practice platform used by a university.
Students write code in a browser editor, so editor preferences genuinely matter
to them — language, font size, tab width, word wrap. Settings also covers the
account, appearance, notifications, and destructive account actions.

Important: some features are not built yet. Those controls must appear visibly
disabled with an explanation, never as live controls that silently do nothing.

DESIGN LANGUAGE
A professional productivity tool. Reference points: Linear settings, GitHub
settings, Stripe Dashboard. Clean, dense, information first.
Forbidden: marketing copy, illustrations, gradients, glassmorphism, heavy
shadows, gaming aesthetics.

THEME: Light mode. White cards on a very light grey page.

COLOURS
Page #F7F8FA · Card #FFFFFF · Inset #F1F3F7 · Text #14181F · Secondary #5B6474 ·
Border #E3E7EE (1px hairline) · Accent #2573E6 · Success #0F7A3D ·
Warning #A15C00 · Danger #C62828

TYPOGRAPHY
Inter for UI, JetBrains Mono for usernames, emails, and numeric values.
Body 14px, secondary 13px, caption 12px.

LAYOUT
8-point spacing. Radius 8px controls, 12px cards. Desktop 1440px,
content max width 1024px.

THE SCREEN
Standard 240px sidebar with "Settings" active, 64px top bar.

MAIN, 40px padding:
Header: "Settings" 24px semibold, grey subtitle "Preferences apply to this
browser. Account changes affect everywhere you sign in."

Two columns with a 40px gap.

LEFT, 180px — a sticky section rail:
Five items, 32px tall each, with small icons: Account, Editor, Appearance,
Notifications, Danger zone. "Editor" is active — light grey background, full
strength text. "Danger zone" has a red icon.

RIGHT, flexible — stacked white cards with 24px gaps. Each card has a 15px
semibold title, a 13px grey description beneath, then its controls.

  ACCOUNT card — "Your identity across the platform."
  A definition list, four rows separated by hairlines, each a grey label left and
  a value right: Display name "Priya Sharma", Username "@priya_s" monospace,
  Email "priya@university.edu" monospace, Rating "1450" monospace.
  A hairline, then two outlined buttons side by side, BOTH DISABLED and greyed:
  "Change password" and "Enable two-factor auth". Show a tooltip on the first
  reading "Needs a backend endpoint that isn't built yet."

  EDITOR card — "Applies to the code editor on problem pages."
  - "Default language": a select showing "Python 3.13". Show the open dropdown
    with four options, three of which are greyed and suffixed "— coming soon":
    C++ 20, Java 21, JavaScript.
  - "Font size": a slider from 11 to 20 with the handle at 14, and "14px" in
    monospace right-aligned on the label row.
  - "Tab size": a segmented control with 2, 4, 8 — 4 selected in blue.
  - A hairline, then three toggle rows. Each row is a label with a 13px grey
    description on the left and a switch on the right: "Word wrap" on,
    "Auto-indent" on, "Line numbers" on.

  APPEARANCE card — "How the interface looks."
  Two theme preview thumbnails side by side, each about 160×100px, showing a
  miniature of the interface — one light, one dark. Light is selected with a 2px
  blue ring and a small blue check in its corner. Labels "Light" and "Dark"
  beneath. A 13px grey line: "Light is the default."

  NOTIFICATIONS card — "What you get told about, and where."
  Three toggle rows with labels and descriptions: "Submission verdicts" on,
  "Contest reminders" on, and "Weekly email digest" DISABLED and greyed with the
  description replaced by "No email delivery is configured yet."

  DANGER ZONE card — a pale red background, a red 1px border, a red title with a
  warning triangle icon, and the description "These actions are permanent."
  A hairline in red tint, then a row: "Delete account" semibold with a 13px grey
  line "Submissions are retained for contest integrity; your profile is removed."
  On the right, a red outlined button "Delete", DISABLED and greyed.

FLOATING SAVE BAR, fixed at the bottom centre of the viewport, about 60px above
the bottom edge: a white pill-shaped bar with a hairline border and a soft
shadow, containing "Unsaved changes" in 13px grey, an outlined "Reset" button,
and a solid blue "Save changes" button.

RULES
Disabled controls are visibly greyed AND explain themselves.
Nothing non-functional is presented as functional.
```

---

# 12. Admin overview

```
Design the admin dashboard for Sodak-Tech.

ABOUT THE PRODUCT
Sodak-Tech is a competitive programming practice platform used by a university.
Administrators and faculty manage it through a separate admin area: authoring
problems and their hidden test data, running contests, managing user roles, and
reading an append-only audit log of every privileged action.

The platform has five roles — User, Problem Setter, Contest Manager, Admin, and
Super Admin. The admin area must feel clearly distinct from the student area, so
nobody confuses the two.

IMPORTANT CONTEXT FOR THIS SCREEN: the code judge currently runs submitted code
without a security sandbox. That is a serious operational caveat, so a permanent
warning must appear on this screen.

DESIGN LANGUAGE
A professional internal admin tool. Reference points: Stripe Dashboard, Linear,
GitHub admin settings. Dense, factual, information first.
Forbidden: marketing copy, illustrations, gradients, glassmorphism, heavy
shadows, gaming aesthetics.

THEME: Light mode. White cards on a very light grey page.

COLOURS
Page #F7F8FA · Card #FFFFFF · Inset #F1F3F7 · Text #14181F · Secondary #5B6474 ·
Border #E3E7EE (1px hairline) · Accent #2573E6 · Success #0F7A3D ·
Warning #A15C00 · Danger #C62828
Admin accent: amber #A15C00 — the admin sidebar uses amber active markers instead
of blue, so the privileged area is visually unmistakable.

TYPOGRAPHY
Inter for UI, JetBrains Mono for counts, IDs, and timestamps.
Body 14px, secondary 13px, caption 12px. Stat figures 24px semibold monospace.

LAYOUT
8-point spacing. Radius 8px controls, 12px cards. Desktop 1440px,
content max width 1152px.

THE SCREEN

ADMIN SIDEBAR, 220px, white, hairline right border:
Header, 64px: a small amber rounded-square logo mark with "S", then "Administration"
15px semibold with a 11px grey line beneath reading "Super Admin".
Nav items, 36px each, small outline icons: Overview, Problems, Contests, Users,
Audit log, System health. "Overview" is active — light grey background with a
2px AMBER bar on its far left edge.
Pinned at the bottom, above a hairline: a "← Exit admin" link in grey.

TOP AREA, 32px padding:
Title "Overview" 24px semibold, grey subtitle "Platform activity at a glance."

WARNING BANNER, full width, directly beneath the title, 16px gap:
Pale amber background, a 3px amber left border, 8px radius, 16px padding.
A warning triangle icon, then bold amber text "Judging is not sandboxed" on the
first line, and a normal-weight second line: "Submitted code runs in a subprocess
on this host with no isolation from the filesystem, network, or database. Safe
for a controlled demo; not safe for untrusted users."

STAT ROW, four equal cards, 16px gaps, 24px below the banner. Each: a small grey
label with an outline icon, a 24px monospace figure, and a 12px grey sub-line.
  Users        128   "114 active · 12 new this week"
  Problems      34   "28 published · 6 draft"
  Submissions 2,451  "89 today · 3 pending"
  Contests       5   "1 running · 2 upcoming"
Each card is subtly clickable — show a chevron in the top-right corner on one.

TWO CARDS BELOW, side by side, 16px gap, 24px above:
  "Verdict distribution": eight horizontal bar rows. Each has a left label in
  13px grey (accepted, wrong answer, time limit exceeded, runtime error, compile
  error, memory limit exceeded, presentation error, internal error), a thin bar,
  and a right-aligned monospace count. The "accepted" bar is green; all others
  are blue-grey. Bars are scaled to the largest value.
  "Recent admin activity", with a blue "Full audit log" link top right: six rows.
  Each has a small document icon, a one-line summary in 13px, and a second line
  in 11px grey showing "actor · timestamp". Example summaries: "Published
  two-sum v2", "Changed role: priya_s user → problem_setter", "Viewed test data
  for binary-search".

RULES
The warning banner is permanent and must not look dismissible.
All counts in monospace, right-aligned where in a column.
```

---

# 13. Admin test group editor — hardest screen

```
Design the test data editor for Sodak-Tech's admin area. This is the densest and
most important admin screen.

ABOUT THE PRODUCT
Sodak-Tech is a competitive programming platform used by a university. Faculty
author problems, and each problem needs TEST DATA to judge submissions against.

This platform's test data model is unusual and the design must express it:
  - Test cases are organised into named GROUPS, not a flat list.
  - Each group has a WEIGHT. A submission earns a group's full weight only if
    EVERY case in that group passes — there is no partial credit within a group.
    This is deliberate: a group named "handles empty input" is either true or
    not, and 80% of it is not a meaningful quantity.
  - Each group is either SAMPLE or HIDDEN. Sample groups are shown to students
    and run by the "Run" button. Hidden groups run only on "Submit" and their
    contents must never reach the browser.
  - Test data is VERSIONED and IMMUTABLE once published. Correcting a bad test
    case means creating a new version, never editing the old one, because every
    past submission is pinned to the version it was judged against.

DESIGN LANGUAGE
A professional internal authoring tool — closer to a CMS or a database admin than
a consumer app. Dense, form-heavy, factual.
Forbidden: marketing copy, illustrations, gradients, glassmorphism, heavy
shadows, gaming aesthetics.

THEME: Light mode. White cards on a very light grey page.

COLOURS
Page #F7F8FA · Card #FFFFFF · Inset #F1F3F7 · Text #14181F · Secondary #5B6474 ·
Border #E3E7EE (1px hairline) · Accent #2573E6 · Success #0F7A3D ·
Warning #A15C00 · Danger #C62828 · Admin accent amber #A15C00

TYPOGRAPHY
Inter for UI. JetBrains Mono for all test inputs, expected outputs, weights, and
counts. Body 14px, secondary 13px, code 13px.

LAYOUT
8-point spacing. Radius 8px controls, 12px cards. Desktop 1440px,
content max width 1152px.

THE SCREEN
Admin sidebar, 220px, with "Problems" active using an AMBER left bar.

MAIN, 32px padding:
Breadcrumb, 13px: "Problems / Two Sum / New version" — first two as blue links.

Header row:
Left: "Version 2" 24px semibold, with a grey "Draft" chip beside it, and a 13px
grey line beneath: "Based on version 1 · created 5 minutes ago".
Right: an outlined "Save draft" button and a solid blue "Publish version" button.

INFO BANNER, pale blue with a blue left border, an info icon:
"Publishing makes this version immutable. Correcting a test case later requires
creating a new version — existing submissions stay pinned to the version they
were judged against."

SUMMARY STRIP, a white card, 16px padding, four items divided by vertical
hairlines, each a small grey label above a monospace value:
  Groups 3 · Cases 12 · Total weight 6 · Sample groups 1

WARNING LINE beneath the strip, amber text with a small triangle icon:
"At least one sample group is required — the Run button has nothing to execute
without one."

LIMITS CARD, white, a row of three compact fields:
  "Time limit" number input with a grey "ms" suffix, value 1000
  "Memory limit" number input with an "MB" suffix, value 256
  "Comparison" select showing "Exact match after whitespace normalisation"

TEST GROUPS — a stacked list of collapsible group cards, 12px gaps.

  GROUP 1, COLLAPSED: a 56px row — a six-dot drag handle on the left, then the
  group name "Handles empty input" in medium weight, then a green "Sample" chip,
  then a grey chip "weight 1", then 13px grey "1 case". On the right, a chevron
  and a trash icon.

  GROUP 2, EXPANDED — the focus of this design:
  Header row identical in structure, showing "Small cases", a grey "Hidden" chip,
  a chip "weight 3", "5 cases", and an up chevron.
  Expanded body on a very light inset background, 16px padding:
    A row of three controls: a "Group name" text input (60% width), a "Weight"
    number input (80px), and a Sample/Hidden segmented control with Hidden
    selected.
    A "Description" text input, full width, placeholder "What behaviour does this
    group verify?", filled with "Typical inputs within normal bounds".
    Then a "Test cases" label with a grey count "5" beside it.
    Then a list of case rows. Show three, each in a white card with 12px padding:
      A left column 60px wide with a grey monospace "Case 1" label and a small
      drag handle.
      Two monospace textareas side by side, each with a 12px grey label above —
      "Input" and "Expected output". Show realistic content: input
      "3\n2 7 11 15\n9" and expected "0 1".
      A trash icon on the far right.
    Beneath the case list, two buttons: an outlined "Add case" with a plus icon,
    and a grey text button "Bulk import".

  GROUP 3, COLLAPSED: "Large cases", grey "Hidden" chip, chip "weight 2",
  "6 cases".

ADD GROUP BUTTON at the bottom: full width, 48px, a dashed 1px border, grey text
with a plus icon, reading "Add test group".

RULES
Sample versus Hidden is shown by a text label and a chip, never colour alone.
All test inputs, outputs, weights, and counts in monospace.
The immutability warning must read as important, not decorative.
```

---

# 14. Admin problem authoring

```
Design the problem authoring form for Sodak-Tech's admin area.

ABOUT THE PRODUCT
Sodak-Tech is a competitive programming practice platform used by a university.
Faculty and problem setters author algorithm problems here: a statement, input
and output format, constraints, difficulty, and topic tags.

A key concept: a problem's STATEMENT is separate from its judging data. Editing a
typo in the statement must not invalidate past submissions, but changing a time
limit or a test case must — so limits and test data live on immutable VERSIONS,
created separately. A problem is not solvable by students until a version is
published.

DESIGN LANGUAGE
A professional internal authoring tool — a CMS, not a consumer app. Dense,
form-heavy, factual.
Forbidden: marketing copy, illustrations, gradients, glassmorphism, heavy
shadows, gaming aesthetics.

THEME: Light mode. White cards on a very light grey page.

COLOURS
Page #F7F8FA · Card #FFFFFF · Inset #F1F3F7 · Text #14181F · Secondary #5B6474 ·
Border #E3E7EE (1px hairline) · Accent #2573E6 · Success #0F7A3D ·
Warning #A15C00 · Danger #C62828 · Admin accent amber #A15C00

TYPOGRAPHY
Inter for UI, JetBrains Mono for the slug, limits, and code samples.
Body 14px, secondary 13px, code 13px.

LAYOUT
8-point spacing. Radius 8px controls, 12px cards. Desktop 1440px,
content max width 1152px.

THE SCREEN
Admin sidebar, 220px, "Problems" active with an AMBER left bar.

MAIN, 32px padding:
Breadcrumb: "Problems / New problem".
Header: "New problem" 24px semibold on the left. On the right, an outlined "Save
draft" button and a solid blue "Save and add test data" button.

Two columns, 24px gap.

LEFT COLUMN (65%) — one white card with form sections divided by hairlines,
24px padding per section:

  Section "Basics":
  - "Title" text input, filled "Two Sum"
  - "Slug" text input beneath, filled with monospace "two-sum", greyed slightly,
    with a small blue "Edit" link on its right and a 12px grey hint "Generated
    from the title. Used in the URL and cannot change after publishing."
  - "Difficulty" — a three-option segmented control, Easy / Medium / Hard, with
    Easy selected in green
  - "Topics" — a multi-select showing three removable chips "Array ×",
    "Hash Table ×", "Two Pointers ×", and a text input beside them reading
    "Add a topic…"

  Section "Statement":
  A small toolbar above the field: bold, italic, inline code, link, bulleted
  list, and a code-block icon; on the right a "Write | Preview" segmented toggle
  with Write selected.
  A large markdown textarea, about 260px tall, monospace 13px, containing a
  realistic problem statement with a paragraph and an example.
  A 12px grey hint beneath: "Markdown supported. LaTeX between $ delimiters."

  Section "Format and constraints": three stacked smaller textareas, each about
  90px tall with a label above — "Input format", "Output format", "Constraints".
  The constraints field contains monospace lines.

RIGHT COLUMN (35%) — stacked small white cards, 16px gaps:

  "Publishing" card: a "Public" toggle switch with a label, currently off, and a
  13px grey explanation "A problem is only solvable once a version with test data
  is published. Making it public is not enough."

  "Status" card: a pale amber inset block with a warning icon and the text
  "Draft — no published version" in amber, and a 12px grey line beneath:
  "Students cannot see or submit to this problem."

  "Author" card: a small avatar, "Dr. Alan Turing", and "@aturing" in 12px grey
  monospace.

  "Danger" card: a red-tinted block with a red border, containing a red outlined
  full-width button "Delete problem" and a 12px grey line "Soft delete —
  submissions and history are preserved."

RULES
Disabled and blocked states explain themselves in text.
The slug is monospace. The draft status must be unmissable.
```

---

# 15. Admin users

```
Design the user management screen for Sodak-Tech's admin area.

ABOUT THE PRODUCT
Sodak-Tech is a competitive programming practice platform used by a university.
It has five roles, in increasing privilege: User, Problem Setter, Contest
Manager, Admin, and Super Admin.

Two rules must be visible in the design:
  - Only a Super Admin can change roles, and nobody can change their own role.
  - Accounts are never deleted, only deactivated — a user with submission history
    must remain resolvable forever, or that history becomes unreadable.

DESIGN LANGUAGE
A professional internal admin tool. Reference points: Stripe Dashboard, GitHub
organisation settings. Dense, factual, information first.
Forbidden: marketing copy, illustrations, gradients, glassmorphism, heavy
shadows, gaming aesthetics.

THEME: Light mode. White cards on a very light grey page.

COLOURS
Page #F7F8FA · Card #FFFFFF · Inset/hover #F1F3F7 · Text #14181F ·
Secondary #5B6474 · Border #E3E7EE (1px hairline) · Accent #2573E6 ·
Success #0F7A3D · Warning #A15C00 · Danger #C62828 · Admin accent amber #A15C00

TYPOGRAPHY
Inter for UI, JetBrains Mono for emails, counts, and dates.
Body 14px, secondary 13px, caption 12px. Tabular figures in numeric columns.

LAYOUT
8-point spacing. Radius 8px controls, 12px cards. Desktop 1440px,
content max width 1280px.

THE SCREEN
Admin sidebar, 220px, "Users" active with an AMBER left bar.

MAIN, 32px padding:
Header: "Users" 24px semibold, grey subtitle "Accounts, roles, and access.
Deactivation preserves history — accounts are never deleted."

CONTROL ROW: a search input 300px on the left with placeholder "Search by name,
username, or email…", then a "Role" select and a "Status" select. On the right, a
grey monospace count "128 users".

TABLE, a white card:
Sticky header, 12px uppercase grey labels.
Columns:
  User          flexible, left — display name in medium weight, and the email
                beneath in 12px grey monospace
  Role          200px, left — a compact select control showing the current role
  Solved        100px, right — monospace
  Submissions   120px, right — monospace
  Joined        120px, left — 13px grey monospace date
  Status        120px, left — a pill with a small dot AND a text label:
                green "Active" on pale green, or red "Disabled" on pale red
  Actions       120px, right — a small outlined button "Disable" or "Enable"

Ten rows, hairline separated, no zebra striping, hover fills #F1F3F7.

SPECIFIC ROWS TO SHOW:
  Row 1 is the signed-in admin: after the display name, a small blue "You" chip.
  Its Role select is DISABLED and greyed. Its Actions button is DISABLED and
  greyed with a tooltip "You cannot deactivate your own account."
  Row 4 has Status "Disabled" — the whole row is at 60% opacity and its action
  button reads "Enable".
  Row 6 shows the Role select OPEN, with five options listed: User, Problem
  Setter, Contest Manager, Admin, Super Admin. "Problem Setter" is currently
  selected and shown with a check.

FOOTER NOTE beneath the table, 13px grey: "Only a Super Admin can change roles.
Role changes are recorded in the audit log."

RULES
Status uses a dot shape plus a text label, never colour alone.
Disabled controls are greyed and explain themselves on hover.
```

---

# 16. Admin audit log

```
Design the audit log viewer for Sodak-Tech's admin area.

ABOUT THE PRODUCT
Sodak-Tech is a competitive programming practice platform used by a university.
Every privileged action — changing a user's role, publishing a problem version,
reading hidden test data, changing a contest's state — is written to an
append-only audit log inside the same database transaction as the change itself,
so the change cannot exist without the record.

The log CANNOT be edited or deleted by anyone, including a Super Admin. This is
enforced at the database level. The design must reflect that: there is
deliberately no delete control, no edit control, and no bulk action anywhere on
this screen. Its absence is the point.

DESIGN LANGUAGE
A forensic, read-only internal tool. Reference points: Stripe's event log, AWS
CloudTrail, GitHub's security log. Extremely dense, factual, monospace-leaning.
Forbidden: marketing copy, illustrations, gradients, glassmorphism, heavy
shadows, gaming aesthetics.

THEME: Light mode. White cards on a very light grey page.

COLOURS
Page #F7F8FA · Card #FFFFFF · Inset #F1F3F7 · Text #14181F · Secondary #5B6474 ·
Border #E3E7EE (1px hairline) · Accent #2573E6 · Success #0F7A3D ·
Warning #A15C00 · Danger #C62828 · Admin accent amber #A15C00

TYPOGRAPHY
Inter for labels and chrome. JetBrains Mono for timestamps, action names, IDs, IP
addresses, and all metadata. Body 13px here — this screen is denser than others.

LAYOUT
8-point spacing. Radius 8px controls, 12px cards. Desktop 1440px,
content max width 1280px.

THE SCREEN
Admin sidebar, 220px, "Audit log" active with an AMBER left bar.

MAIN, 32px padding:
Header: "Audit log" 24px semibold, grey subtitle "Every privileged action,
append-only. Entries cannot be edited or deleted by anyone, including a Super
Admin."

FILTER ROW, a white card, 12px padding:
A search input 280px with placeholder "Search summaries and actors…", then an
"Action" select, a "Target type" select, and a date range control showing "Last 7
days". On the far right, a grey monospace count "1,284 entries".

TABLE, a white card:
Sticky header, 11px uppercase grey labels.
Columns:
  Timestamp   180px — 12px monospace grey, format "2026-08-01 14:32:07"
  Action      200px — a small grey chip with the action name in 12px monospace,
              e.g. "problem.updated", "user.role_changed", "test_data.read",
              "contest.state_changed"
  Actor       160px — display name, with @username in 11px grey monospace beneath
  Target      160px — 12px monospace, e.g. "problem / two-sum"
  Summary     flexible — a plain-language sentence in 13px
Twelve rows, hairline separated, very dense — about 44px row height.
Row hover fills #F1F3F7 and shows a small chevron at the row's right edge.

ONE EXPANDED ROW — row 4, action "user.role_changed":
Beneath it, an expanded panel on #F1F3F7 inset background with 16px padding,
containing a metadata block in 12px monospace laid out as aligned key–value
pairs:
    entry_id      3f9a2c81-4e7b-4c19-9d2a-1b8e5f7c0a34
    actor         admin (super_admin)
    target        user / 8c1d4e2a
    from          user
    to            problem_setter
    ip_address    10.237.247.69
    user_agent    Mozilla/5.0 (Windows NT 10.0; Win64; x64)
    recorded_at   2026-08-01T14:32:07.441Z
Keys in grey, values in full-strength text, aligned into two columns.

FOOTER: pagination on the right, and on the left a 12px grey note with a small
lock icon: "This log is append-only and replicated to external storage."

RULES
There must be NO delete, edit, or bulk-action control anywhere on this screen.
Timestamps, IDs, and metadata are all monospace.
```

---

# 17. Empty states and error pages

```
Design a set of empty-state and error screens for Sodak-Tech.

ABOUT THE PRODUCT
Sodak-Tech is a competitive programming practice platform used by a university.
Students solve judged algorithm problems and compete in contests; faculty author
the problems through an admin area.

A freshly installed instance is genuinely empty — no problems, no submissions, no
contests — so empty states are seen constantly and must be designed, not blank.
They must never show fabricated placeholder data.

DESIGN LANGUAGE
A professional productivity tool. Reference points: Linear, GitHub, Stripe
Dashboard. Calm, plain-spoken, helpful.
Forbidden: marketing copy, cute illustrations, mascots, gradients,
glassmorphism, heavy shadows, gaming aesthetics, apologetic tone.

THEME: Light mode. White cards on a very light grey page.

COLOURS
Page #F7F8FA · Card #FFFFFF · Inset #F1F3F7 · Text #14181F · Secondary #5B6474 ·
Border #E3E7EE (1px hairline) · Accent #2573E6 · Success #0F7A3D ·
Warning #A15C00 · Danger #C62828

TYPOGRAPHY
Inter for UI, JetBrains Mono for error codes.
Heading 18px semibold, body 14px, secondary 13px.

LAYOUT
8-point spacing. Radius 8px controls, 12px cards. Desktop 1440px.

DELIVER SIX STATES, arranged as a grid of six cards on one canvas so they can be
compared. Each is a centred block inside a white card, 64px vertical padding:
a single thin outline icon 28px in grey, a heading, one or two lines of grey body
text, and where relevant a button. No illustrations.

1. NO PROBLEMS YET (admin view)
   Icon: code brackets.
   Heading "No problems yet"
   Body "Create a problem, then publish a version with test groups to make it
   solvable by students."
   Solid blue button "Create a problem"

2. NO SEARCH RESULTS
   Icon: magnifier.
   Heading "No problems match your filters"
   Body "Try removing a filter or searching for something broader."
   Outlined button "Reset filters"

3. NO SUBMISSIONS YET (student)
   Icon: upload arrow.
   Heading "You haven't submitted anything yet"
   Body "Pick a problem and submit your first solution — your history will appear
   here."
   Solid blue button "Browse problems"

4. 404 NOT FOUND — full page, not a card
   A monospace grey "404" at 48px, heading "We couldn't find that page",
   body "The link may be broken, or the page may have been removed."
   Two buttons side by side: solid blue "Go to dashboard" and outlined "Browse
   problems".

5. 500 SERVER ERROR — full page
   Monospace grey "500", heading "Something went wrong on our end",
   body "This has been logged. Try again in a moment — your work is saved."
   A solid blue "Try again" button and an outlined "Go to dashboard".
   Beneath, a 12px grey monospace line "Reference: 7f3a-91c2" with a copy icon.

6. JUDGE UNAVAILABLE — an inline banner, not a full page
   Pale amber background, amber left border, warning triangle icon.
   Bold "Judging is temporarily unavailable" then a normal line "Your submission
   is saved and queued. It will be judged automatically when the service
   recovers."

RULES
Never blame the user. Say what happened and what to do next.
Never show fabricated data in an empty state.
No apologetic or jokey tone — plain and factual.
```

---

## After generating

For each screen:

1. Iterate in Stitch until layout and hierarchy read well.
2. Screenshot at desktop width, or export to Figma and export a PNG.
3. Save into `design/frames/` using the naming convention in
   [design/README.md](../design/README.md).
4. Tell me the screen name — I implement it against the existing component system
   and the real API.

If a design implies data the backend does not have — notification feeds, team
features, analytics we do not compute — flag it. I will say whether it needs a
backend model first or should be dropped. That is how the original generated
admin panel ended up with a moderation queue behind no model.
