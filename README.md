# DataDev Utilities

A lightweight, browser-based toolkit that bundles several everyday utilities for developers and data analysts into one **terminal-inspired**, fully responsive interface — no installation, no backend, everything runs client-side.

The UI is styled as a dark terminal window (monospace font, prompt-style labels, blinking cursor) and adapts cleanly from mobile to desktop.

## Features

The app is organized into tabs, each a self-contained tool:

* **`calc`** (Calculator) — Sum a list of numbers (one per line) with live totals, item count, and one-click copy.
* **`dupes`** (Duplicates) — Detect duplicate entries in a list and show how many times each appears.
* **`ascii`** (Non-ASCII) — Detect and highlight non-ASCII / hidden Unicode characters, list their code points, and copy a cleaned (ASCII-only) version of the text.
* **`diff`** (Compare) — Compare two blocks of text line-by-line and highlight the differences between them.
* **`sql`** (SQL Generator) — Generate SQL from an uploaded Excel / CSV file:
  * Upload `.xlsx`, `.xls`, or `.csv` and preview the detected columns.
  * **Delete** — build `DELETE ... WHERE col IN (...)` with automatic per-column de-duplication, from one or more conditions.
  * **Update** — build `UPDATE ... SET ... WHERE ...`, grouping rows with identical `SET` values into a single `IN (...)` statement where possible.
  * Smart quoting: numbers stay unquoted; strings containing a single quote are wrapped in double quotes (and vice versa).
  * The result is previewed and downloaded directly as a `.sql` file.
* **`split`** (Split File) — Split an uploaded Excel / CSV into multiple files, downloaded together as a `.zip`:
  * Set the max rows per file — the number of output files is calculated automatically.
  * Optionally pick a column so rows sharing the same value stay in the same file; leave it empty to split purely by row count.
  * Each output file keeps the header row and matches the uploaded format (`.csv` → CSV, Excel → `.xlsx`).
* **`in()`** (WHERE IN Generator) — Paste a list (one item per line) and get values ready to drop into a SQL `WHERE col IN (...)` clause:
  * Auto-detects the list type: if every line is numeric (integer or decimal, e.g. `500.0000`) you get **two** outputs (unquoted numbers and quoted strings); otherwise only the quoted string output is shown.
  * Decimal values are tidied without changing their value (`500.0000` → `500`, `3.5000` → `3.5`) so the unquoted output matches integer columns for faster queries.
  * Single quotes inside string values are escaped (`'` → `''`) so the output runs safely in SQL; double quotes need no escaping.
  * Output lines wrap at 200 characters, breaking to a new line after a comma.

## Tech Stack

* Plain **HTML + JavaScript** (no build step)
* [Tailwind CSS](https://tailwindcss.com/) (via CDN) for styling
* [JetBrains Mono](https://www.jetbrains.com/lp/mono/) for the terminal-style monospace typography
* [Lucide](https://lucide.dev/) for icons
* [SheetJS](https://sheetjs.com/) for reading & writing Excel / CSV files
* [JSZip](https://stuk.github.io/jszip/) for packaging split files into a ZIP

## Project Structure

```text
auto-utility-tool/
├── index.html          # Markup for all tabs
└── js/
    ├── clipboard.js     # Shared copy-to-clipboard helper
    ├── tabs.js          # Tab navigation
    ├── calculator.js    # Calculator tab
    ├── duplicates.js    # Duplicates tab
    ├── nonAscii.js      # Non-ASCII tab
    ├── compare.js       # Compare tab
    ├── sqlGenerator.js  # SQL Generator tab
    ├── splitFile.js     # Split File tab
    └── whereIn.js       # WHERE IN Generator tab
```

Each tab's logic lives in its own file for easier maintenance.

## Run Locally

Clone this repository:

```bash
git clone https://github.com/Skematografi/auto-utility-tool.git
```

Then simply open `index.html` in your browser — no installation or setup required.

## Live Demo

You can also use the hosted version through GitHub Pages:
[DataDev Utilities](https://skematografi.github.io/auto-utility-tool/)
