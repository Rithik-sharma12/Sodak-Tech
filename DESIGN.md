# Design standard

The desired look and feel of Sodak-Tech, and the rules that produce it.

This document is the authority on visual and interaction decisions. Where it and
a Figma frame disagree, this document wins — the Figma file predates the light
theme and no longer matches the intended default appearance.

Implementation lives in [`frontend/app/globals.css`](frontend/app/globals.css).
Token values here and there must match; if they drift, the CSS is the artifact
that ships and this document is the bug.

---

## 1. Philosophy

**This is a productivity tool, not a marketing website.**

People come here to solve problems under time pressure. Every decision is judged
by one question:

> Does this help someone solve a problem faster and more comfortably?

If the answer is no, remove it.

The interface should recede. A learner mid-problem should be aware of their code
and the problem statement, and nothing else. Chrome that draws attention to
itself is a defect.

**Reference points:** Linear, GitHub, Stripe Dashboard, VS Code, Notion,
DataLemur. Clean, dense, fast, unglamorous.

**Not reference points:** gaming sites, landing pages, anything with a hero
animation.

---

## 2. Principles

### Clarity
Every screen answers three questions without effort: *Where am I? What can I do
here? What should I do next?*

### Consistency
One design system. A button, card, or table looks and behaves identically on
every page. Never redesign a component for one screen.

### Hierarchy through space, then weight, then colour
Reach for spacing first. Then type weight. Colour is the last resort, because it
is also the channel carrying meaning (verdicts, difficulty, status) and spending
it on decoration devalues it.

Priority order: page title → primary action → main content → secondary actions →
metadata.

### Simplicity
If removing an element does not reduce usability, remove it.

### Honesty
A control that appears operational must be operational. Anything not yet built
is rendered visibly disabled with the reason, never as a live control that
silently does nothing. An empty state says the system is empty; it never shows
invented data.

### Accessibility
WCAG AA is the floor, not the goal. See §9.

### Performance
Avoid heavy shadows, large blurs, background video, and decorative animation.
Lazy-load images. Virtualise any list that can exceed a few hundred rows.

---

## 3. Themes

**Light is the default. Dark is opt-in.** The choice persists per browser and is
applied before first paint — a page that flashes the wrong theme on load is a
visible defect.

Both themes are first-class. Neither is a filter over the other: semantic roles
flip, brand ramps do not.

### Mechanism

Tailwind v4 tokens map to plain CSS variables via `@theme inline`, so a utility
compiles to `var(--surface-card)` and resolves at paint time. Swapping the
variable block swaps the entire interface.

```css
@theme inline { --color-surface-card: var(--surface-card); }
:root                    { --surface-card: #ffffff; }
:root[data-theme='dark'] { --surface-card: #171f33; }
```

**Never** write `dark:` variants on individual elements. That produces two
hardcoded copies of the interface that drift apart. If a component needs a
`dark:` utility, the token set is missing something — add the token.

---

## 4. Colour

Colour communicates meaning. It is not decoration.

### 4.1 Brand ramps — identical in both themes

Sampled from the design system frame, not eyeballed.

| Step | Primary | Accent | |
|---|---|---|---|
| 50 | `#EDF0FF` | `#FFEDE4` | |
| 100 | `#D8E2FF` | `#FFDCC6` | |
| 200 | `#ADC6FF` | `#FFB786` | |
| 300 | `#81AAFF` | `#FF8E33` | |
| 400 | `#4D8EFF` | `#DF7412` | |
| 500 | `#2573E6` | `#BB5D00` | |
| 600 | `#005AC2` | `#964900` | |
| 700 | `#004395` | `#723600` | |
| 800 | `#002E6A` | `#502400` | |
| 900 | `#001A42` | `#311400` | |

> **The brand hexes are not ramp steps.** `#3B82F6` and `#D16900` appear on the
> style-guide swatches but sit between steps. Components use ramp steps. Treat
> the swatch values as separate brand tokens, not as `primary-500`.

### 4.2 Semantic roles

| Role | Light | Dark | Notes |
|---|---|---|---|
| `surface-base` | `#F7F8FA` | `#0B1326` | Page |
| `surface-card` | `#FFFFFF` | `#171F33` | Content plane |
| `surface-raised` | `#F1F3F7` | `#222A3D` | Hover, secondary buttons |
| `surface-overlay` | `#FFFFFF` | `#2B3450` | Menus, dialogs |
| `surface-sunken` | `#F0F2F6` | `#0D1424` | Code blocks, wells |
| `foreground` | `#14181F` | `#E8ECF8` | Primary text |
| `muted-foreground` | `#5B6474` | `#9AA3BD` | Secondary text |
| `border` | `#E3E7EE` | `rgba(255,255,255,.08)` | Hairline |
| `border-strong` | `#CDD3DE` | `rgba(255,255,255,.14)` | Inputs, emphasis |
| `success` | `#0F7A3D` | `#3DDC84` | |
| `warning` | `#A15C00` | `#FFB340` | |
| `danger` | `#C62828` | `#FF6B6B` | |

**Two rules that are easy to get wrong:**

- **Never pure black on white, never pure white on dark.** `#000` on `#FFF` is
  harsher than any real product uses; `#FFF` on a dark surface vibrates against
  it. Both are immediate tells of an unconsidered theme.
- **Semantic colours are not shared between themes.** The dark-mode greens and
  reds fail contrast on white. Each theme carries its own.

### 4.3 Accent selection differs by theme

On dark, the primary button is `primary-200` — a light periwinkle. On light, that
same value is an illegible pale blue, so the accent becomes `primary-500`.

This inversion is the brand's most distinctive move and the thing generated UI
reliably gets wrong.

### 4.4 Separation strategy differs by theme

Light UI separates with **borders**. Dark UI separates with **elevation**.
Reaching for heavy shadow in light mode produces a page that looks smudged;
relying on borders alone in dark mode produces one that looks flat.

---

## 5. Typography

| Role | Family | Use |
|---|---|---|
| Display | Geist | Headings, page titles, stat figures |
| Body | Inter | All UI text |
| Mono | JetBrains Mono | Code, IDs, slugs, verdicts, numeric detail |

### Rules

- **Headings take negative tracking** (`-0.02em`, `-0.03em` at H1). Body copy
  takes none. One value for both makes a page feel subtly wrong in a way that is
  hard to place.
- **Code disables ligatures.** `font-variant-ligatures: none` — ligatures merge
  operators like `!=` and `=>` into glyphs that misrepresent the source.
- **Numeric columns use tabular figures** (`.tnum`). Runtimes, memory, scores,
  ranks, and countdowns must not jitter as digits change.
- **Headings balance** (`text-wrap: balance`) to avoid a single trailing word.

### Scale

`12 · 13 · 14 · 16 · 18 · 20 · 24 · 30 · 36`

13px is deliberate and used heavily — dense data UI reads better at 13 than 14,
and the pairing of 13 for metadata against 14 for content creates hierarchy
without a weight change.

---

## 6. Spacing and shape

### 8-point system

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`

4px exists for optical adjustments only — icon-to-label gaps, badge padding.
Layout spacing starts at 8.

### Radius

| Token | Value | Use |
|---|---|---|
| `sm` | 6px | Badges, chips, small controls |
| `md` | 8px | Buttons, inputs |
| `lg` | 12px | Cards, panels |
| `xl` | 16px | Dialogs, large surfaces |

Consistent radius is one of the strongest signals that an interface was designed
rather than assembled. Do not introduce new values.

### Elevation

Three levels, no more. Layered rather than one blur — a tight contact shadow plus
a wide ambient one is what makes a surface read as lifted.

Dark mode adds a 1px inset top highlight (`rgba(255,255,255,.04)`) to card
surfaces. That inner edge is what sells the lift when shadows are barely visible
against a dark ground.

---

## 7. Layout

**Desktop first**, fully responsive down to mobile. **No horizontal body scroll,
ever.** Wide content — tables, diagrams, code — scrolls inside its own container.

- Learner shell: collapsible left sidebar + sticky top bar
- Admin shell: narrower sidebar, accent-coloured active marker to signal you are
  in a privileged area
- Content max width 1152px for reading, 1280px for dense tables
- Bento-style modular cards on dashboards; each card is one idea

Navigation always indicates the current page — via a left rail marker plus a
raised surface, not a saturated fill. A filled pill fights the label for
attention and breaks when the sidebar collapses.

---

## 8. Components

Every component supports all seven states. A component missing states is not
finished.

**Hover · Focus · Active · Disabled · Loading · Error · Success**

### Inventory

Button · Input · Select · Textarea · Search · Checkbox · Switch · Radio ·
Dropdown · Modal · Drawer · Toast · Tabs · Table · Badge · Pagination · Avatar ·
Breadcrumb · Progress · Tooltip · Accordion · Empty state · Skeleton · Spinner ·
Difficulty badge · Verdict badge · Split pane · Code editor · Test-case panel ·
Leaderboard table · Stat card

### Domain components

**Verdict badge** — `accepted` reads green, failures red, resource limits amber,
pending/running neutral with a subtle pulse.

**Difficulty badge** — easy green, medium amber, hard red.

Both must carry a text label. Colour alone never communicates state (§9).

### Rules

- **Toggles are `<button role="switch">`**, never a styled checkbox. Correct
  semantics, native focus, Space/Enter handled for free.
- **Loading uses skeletons**, not spinners, wherever the shape of the result is
  known. A spinner tells you nothing; a skeleton tells you what is coming.
- **Empty states are designed**, with a heading, an explanation, and a next
  action where one exists. A fresh install shows these constantly.
- **Dropdowns dismiss on outside click and Escape.** A menu that only closes via
  its trigger is unfinished.
- **Destructive actions are visually separated** — their own region, not a red
  button among ordinary ones.

---

## 9. Accessibility

WCAG AA, non-negotiable.

- **Contrast:** 4.5:1 body text, 3:1 large text and UI boundaries — verified in
  **both** themes.
- **Never colour alone.** Every status carries a label, icon, or shape. A
  red/green distinction is invisible to roughly 1 in 12 men.
- **Visible focus** on every interactive element: 2px ring, 2px offset. Use
  `:focus-visible` so pointer users do not get a ring on click.
- **Semantic HTML.** `<button>` for actions, `<a>` for navigation, real `<table>`
  for tabular data, real `<label>` bound to every input.
- **Keyboard reachable**, in a sensible order, with no traps.
- **`aria-current="page"`** on active navigation.
- **Respect `prefers-reduced-motion`** — reduce to near-zero duration.

---

## 10. Motion

Motion clarifies causality. It never decorates and never delays.

**Allowed:** hover and focus transitions (~140ms), fades, modal and drawer
entrances, toasts, loading and progress indicators.

**Forbidden:** parallax, particles, scroll-triggered reveals, anything over
300ms, anything that delays a user action.

Standard duration 140ms, ease-out. Fast enough to feel instant, slow enough to
read as connected.

---

## 11. Writing

UI text is part of the design.

- Sentence case for everything. Never Title Case, never ALL CAPS except in
  `<kbd>`.
- Say what happened and what to do next. "Couldn't reach the judge — your code
  is saved, try again in a moment" beats "Error 503".
- Never blame the user.
- Numbers get units and context: "42ms", "3 of 8 test groups passed".
- Disabled controls explain themselves on hover.

---

## 12. Anti-patterns

Do not ship these.

| Anti-pattern | Why |
|---|---|
| Hardcoded hex in a component | Bypasses theming; breaks the moment a theme switches |
| `dark:` variants on elements | Two copies of the UI that drift apart |
| Pure `#000` or `#FFF` text | Harsh in light, vibrating in dark |
| Native checkboxes and radios | Browser defaults look pasted in |
| Glassmorphism, neumorphism, claymorphism | Cost legibility, buy nothing |
| Heavy gradients, large blurs | Slow, and dated within a year |
| Spinners where a skeleton fits | Communicates nothing |
| Colour as the only status signal | Fails accessibility outright |
| A new radius or shadow value | Erodes the system that makes it feel designed |
| Fake data in an empty state | The interface lying about itself |

---

## 13. Checklist

Before a screen is considered done:

- [ ] Light and dark both correct, contrast verified in each
- [ ] No hardcoded colour — every value from a token
- [ ] All seven component states present
- [ ] Keyboard navigable, visible focus, sensible order
- [ ] Status never conveyed by colour alone
- [ ] Loading uses skeletons; empty state designed
- [ ] No horizontal body scroll at 320px
- [ ] Long lists virtualised
- [ ] Numeric columns tabular
- [ ] Nothing non-functional presented as functional
