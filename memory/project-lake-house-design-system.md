---
name: lake-house-design-system
description: Design system tokens, utility classes, and aesthetic direction for Lake House Manager
metadata:
  type: project
---

The project has a custom design system in `src/styles.css` with these tokens and utilities:

**Color tokens (CSS vars):**
- `--sea-ink` / `--sea-ink-soft` — dark teal text
- `--lagoon` / `--lagoon-deep` — bright/medium teal accent
- `--palm` — forest green (primary brand color)
- `--sand` / `--foam` — light sage background tones
- `--surface` / `--surface-strong` — glass-morphism surfaces (rgba white)
- `--line` — subtle border
- `--kicker` — green for kicker labels
- `--bg-base` / `--header-bg` — page/header backgrounds
- `--hero-a` / `--hero-b` — radial gradient stops for decorative blobs

**Utility classes:**
- `.island-shell` — glassmorphism card (border + gradient bg + shadow + blur)
- `.feature-card` — card variant with hover lift
- `.island-kicker` — small uppercase tracking label
- `.nav-link` — link with animated underline on hover/active
- `.rise-in` — page-load animation (fade + translateY)
- `.display-title` — font-family: Fraunces (serif display)
- `.page-wrap` — centered content wrapper (max 1080px)

**Fonts (Google):** Fraunces (display serif, weights 500/700) + Manrope (sans, 400–800)

**Dark mode:** Full dark theme implemented via `.dark` class.

**Theme color:** `#1a6b4a` (forest green, also in manifest.json)

**Why:** These tokens + classes should be used instead of raw Tailwind colors when building new UI — keeps the lake house aesthetic consistent.
