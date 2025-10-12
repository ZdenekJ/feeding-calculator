You are a senior front-end engineer. Build a minimal, production-ready **vanilla HTML/CSS/JS** PWA with no bundler, no backend. The app is an **offline-first puppy feeding calculator** that computes daily food amount for puppies using **bilinear interpolation** over feed tables (age × weight). Extrapolation is **forbidden**.

## Functional requirements (MVP)
- Species: **puppy only**, single animal.
- Inputs: weight (kg/lb), age (either entered manually or auto-computed from **birth date**).
- Feeds: user-imported JSON tables (age axis × weight axis → value matrix).
- Calculation: **bilinear interpolation** to get **grams per day**, then split into portions per day by age:
  - `< 4 months` → 4 portions, `>= 4 and < 6 months` → 3 portions, `>= 6 months` → 2 portions.
- Units:
  - Internal canonical units: **kg** (weight), **days** (age), **g/day** (values).
  - Import can be in **kg|lb**, **days|weeks|months**, and **g/day|oz/day|cup/day**.
  - `oz/day` → multiply by **28.349523125**.
  - `cup/day` → multiply by **cupGrams`** provided in the feed JSON (1 cup → grams).
- Extrapolation: forbidden. If input is outside the axes ranges, throw an error with code **OUT_OF_RANGE**.
- Languages: **Czech + English** (i18n).
- Settings: theme (light/dark/system), language, unit system (metric/imperial), puppy birth date + toggle “auto age”, rounding step in grams (default 5), extrapolation fixed to `forbid`.
- PWA: installable, offline after first load.
- Update flow: show a **toast** when a new version is available; apply update **only after user consent**; then reload.
- Local-only: all data in browser; no external APIs.

## Non-functional
- Accessibility: keyboard navigation, labels, ARIA where appropriate, good contrast.
- No build step. Plain `<script type="module">` is OK. Everything under `/public`.

## Directory layout (suggested)
You may structure freely, but expect a static host. Suggested:
- `/public/index.html`, `styles.css`, `manifest.webmanifest`, `sw.js`, `version.json`
- `/public/js/{main.js,pwa.js,i18n.js,storage.js,feeds.js,calculator.js,settings.js,ui.js}`
- `/public/tests.js` (we provide), `/public/sample-feed-gday.json`, `/public/sample-feed-cup.json`

## Mandatory global functions (contract)
Your implementation **must expose these functions on `window` (or `self`)** so tests can call them:

1) `normalizeFeed(importedFeed) -> normalizedFeed`
   - Normalize to canonical units:
     - weight axis → **kg** (from lb via `lb * 0.45359237`)
     - age axis → **days** (months = `value * 30.4375`, weeks = `value * 7`)
     - matrix values → **g/day** (`oz * 28.349523125`, `cup * cupGrams`)
   - Validate ascending, unique axes; matrix dimension equals `age.length × weight.length`; all values > 0.
   - On invalid input, **throw** with error codes (see below).
   - Output shape must include:
     ```
     {
       axes: {
         weight: { values_kg: Number[] },
         age:    { values_days: Number[] }
       },
       grid: {
         values_g_per_day: Number[][]
       }
     }
     ```

2) `diffInDays(birthDateISO /* "YYYY-MM-DD" */, now = new Date()) -> Number`
   - Compute whole-day difference using local midnight in **Europe/Prague** (avoid TZ drift).

3) `portionsPerDay(ageDays) -> 4|3|2`
   - `< 4 months` → 4, `>= 4 and < 6 months` → 3, `>= 6 months` → 2 (months = days / 30.4375).

4) `computeDaily(normalizedFeed, weightKg, ageDays, roundingStep /* grams */) -> { gramsPerDay, portions, gramsPerPortion, debug }`
   - Bilinear interpolation (no extrapolation).
   - If outside range, **throw** `{ code: "OUT_OF_RANGE", meta: { ageMin, ageMax, wMin, wMax } }`.
   - Round `gramsPerDay` and `gramsPerPortion` to `roundingStep`.
   - Include `debug: { x0,x1,y0,y1,Q11,Q21,Q12,Q22,t,u }` for transparency.

## Error codes (required)
Throw objects like: `{ code: "INVALID_AXIS_VALUES", message: string, meta?: any }`
- `INVALID_AXIS_VALUES`
- `MATRIX_DIM_MISMATCH`
- `UNSUPPORTED_VALUE_UNIT`
- `MISSING_CUP_GRAMS`
- `NON_POSITIVE_VALUES`
- `OUT_OF_RANGE`

## i18n contract (minimum)
Implement:
- `t(key: string, params?: Record<string, string|number>): string`
- `setLang(lang: "cs" | "en"): void`
Must include keys: `app_title`, `new_version_available`, `btn_update`, `btn_dismiss`, `err_out_of_range`.

## PWA update flow (required)
- `sw.js` must cache the app shell.
- Do **not** call `skipWaiting` automatically.
- Listen for `message` with `"SKIP_WAITING"` in the SW and then call `self.skipWaiting()`.
- In the page, after `controllerchange`, call `location.reload()`.
- Poll `/version.json` with `cache: "no-store"` every ~1 hour and call `registration.update()` to detect new SW.
- Show a toast with **Update** (sends `"SKIP_WAITING"`) and **Later**.

## Tests ("golden tests")
We provide `/public/tests.js`, which imports and runs after your implementation if the URL contains `?tests=1`.  
**All tests A–E must pass**:
- **A**: unit normalization
- **B**: bilinear @ center = 250 g/day
- **C**: OUT_OF_RANGE with correct meta
- **D**: portions by age
- **E**: rounding to step

If your functions are not found globally, tests will fail.

## UI scope (minimum)
- Pages: **Calculation / Feeds / Settings** (SPA, hash router ok).
- Calculation: inputs (weight, age or auto-age), feed selector, result (g/day, portions/day, g/portion), and a small “How it was computed” section using `debug`.
- Feeds: list, import (paste/upload), dry-run preview, save.
- Settings: theme, language, unit system, birth date, auto-age toggle, rounding step, data export/import.
- Empty state: offer importing sample feeds (`/sample-feed-gday.json`, `/sample-feed-cup.json`).

## Accessibility
- Proper labels and roles; keyboard navigation; readable error messages; sufficient color contrast.

## Constraints
- **No frameworks**, no bundlers, no external services. Plain JS modules allowed.
- Keep code modular and readable; comments in English.
- All persistence must be local (LocalStorage is fine).

## Definition of done
- App loads and works offline after first visit.
- Installable PWA.
- Update prompt appears on new version and applies after consent.
- Golden tests pass with `?tests=1`.
- UI works in CZ and EN; settings persist.
- Import sample feeds works; calculations match expectations; extrapolation is forbidden.

Now implement the app in `/public`, ensuring the required global functions exist and all tests pass.
