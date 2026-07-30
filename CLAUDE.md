# DataDev Utilities — Project Context

Browser-based, fully client-side utility toolkit for developers & data analysts, styled as
a dark terminal window. **No build step, no framework, no backend** — plain HTML + vanilla
JS, open `index.html` directly or serve it statically. Deployed via GitHub Pages.

## Tech stack

- Plain HTML + vanilla JavaScript (ES6), no bundler/transpiler
- Tailwind CSS via CDN (`cdn.tailwindcss.com`) — utility classes inline in markup
- Small custom CSS in `assets/css/styles.css` (terminal cursor, thin scrollbar, deep-space background)
- Lucide icons (CDN) — call `lucide.createIcons()` after injecting new `data-lucide` elements
- SheetJS (`xlsx`) for reading/writing Excel & CSV; JSZip for zipping split output
- JetBrains Mono (Google Fonts) for the terminal look

## Structure

```
index.html                 # ALL markup + <head> (meta/OG/Twitter, favicon, stylesheet & script links)
assets/css/styles.css      # Custom CSS: blinking cursor, thin scrollbar, deep-space body bg, #bg canvas
assets/images/             # favicon.svg, og-image.png, editor.webp
assets/js/
  clipboard.js     # Shared handleClipboardCopy() helper (used by every copy button)
  tabs.js          # Tab navigation (switchTab) — every tab must be registered here
  parallax.js      # Animated deep-space starfield background + footer on/off toggle (localStorage)
  version.js       # Footer version — fetches latest GitHub release tag (cached in localStorage)
  analytics.js     # Google Analytics (GA4) loader; skipped on localhost / file://
  calculator.js    # calc    — sum a list of numbers (accepts ID/EU number formats)
  duplicates.js    # dupes   — find duplicates (copy dupes / unique / non-dupes)
  nonAscii.js      # ascii   — detect non-ASCII in text, or scan an Excel/CSV by row
  compare.js       # diff    — compare two texts line by line
  sqlGenerator.js  # sql     — generate DELETE / UPDATE / template SQL from Excel/CSV
  splitFile.js     # split   — split Excel/CSV into a ZIP by max rows per file
  whereIn.js       # in()    — turn a pasted list into WHERE IN (...) values (+ template, chunking)
  charCount.js     # chars   — character/byte counts & DB storage estimates
  jsonToSql.js     # restore — JSON → INSERT statements
```

One JS file per tab; each file only touches its own tab's DOM ids. Shared/non-tab scripts
(`clipboard`, `tabs`, `parallax`, `version`, `analytics`) are the exceptions.

Assets are referenced with a `?v=1.0.0` cache-busting query — bump it when an asset changes
so returning users get the new version instead of a cached one.

## Adding a new tab — checklist

1. `index.html`: add a `<button id="tabXxxBtn">` to the tab grid (adjust the grid's
   `grid-cols-3 sm:grid-cols-5 lg:grid-cols-9` counts to fit the new total) and a
   `<div id="xxxView" class="space-y-6 hidden">` view section.
2. `assets/js/tabs.js`: add the button/view consts, click listener, the reset lines
   (`TAB_INACTIVE` + `classList.add('hidden')`), and a `switchTab` branch.
3. Create `assets/js/xxx.js` with the tab's logic; include it with a
   `<script src="assets/js/xxx.js?v=1.0.0">` tag at the bottom of `index.html` (after `tabs.js`).
4. Update `README.md` (Features bullet + Project Structure tree).

## UI conventions (match existing tabs)

- Terminal theme: `bg-zinc-950` page, `bg-zinc-900` window, emerald primary accent,
  sky secondary accent, amber for the "Copied!" flash.
- Labels use prompt prefixes: `$` for inputs, `#` for outputs/options.
- Text tools recompute live on the `input` event — no submit button.
- Copy buttons call `handleClipboardCopy(text, btn, originalLabel, ...)` from
  `assets/js/clipboard.js`; disabled state uses `disabled:opacity-40`.
- Stat badges: rounded-full pill with `items:` / `detected:` style label + count.
- UI text is lowercase English (terminal style); **code comments are in simple, professional English.**

## Rules

- Never introduce a build step, npm packages, a framework, or a backend.
- New third-party libs only via CDN `<script>` in `index.html`, and only when necessary.
- Generated SQL must be valid & safe to run: escape `'` by doubling (`''`); numbers unquoted.
- Everything must keep working when opened as a static page (GitHub Pages / `file://`).
- The only external network calls are non-core: Google Analytics and the footer version
  fetch (GitHub Releases API) — the tools themselves must work fully offline.
- Update `README.md` whenever features change.

## Run / verify

- Preview server: `.claude/launch.json` defines `static` → `python -m http.server 4599`
  (serves the repo root; assets live under `assets/`).
- After UI changes, verify in the browser (open the tab, exercise the feature, check console).

See `.clauderules` for the condensed guardrails and `.claude/skills/datadev-utilities/SKILL.md`
for the full authoring guide (persona, add-a-tab workflow, gotchas) — read it before
adding or changing a tool tab.
