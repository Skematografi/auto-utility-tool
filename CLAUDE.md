# DataDev Utilities — Project Context

Browser-based, fully client-side utility toolkit for developers & data analysts, styled as
a dark terminal window. **No build step, no framework, no backend** — plain HTML + vanilla
JS, open `index.html` directly or serve it statically. Deployed via GitHub Pages.

## Tech stack

- Plain HTML + vanilla JavaScript (ES6), no bundler/transpiler
- Tailwind CSS via CDN (`cdn.tailwindcss.com`) — utility classes inline in markup
- Lucide icons (CDN) — call `lucide.createIcons()` after injecting new `data-lucide` elements
- SheetJS (`xlsx`) for reading/writing Excel & CSV; JSZip for zipping split output
- JetBrains Mono (Google Fonts) for the terminal look

## Structure

```
index.html          # ALL markup: one hidden/visible <div id="...View"> per tab
js/clipboard.js     # Shared handleClipboardCopy() helper (used by every copy button)
js/tabs.js          # Tab navigation (switchTab) — every tab must be registered here
js/calculator.js    # calc  — sum a list of numbers
js/duplicates.js    # dupes — find duplicate lines
js/nonAscii.js      # ascii — detect non-ASCII chars
js/compare.js       # diff  — compare two texts
js/sqlGenerator.js  # sql   — generate DELETE/UPDATE SQL from Excel/CSV
js/splitFile.js     # split — split Excel/CSV into a ZIP of smaller files
js/whereIn.js       # in()  — turn a pasted list into WHERE IN (...) values
```

One JS file per tab; each file only touches its own tab's DOM ids.

## Adding a new tab — checklist

1. `index.html`: add a `<button id="tabXxxBtn">` to the tab grid (adjust the grid's
   `grid-cols-*` / `sm:grid-cols-*` count to fit the new total) and a
   `<div id="xxxView" class="space-y-6 hidden">` view section.
2. `js/tabs.js`: add the button/view consts, click listener, the reset lines
   (`TAB_INACTIVE` + `classList.add('hidden')`), and a `switchTab` branch.
3. Create `js/xxx.js` with the tab's logic; include it with a `<script>` tag at the
   bottom of `index.html` (after `tabs.js`).
4. Update `README.md` (Features bullet + Project Structure tree).

## UI conventions (match existing tabs)

- Terminal theme: `bg-zinc-950` page, `bg-zinc-900` window, emerald primary accent,
  sky secondary accent, amber for the "Copied!" flash.
- Labels use prompt prefixes: `$` for inputs, `#` for outputs/options.
- Text tools recompute live on the `input` event — no submit button.
- Copy buttons call `handleClipboardCopy(text, btn, originalLabel, ...)` from
  `js/clipboard.js`; disabled state uses `disabled:opacity-40`.
- Stat badges: rounded-full pill with `items:` / `detected:` style label + count.
- UI text is lowercase English (terminal style); code comments are Indonesian.

## Rules

- Never introduce a build step, npm packages, a framework, or a backend.
- New third-party libs only via CDN `<script>` in `index.html`, and only when necessary.
- Generated SQL must be valid & safe to run: escape `'` by doubling (`''`); numbers unquoted.
- Everything must keep working when opened as a static page (GitHub Pages / `file://`).
- Update `README.md` whenever features change.

## Run / verify

- Preview server: `.claude/launch.json` defines `static` → `python -m http.server 4599`.
- After UI changes, verify in the browser (open the tab, exercise the feature, check console).

See `.clauderules` for the condensed guardrails and `.claude/skills/datadev-utilities/SKILL.md`
for the full authoring guide (persona, add-a-tab workflow, gotchas) — read it before
adding or changing a tool tab.
