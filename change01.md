You are updating an existing vanilla HTML/CSS/JS PWA (no bundler, no backend). Do not introduce frameworks. Preserve all current contracts, i18n, PWA update flow, and golden tests A–E. Implement the changes below.

## New features & changes

1) Feed Table Visualization (no heatmap)
- In the feed detail, add a **"Table"** tab that renders the age × weight grid.
- Render headers: first row = weight axis, first column = age axis (presentation units only).
- Each value cell must include data attributes: `data-age-index`, `data-weight-index`.
- Style classes:
  - `.cell` for every data cell
  - `.cell--used` for cells used in the last calculation (1, 2, or 4 of them)
  - `.cell--missing` for `null` cells (show "—" and a hatched background)
- Provide a UI control in the result panel: **"Highlight in table"**. When clicked:
  - Clear previous highlights and apply `.cell--used` to the exact set of cells used by the last calculation.
  - Scroll/focus the first highlighted cell into view (accessibility).

2) Missing values in the grid (null) – official support
- Import and normalization already support values conversion; now the **grid matrix may contain `null`** entries.
- Extend `computeDaily` rules:
  - Exact match: if the target cell is `null` → **throw** `{ code: "MISSING_DATA", meta: { cells: [{ ageIndex, weightIndex }] } }`.
  - 1D interpolation: requires both neighboring values on the exact axis to be numbers; otherwise **throw `MISSING_DATA`** including the missing neighbors.
  - 2D interpolation: requires **all four** corner values; if any is `null`, **throw `MISSING_DATA`** listing the missing corners.
- Do **not** attempt to interpolate across missing values beyond those rules (no gap-filling).
- On `MISSING_DATA`, the UI must surface an i18n message and **highlight** those missing cells in the table using both `.cell--missing` and `.cell--used`.

3) Excel/Sheets paste import (TSV/CSV)
- In the **Import Feed** wizard, add a "Paste from Excel/Sheets" path.
- Step 1: A textarea accepts pasted text. Auto-detect separator in priority order: tab (`\t`), semicolon (`;`), comma (`,`).
- Allow toggling whether **first row** is weight headers and **first column** is age headers (default: auto-detect; if the [0,0] cell is empty).
- Units are **selected via side panel** (age: days/weeks/months; weight: kg/lb; value: g/day|oz/day|cup/day; `cupGrams` required for cup/day).
- Parse numeric cells; empty strings → `null`. Build an imported feed object and pass it through **existing `normalizeFeed`** (which still converts to kg/days/g/day).
- Step 2: Preview the grid, show validation errors/warnings, and allow a quick sample calculation to verify.

4) JSON format documentation page
- Provide a simple page/section **"JSON Format"** linked from the import wizard.
- Describe fields, units, and include an example with a `null` inside the `values` matrix.
- Document the conversion constants: months=30.4375 days; 1 lb=0.45359237 kg; 1 oz=28.349523125 g.
- Document the new error code **`MISSING_DATA`** and when it occurs.

## Contracts & tests
- Keep all existing contracts unchanged (global functions, error codes, i18n keys, PWA update flow). **Add** a new error code:
  - `MISSING_DATA`: throw with `{ code: "MISSING_DATA", message, meta: { cells: [{ageIndex, weightIndex}] } }`.
- `normalizeFeed` may now **retain `null`** entries in `values_g_per_day` (after unit conversion).
- `computeDaily` must throw `MISSING_DATA` per rules above; on success, the debug payload remains unchanged.
- Do not break the existing golden tests A–E. (Optional: we may run extended tests F and G if present.)

## UI & accessibility
- The table must be keyboard navigable; ensure focus lands on the highlighted cell when invoked.
- Use `aria-live` for error messages (e.g., OUT_OF_RANGE, MISSING_DATA).
- Units shown in headers are **presentation only**; internal math stays kg/days/g/day.

## Constraints
- No frameworks or build steps. Plain JS modules only.
- No external services and no network calls except the existing PWA update check.

## Definition of Done
- Paste-from-Excel import works (TSV/CSV), including units panel and preview.
- JSON format page is available and understandable.
- Table visualization renders correctly, with clear `null` cells.
- "Highlight in table" marks exactly 1/2/4 cells used in the last calculation and focuses them.
- `MISSING_DATA` is thrown and visually indicated when required cells are null.
- Existing golden tests A–E still pass.
