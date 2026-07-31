# Design reference

UI reference for the platform, exported from Figma.

**Source:** [Coding platform](https://www.figma.com/design/G7dKELqLd0cJ9PdyrThYqB/Coding-platform?node-id=0-1)

```
source/   The full-page export, exactly as it came out of Figma.
frames/   Per-screen crops, cut from the source export.
```

`frames/_source-coordinates.json` records each frame's pixel box in the source
image, so a crop can be regenerated or re-cut at a different boundary without
re-exporting from Figma.

## Screens

| File | Screen |
|---|---|
| `00-style-guide.png` | Colour ramps, type stack, button variants — the design system |
| `01-splash-loading.png` | Splash / environment loading |
| `02-auth-login.png` | Login and marketing panel |
| `03-student-dashboard.png` | Student home: stats, weekly activity, topic mastery, recommendations |
| `04-problem-list.png` | Problem table, filters, daily challenge |
| `05-problem-detail-editor.png` | Problem statement + code editor + console — the densest screen |
| `06-profile.png` | Profile, submission heatmap, badges, skills |
| `07-contests-arena.png` | Live contest, rating, upcoming contests |
| `08-notifications.png` | Notification inbox |
| `09-assignments-overview.png` | Assignments with due dates and marks † |
| `10-global-leaderboard.png` | Podium + ranked table, filtered by department † |
| `11-settings.png` | Account settings |
| `12-faculty-portal-overview.png` | Faculty dashboard † |
| `13-faculty-design-challenge.png` | Faculty problem authoring † |
| `14-student-analytics.png` | Course-level progress and analytics † |

† These screens belong to the LMS layer that design doc §1 puts out of scope.
See the scope note in the root [README](../README.md) — they are deferred, not
being built yet.

## Extracted so far

From `00-style-guide.png`, sampled programmatically rather than eyeballed:

**Brand colours** — Primary `#3B82F6`, Secondary `#60A5FA`, Tertiary `#D16900`,
Neutral `#0F172A`. Each carries an 11-step tonal ramp (50–950).

Note the brand hex values do **not** sit on any ramp step. Components use the
ramp, not the brand colour: the primary button is `#ADC6FF` (primary-200), the
label button `#4D8EFF` (primary-400), the tertiary icon button `#DF7412`
(tertiary-400). Treat the brand colours as separate tokens from the ramps.

**Surfaces** — page `#0B1326`, card `#171F33`, raised `#222A3D`.

**Type** — Headline: Geist. Body: Inter. Label: JetBrains Mono.

## Not yet extracted

- Spacing and radius scales. These need the export's scale factor, which is not
  yet pinned down — the page was clamped to Figma's 32768px maximum width, so
  the ratio between export pixels and design pixels is not a round number.
- Hover, focus, active, and disabled states. A flat PNG cannot show them.
- Transitions and motion.
- Dark/light variants, if the file has both.

Anything in that list should be read from Figma directly rather than guessed
from these images. If the guesswork becomes a bottleneck, the Figma REST API
gives exact values on a free plan — that path was offered and deferred in favour
of PNG exports.

## Using these with an AI UI generator

[docs/UI-GENERATION-PROMPT.md](../docs/UI-GENERATION-PROMPT.md) holds paste-ready
prompts for v0 or Lovable, with the extracted tokens above already inlined and a
per-screen brief for each frame. It says which PNG to attach at each step.
