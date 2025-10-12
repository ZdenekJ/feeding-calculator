Delta prompt for the implementation agent (EN)

Context: The app is already a vanilla JS PWA (no bundler, no backend). Contracts and golden tests A–E pass. We previously added table visualization and MISSING_DATA behavior.
Goal: Apply the UI/UX enhancements below without breaking existing contracts, tests, or the PWA update flow.

0. Do not break

Keep all previous contracts, error codes (incl. MISSING_DATA), global functions, i18n, PWA update flow, and golden tests A–E intact.

Maintain internal canonical units (kg / days / g/day) for all math.

1. Calculation page = Inputs + Table (side by side)

What: On the Calculation page, show:

Left (or top on small screens): inputs (weight, age mode = auto from birth date or manual age).

Right (or bottom): the selected feed table (the same table component as in feed detail), including missing-value styling.

Auto-calculation:

Calculation runs automatically after the user finishes input:

Use a debounce of 500 ms on input changes.

If auto age is ON → weight alone is sufficient to trigger calculation.

If manual age is used → require both weight and age to be valid.

Keep a “Calculate” button for users who prefer explicit action; clicking it runs validation and calculation immediately and cancels pending debounce.

After a successful calculation:

Highlight in the table the exact set of cells used (1, 2, or 4).

Scroll/focus the first highlighted cell into view (for accessibility).

Persistence of last inputs:

Store last used inputs in LocalStorage under fc_lastInput_v1:
{
"weight": 7.8, // user-entered weight (in the currently selected UI unit)
"ageMode": "auto" | "manual",
"ageInput": { "value": 4, "unit": "months" }, // only when manual
"selectedFeedId": "feed-id"
}

On app load, pre-fill inputs from this store if present. When unit toggles change, convert the stored weight/age presentation accordingly.

Validation UX:

While required inputs are incomplete/invalid, disable result, clear highlights, and show inline hints (i18n).

On OUT_OF_RANGE or MISSING_DATA, render the i18n error and highlight the relevant cells in the table (as already implemented).

2. Feed list → expandable preview

What: On the Feeds overview page, each feed card has an expand/collapse (use <details>/<summary> for a11y) to show a compact table preview of the feed:

Sticky headers for axes.

Horizontal/vertical scroll if needed.

“Open in detail” link remains.

3. Table presentation = preserve original orientation and units

Requirement: Users must see the table exactly in the same orientation and units as the data they provided.

Implementation:

Extend the normalized feed object with a presentation metadata section copied from import time:

normalizedFeed.presentation = {
// Orientation used for display:
// "cols-weight_rows-age" (default)
// "cols-age_rows-weight" (if user provided flipped)
orientation: "cols-weight_rows-age",

// Original axis meta used for display only (not for math):
age: { unit: "months" | "weeks" | "days", values: number[], label?: string },
weight: { unit: "kg" | "lb", values: number[], label?: string },

// Original value unit for display (the grid was converted for math already)
valueUnit: "g/day" | "oz/day" | "cup/day",
cupGrams: number | null
};

Excel paste wizard must let the user confirm orientation:

“First row are weights (columns), first column are ages (rows)” (default)

or “First row are ages (columns), first column are weights (rows)”

JSON import: allow optional presentation.orientation; if absent, default to "cols-weight_rows-age".

The table renderer must transpose accordingly for display, but still map back to the normalized arrays for highlighting by indexes.

Notes:

Internal math keeps using kg/days/g/day and the standard indexing (weights as xs, ages as ys).

Displayed axis labels show original units and values from presentation.

4. “How to import a feed” guide + Copy-to-clipboard AI prompt

Add an Import guide into the Import wizard (step 0) with three options:

Easiest (recommended) – “Use your AI assistant”

Show a single copy button that copies a robust prompt (both CZ and EN versions via i18n) into the clipboard.

After the user pastes the manufacturer’s table or image to their AI, the AI will guide them and output a JSON that our app accepts.

From Excel/Sheets (paste) – already supported

Brief instructions: copy the grid including headers → paste into textarea → set units & orientation → preview → save.

From JSON

Link to “JSON Format” docs page with the schema, including null support and the MISSING_DATA rules.

Provide the AI prompt content (include in code as a template; also i18n):

AI prompt – Czech (i18n key: ai_import_prompt_cs)
Jsi asistent pro převod tabulky krmné dávky štěňat do JSONu pro moji PWA aplikaci. Postupuj takto:

1. Nechám tě vložit zdrojovou tabulku (textem nebo jako přepsané hodnoty). Ověř, že obsahuje osu hmotnosti a osu věku a hodnoty krmné dávky.

2. Ptej se na DOPLŇUJÍCÍ PARAMETRY:

   - Název krmiva (name)
   - Jednotky os: hmotnost (kg|lb) a věk (days|weeks|months)
   - Jednotka hodnot: g/day | oz/day | cup/day
   - Pokud je jednotka hodnot cup/day: požádej o převod 1 cup = X g (cupGrams)
   - Orientace tabulky pro zobrazení:
     a) sloupce = hmotnost, řádky = věk (výchozí),
     b) sloupce = věk, řádky = hmotnost
   - Volitelně: zdroj (source), verze (version), datum (lastUpdated YYYY-MM-DD)

3. Výstup vytvoř v JSON formátu přesně takto (povolené jsou i prázdné hodnoty null):
   {
   "id": "<krátký slug bez mezer>",
   "name": "<název>",
   "species": ["puppy"],
   "axes": {
   "weight": { "unit": "kg|lb", "values": [čísla vzestupně] },
   "age": { "unit": "days|weeks|months", "values": [čísla vzestupně] }
   },
   "grid": {
   "valueUnit": "g/day|oz/day|cup/day",
   "cupGrams": <číslo nebo vynech, pokud není cup/day>,
   "values": [
   // matice [ageIndex][weightIndex], stejné uspořádání jako v tabulce (N/A → null)
   ]
   },
   "presentation": {
   "orientation": "cols-weight_rows-age" | "cols-age_rows-weight"
   },
   "source": "<text>",
   "version": "1.0.0",
   "lastUpdated": "YYYY-MM-DD"
   }

4. Před odesláním JSONU proveď kontrolu:
   - Osy jsou vzestupně a bez duplicit,
   - Rozměr matice odpovídá (počet řádků = počet hodnot věku, počet sloupců = počet hodnot hmotnosti),
   - Hodnoty jsou čísla > 0 nebo null.
     Výstup pošli jako čistý JSON bez komentářů a bez textu okolo.

AI prompt – English (i18n key: ai_import_prompt_en)

You are an assistant converting a puppy feeding table into JSON for my PWA. Follow this:

1. I will paste the source table (text or transcribed). Ensure it contains weight and age axes and feeding values.

2. ASK for REQUIRED PARAMETERS:

   - Feed name
   - Axis units: weight (kg|lb) and age (days|weeks|months)
   - Value unit: g/day | oz/day | cup/day
   - If cup/day: request conversion 1 cup = X g (cupGrams)
   - Display orientation:
     a) columns = weight, rows = age (default),
     b) columns = age, rows = weight
   - Optional: source, version, lastUpdated (YYYY-MM-DD)

3. Output the JSON EXACTLY in this shape (null allowed for missing cells):
   {
   "id": "<slug>",
   "name": "<name>",
   "species": ["puppy"],
   "axes": {
   "weight": { "unit": "kg|lb", "values": [ascending numbers] },
   "age": { "unit": "days|weeks|months", "values": [ascending numbers] }
   },
   "grid": {
   "valueUnit": "g/day|oz/day|cup/day",
   "cupGrams": <number or omit if not cup/day>,
   "values": [
   // matrix [ageIndex][weightIndex] following the table layout (N/A → null)
   ]
   },
   "presentation": {
   "orientation": "cols-weight_rows-age" | "cols-age_rows-weight"
   },
   "source": "<text>",
   "version": "1.0.0",
   "lastUpdated": "YYYY-MM-DD"
   }

4. Validate before sending:
   - Axes strictly ascending, no duplicates,
   - Matrix dimensions match (rows = age values count, columns = weight values count),
   - Values are numbers > 0 or null.
     Return ONLY raw JSON (no prose).

UI changes in Import wizard:

Add a “How to import” tab/section with the three options above and a “Copy prompt” button.

i18n keys to add:

import_howto_title, import_howto_ai_recommended, btn_copy_prompt,

import_excel_instructions, import_json_instructions,

table_orientation_weight_cols, table_orientation_age_cols,

plus ai_import_prompt_cs, ai_import_prompt_en.

5. i18n additions

Add keys for the new UI/UX:

Calculation page: auto_calc_hint, last_input_restored, btn_calculate, btn_highlight_in_table

Feed list: show_table, hide_table

Import: keys listed above

Errors/hints: hint_enter_weight, hint_enter_age, err_invalid_input

6. Tech notes (guidance)

Debounce: simple setTimeout/clearTimeout, 500 ms. Run immediate calc on blur or Enter.

When highlighting after auto-calc, reuse the same index resolution logic used by computeDaily (to decide 1/2/4 cells).

The table component accepts a presentation object and renders either normal layout or transposed, keeping data-age-index / data-weight-index mapped to the normalized indices for highlighting.

LocalStorage read/write should be resilient (try/catch JSON).

Definition of Done

Calculation page shows inputs and the table together; auto-calc with 500ms debounce works as specified.

Last inputs persist via fc_lastInput_v1 and restore on load; unit toggles keep values consistent.

Feed overview shows expandable table previews via <details>.

All tables render using the original units and orientation from presentation, while highlighting is still correct.

Import wizard includes How to import with a Copy prompt button and the two i18n prompt texts.

Existing contracts and golden tests A–E still pass; previously added MISSING_DATA behavior remains.
