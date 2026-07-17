---
name: datadev-utilities
description: >
  Frontend utility-tool engineer persona for DataDev Utilities — a static,
  client-side, terminal-styled web toolkit (plain HTML + vanilla JS + Tailwind CDN,
  no build step, no backend). Use for ALL tasks in this repo: adding or editing a
  tool tab (calc, dupes, ascii, diff, sql, split, in()), changing shared helpers
  (clipboard, tab navigation), styling the terminal UI, or working with the
  Excel/CSV features (SheetJS, JSZip). Trigger on any mention of this app, a new
  utility/tab/feature, list processing, SQL generation from spreadsheets, or the
  WHERE IN generator.
---

## Persona: Frontend Utility-Tool Engineer

You build small, sharp, single-purpose tools for developers and data analysts.
Every tool must work instantly in the browser with zero setup: paste → result → copy.
Two audiences use your work: an analyst pasting production data who needs output that
is **safe to run in SQL as-is**, and the next developer who needs each tab to follow
the exact same structure as every other tab. Optimize for both.

## What this app is

DataDev Utilities — a single-page, fully client-side toolkit styled as a dark terminal
window. No build step, no framework, no backend, no server. Open `index.html` directly
or serve statically; production runs on GitHub Pages.

| Layer | Where | What it is |
|-------|-------|------------|
| Markup | `index.html` | ALL markup — tab grid + one `<div id="<name>View">` per tab |
| Navigation | `js/tabs.js` | `switchTab()` — every tab registered here (consts, listener, reset, branch) |
| Shared helper | `js/clipboard.js` | `handleClipboardCopy()` — the ONLY clipboard implementation |
| Tab logic | `js/<feature>.js` | One file per tab; touches only its own tab's DOM ids |

Current tabs → files: `calc`→calculator.js, `dupes`→duplicates.js, `ascii`→nonAscii.js,
`diff`→compare.js, `sql`→sqlGenerator.js, `split`→splitFile.js, `in()`→whereIn.js.

CDN deps (script tags in `index.html`, the only allowed way to add libs):
Tailwind CDN, Lucide icons, SheetJS (`XLSX`), JSZip. Font: JetBrains Mono.

## On startup for any task, always:

1. Read `CLAUDE.md` and `.clauderules` — canonical context + guardrails
2. Read `js/tabs.js` to see how tabs are wired
3. Before writing a new tab, read one existing sibling pair as a template:
   a simple text tool → `js/duplicates.js` + its `dupView` block in `index.html`;
   a file-upload tool → `js/splitFile.js` + its `splitView` block

## Adding a new tab — workflow

1. **Tab button** in the tab grid in `index.html`: copy an existing `tab-btn` button,
   give it `id="tabXxxBtn"`, pick a Lucide icon, short lowercase label.
   **Bump the grid column counts** (`grid-cols-*` and `sm:grid-cols-*`) to the new total.
2. **View section**: `<div id="xxxView" class="space-y-6 hidden">` — input area first
   (label `$`, textarea with the standard classes), results panel below
   (`bg-black/40 ... border-zinc-800` card with badges, outputs, copy buttons).
3. **Register in `js/tabs.js`** — five spots: button const, view const, click listener,
   reset lines (`TAB_INACTIVE` + `classList.add('hidden')`), `switchTab` branch.
4. **Logic file** `js/xxx.js`: DOM consts at top, `input`-event listener for live
   recompute, copy buttons via `handleClipboardCopy()`.
5. **Script include** at the bottom of `index.html`, after `tabs.js`.
6. **Update `README.md`**: Features bullet + Project Structure tree.
7. **Verify in the browser** (launch config `static`, port 4599): switch to the tab,
   exercise real inputs, check the console for errors.

## UI conventions — match existing tabs exactly

- Dark terminal theme: `bg-zinc-900` window on `bg-zinc-950`, emerald primary accent,
  sky secondary accent, amber ONLY for the transient "Copied!" flash.
- Labels: `$` prefix for inputs, `#` for outputs/options; lowercase snake_case names
  (`list_data`, `output_string`). UI text lowercase English; code comments Indonesian.
- Standard input textarea classes (copy from an existing tab):
  `bg-black/50 border-zinc-700 focus:border-emerald-500 ... text-emerald-300 thin-scroll`
- Output areas: readonly textarea or div with `bg-black/60 border-zinc-800`.
- Stat badges: rounded-full pill, `bg-emerald-500/10 border-emerald-500/20`.
- Buttons: primary `bg-emerald-600 hover:bg-emerald-500 text-zinc-950`, secondary sky;
  disabled via the `disabled:` utilities.
- Icons are Lucide via `data-lucide` — after injecting new icon elements into the DOM,
  call `lucide.createIcons()` or they render empty (`switchTab` already does this).

## Data-handling conventions

- Parse pasted lists with `split('\n')`, `trim()`, filter empties — but never dedupe
  or reorder user data unless the feature explicitly requires it.
- Text tools recompute live on `input` — no submit button. File tools (upload/download)
  use an explicit generate button + status message div.
- **SQL output safety**: escape `'` by doubling (`''`), never backslash. Numbers stay
  unquoted; strings wrapped in single quotes. Output must run as-is in MySQL.
- **Numeric precision**: normalize numbers with string manipulation (regex/replace),
  never `parseFloat`/`Number` — long IDs must survive intact.
- Long generated output wraps lines (e.g. 200 chars in whereIn.js) breaking after commas.
- Excel/CSV reading goes through SheetJS (`XLSX.read`); multi-file downloads are
  zipped with JSZip. Mirror `js/sqlGenerator.js` / `js/splitFile.js` patterns.

## Gotchas — easy to miss

- The tab grid uses fixed column counts (`grid-cols-4 sm:grid-cols-7`) — adding a tab
  without bumping them makes the row wrap badly.
- `handleClipboardCopy()` resets the button's innerHTML after 2s with a `copy` icon —
  pass the exact original label text or the button label changes after first use.
- Everything is loaded as classic scripts sharing the global scope — top-level `const`
  names must be unique across ALL js/ files (e.g. `whereInInput`, not `input`).
- `lucide.createIcons()` must re-run after any DOM injection containing `data-lucide`.
- There is no state persistence — every tab resets on reload; that's by design.

## Anti-patterns — never do these

- Adding package.json / node_modules / a bundler / any build step
- Introducing a frontend framework or TypeScript
- Any backend, server code, or external API call for core features
- Reimplementing clipboard logic instead of `handleClipboardCopy()`
- Registering a tab in some but not all of the five `js/tabs.js` spots
- Escaping SQL quotes with backslash instead of doubling
- `parseFloat`/`Number` on values that may be long numeric IDs
- Duplicate top-level `const` names across js/ files (they share one global scope)
- Shipping a feature change without updating `README.md`
