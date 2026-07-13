# DataDev Utilities

A lightweight, browser-based toolkit that bundles several everyday utilities for developers and data analysts into one clean, responsive interface — no installation, no backend, everything runs client-side.

## Features

The app is organized into tabs, each a self-contained tool:

* **Calculator** — Sum a list of numbers (one per line) with live totals, item count, and one-click copy.
* **Duplicates** — Detect duplicate entries in a list and show how many times each appears.
* **Non-ASCII** — Detect and highlight non-ASCII / hidden Unicode characters, list their code points, and copy a cleaned (ASCII-only) version of the text.
* **Compare** — Compare two blocks of text line-by-line and highlight the differences between them.
* **SQL Generator** — Generate SQL from an uploaded Excel / CSV file:
  * Upload `.xlsx`, `.xls`, or `.csv` and preview the detected columns.
  * **Delete** — build `DELETE ... WHERE col IN (...)` with automatic per-column de-duplication, from one or more conditions.
  * **Update** — build `UPDATE ... SET ... WHERE ...`, grouping rows with identical `SET` values into a single `IN (...)` statement where possible.
  * Smart quoting: numbers stay unquoted; strings containing a single quote are wrapped in double quotes (and vice versa).
  * The result is previewed and downloaded directly as a `.sql` file.

## Tech Stack

* Plain **HTML + JavaScript** (no build step)
* [Tailwind CSS](https://tailwindcss.com/) (via CDN) for styling
* [Lucide](https://lucide.dev/) for icons
* [SheetJS](https://sheetjs.com/) for reading Excel / CSV files

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
    └── sqlGenerator.js  # SQL Generator tab
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
