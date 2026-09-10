# Changelog

All notable changes to DataDev Utilities are documented here, newest first.
Each entry is a `## YYYY-MM-DD` heading with one bullet per change made that day.

## 2026-09-10
- Added an update-notification bell next to the theme toggle: it shows a red dot when there has been an update in the last 7 days, and opens a popup listing the 10 most recent changelog entries.
- Added a **Clean Text** tab for tidying pasted text or SQL: remove blank lines, trim leading/trailing whitespace, and collapse repeated spaces, with live line-count and removed-line stats.
- Added the **clean** tab to the command palette (Ctrl+K) so it can be jumped to like every other tool.

## 2026-09-09
- Added export options to the **Compare** tab, letting you download comparison results as a selectable subset instead of the full report.

## 2026-09-04
- Added a timestamp to generated file names across the app, making repeated exports easier to tell apart.
- Improved CSV parsing in the **SQL Generator** tab with lenient delimiter detection and automatic date normalization.

## 2026-08-24
- Added a modal to the **Log Viewer** tab for reading a full log message in a scrollable, dedicated view.

## 2026-08-21
- Added a live demo link, SEO structured data, and a `robots.txt` / `sitemap.xml` for better discoverability.

## 2026-08-11
- Added the **CSV Viewer** tab: paste or upload delimited data and browse it as a searchable, filterable table.
- Added the **JSON Formatter** tab: live JSON formatting with a code view and an expandable tree view.

## 2026-08-07
- Switched the footer version label to a static "beta" tag, removing an external API call.
- Tab inputs now auto-focus when switching tabs, for faster data entry.
- The sticky note command palette action now toggles the panel instead of only opening it.
- Added **Focus mode** to hide non-essential UI for screen-sharing and demos.

## 2026-08-06
- Restructured the app's CSS into separate files and added a light theme.
- Added the **command palette** (Ctrl+K) for fuzzy-jumping between tabs and running quick actions.

## 2026-08-05
- Added the **Sticky note** scratchpad panel with auto-save.
- Added the **Log Viewer** tab with a searchable, paginated table.

## 2026-08-03
- Added the **Dummy File** tab for generating blank files of a given type and size.
- Added a light/dark theme switch.

## 2026-08-02
- Added min, max, and average calculations to the **Calculator** tab.
- Added the **Merge SQL** tab for combining multiple `.sql` files.
