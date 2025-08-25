# ARG System Data & Performance Report

This script was developed to generate a structured performance and content map of the Facility ARG. It inspects the current local build as a full simulated session, triggering all known save states and accessing every reachable page.

The analysis focuses on textual density, DOM complexity, route behaviour, and save state propagation across the app. The data can be used to monitor scalability, detect regressions, or guide future optimization and narrative layering.

> [!IMPORTANT]
>
> This is a very crude and simple measuring test done, and so it doesn't fully reflect the actual results, I also excluded the `404` and `CHEATER` and `h0m3` or any of the `api` endpoints which may skew the results!
>
> This doesn't invalidate the data successfully gathered, only means the data is not deep enough, so you may trust all data seen
>
> Note that the middleware process was entirely skipped (so I can ignore many constraints), this may also skew results

---

## ✅ What the script gathers

### 🧭 ROUTE STRUCTURE

- Lists all user-facing routes in `app/`, ignoring API and restricted/cheat paths
- For each route:
  - HTTP status code (helps track gated pages or broken unlock logic)
  - Load time in milliseconds
  - Word count (for narrative density)
  - DOM node count (for render complexity)
  - LocalStorage usage in KB
  - Set cookies at time of load
  - Lighthouse scores (performance, SEO, a11y, best practices)
  - JS heap memory (if measurable from `performance.memory`)

### 🍪 SAVE DATA COVERAGE

- Sets every boolean cookie used in the ARG (`X=true.hash`)
- Confirms they're signed and accepted by all routes
- Allows test sessions to simulate full progression

### 🖼 STATIC ASSET OVERVIEW

- Measures total weight (MB) of everything in:
  - `public/` (audio, images, puzzle files)
  - `.next/static/` (JS chunks)
- Lists each asset with its size in KB
- Groups assets by file extension

### 🧩 CODE COMPLEXITY (SELECTED FOLDERS)

- Scans the `components/`, `hooks/`, `lib/`, and `certs/` folders
- For each file:
  - Word count (excluding comments/whitespace)
  - DOM node approximations (JSX tags or HTML structure)
  - Useful to estimate impact on rendering or narrative length

### 🔀 GIT CONTEXT

- Stores the latest Git commit hash to tie the report to a code version

---

## ❌ What it doesn’t do

- **Does not emulate progression** — assumes all cookies are already unlocked
- **Does not follow links or simulate flow** — each page is tested in isolation
- **Does not crawl unreached pages** — only loads what exists in the `app/` folder
- **Does not interpret content** — no analysis of themes, audio, puzzles, or scripts
- **Does not test responsiveness or mobile views**
- **Does not perform JS interaction tests** — avoids clicks, typing, form inputs

---

## Purpose

This is a tool to **profile the ARG as a system**, not a player. It provides a reproducible snapshot of:
- How heavy each page is (load/memory/DOM/words)
- What pages exist at any given build state
- How much is stored via cookies/localStorage
- How well the site performs under full unlock state

It helps with balancing structure vs performance, confirming state handling, and reviewing growth of asset and narrative bloat over time.

---

## Output

Everything is stored in: `ARG_Performance_Results.json`

Structured into:
- `pages`: per-route analysis
- `global`: totals and averages
- `public_assets`, `next_static_chunks`, `certs`: asset weight breakdowns
- `hooks`, `components`, `lib`: code text/DOM estimates
- `git_commit`: commit hash string

---

*Generated automatically by a dedicated analysis tool combining page visits, browser metrics, and static asset inspection.*

