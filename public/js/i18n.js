// Internationalization module

const translations = {
  cs: {
    app_title: 'Krmná dávka pro štěňata',
    calculation: 'Výpočet',
    feeds: 'Krmiva',
    settings: 'Nastavení',
    weight: 'Váha',
    age: 'Věk',
    days: 'dní',
    weeks: 'týdnů',
    months: 'měsíců',
    birth_date: 'Datum narození',
    auto_age: 'Automatický věk',
    select_feed: 'Vyberte krmivo',
    calculate: 'Vypočítat',
    result: 'Výsledek',
    grams_per_day: 'Gramů denně',
    portions_per_day: 'Porcí denně',
    grams_per_portion: 'Gramů na porci',
    how_computed: 'Jak bylo vypočteno',
    no_feeds: 'Žádná krmiva k dispozici',
    import_sample: 'Importovat vzorová krmiva',
    import_feed: 'Importovat krmivo',
    paste_json: 'Vložte JSON nebo nahrajte soubor',
    preview: 'Náhled',
    save_feed: 'Uložit krmivo',
    delete_feed: 'Smazat krmivo',
    theme: 'Téma',
    light: 'Světlé',
    dark: 'Tmavé',
    system: 'Systém',
    language: 'Jazyk',
    unit_system: 'Jednotky',
    metric: 'Metrické',
    imperial: 'Imperiální',
    rounding_step: 'Krok zaokrouhlení (g)',
    export_data: 'Exportovat data',
    import_data: 'Importovat data',
    new_version_available: 'Je k dispozici nová verze aplikace',
    btn_update: 'Aktualizovat',
    btn_dismiss: 'Později',
    err_out_of_range: 'Vstup je mimo rozsah krmiva (věk: {ageMin}–{ageMax} dní, váha: {wMin}–{wMax} kg)',
    err_missing_data: 'Chybějící data v požadovaných buňkách tabulky',
    err_invalid_feed: 'Neplatné krmivo',
    err_invalid_axis_values: 'Neplatné hodnoty os',
    err_matrix_dim_mismatch: 'Neshoda rozměrů matice',
    err_unsupported_value_unit: 'Nepodporovaná jednotka hodnot',
    err_missing_cup_grams: 'Chybí cupGrams pro jednotku cup/day',
    err_non_positive_values: 'Hodnoty musí být kladné',
    feed_name: 'Název krmiva',
    age_range: 'Rozsah věku',
    weight_range: 'Rozsah váhy',
    enter_weight: 'Zadejte váhu',
    enter_age: 'Zadejte věk',
    validation_weight_required: 'Vyžaduje se váha',
    validation_age_required: 'Vyžaduje se věk',
    validation_birthdate_required: 'Vyžaduje se datum narození',
    or: 'nebo',
    kg: 'kg',
    lb: 'lb',
    upload_file: 'Nahrát soubor',
    interpolation_details: 'Podrobnosti interpolace',
    weight_bounds: 'Hranice váhy',
    age_bounds: 'Hranice věku',
    corner_values: 'Rohové hodnoty',
    interpolation_params: 'Parametry interpolace',
    cancel: 'Zrušit',
    confirm_delete: 'Opravdu chcete smazat toto krmivo?',
    sample_gday: 'Vzorové krmivo (g/den)',
    sample_cup: 'Vzorové krmivo (cup/den)',
    view_table: 'Zobrazit tabulku',
    highlight_in_table: 'Zvýraznit v tabulce',
    paste_from_excel: 'Vložit z Excelu/Sheets',
    paste_data: 'Vložte data',
    detect_headers: 'Automaticky detekovat hlavičky',
    first_row_headers: 'První řádek = váha',
    first_col_headers: 'První sloupec = věk',
    value_unit: 'Jednotka hodnot',
    json_import_manual: 'Ruční JSON import',
    json_format_docs: 'Zobrazit formát JSON',
    json_docs_title: 'Dokumentace formátu JSON',
    json_docs_intro: 'Krmiva lze importovat ve formátu JSON s následující strukturou:',
    json_docs_fields: 'Pole',
    json_docs_units: 'Kanonické jednotky',
    json_docs_units_desc: 'Všechna data jsou interně převedena na kanonické jednotky',
    json_docs_conversions: 'Převodní konstanty',
    json_docs_example: 'Příklad',
    json_docs_null_support: 'Podpora null hodnot',
    json_docs_null_desc: 'Matice hodnot může obsahovat null pro chybějící data. Pokud výpočet interpolace vyžaduje buňku s null, je vrácena chyba MISSING_DATA.',
    json_field_name: 'Název krmiva (text)',
    json_field_age_values: 'Pole hodnot věku (čísla)',
    json_field_weight_values: 'Pole hodnot váhy (čísla)',
    json_field_grid_values: '2D matice [věk][váha] hodnot (čísla nebo null)',
    json_field_cupgrams: 'Povinné pouze pokud grid.unit je "cup/day"',
    json_field_cupgrams_note: 'specifikováno v krmivě',
    table_tab: 'Tabulka',
    auto_calc_hint: 'Automatický výpočet po 500ms',
    last_input_restored: 'Poslední vstupy obnoveny',
    btn_calculate: 'Vypočítat',
    btn_highlight_in_table: 'Zvýraznit v tabulce',
    show_table: 'Zobrazit tabulku',
    hide_table: 'Skrýt tabulku',
    hint_enter_weight: 'Zadejte váhu',
    hint_enter_age: 'Zadejte věk',
    err_invalid_input: 'Neplatný vstup',
    import_howto_title: 'Jak importovat krmivo',
    import_howto_desc: 'Existují tři způsoby, jak importovat krmnou tabulku do aplikace:',
    ai_prompt_title: 'AI asistent (doporučeno)',
    ai_prompt_desc: 'Zkopírujte tento prompt do ChatGPT, Claude nebo jiného AI asistenta a postupujte podle pokynů. AI vám pomůže převést tabulku do správného JSON formátu.',
    import_howto_ai_recommended: 'Nejjednodušší (doporučeno) – Použijte AI asistenta',
    btn_copy_prompt: 'Kopírovat prompt',
    import_excel_instructions: 'Zkopírujte tabulku včetně hlaviček → vložte do pole → nastavte jednotky a orientaci → náhled → uložit',
    import_json_instructions: 'Vložte JSON podle schématu (viz dokumentace formátu JSON)',
    table_orientation: 'Orientace tabulky',
    table_orientation_weight_cols: 'Sloupce = váha, řádky = věk',
    table_orientation_age_cols: 'Sloupce = věk, řádky = váha',
    prompt_copied: 'Prompt zkopírován do schránky',
    copied: 'Zkopírováno!',
    copy_failed: 'Kopírování selhalo',
    ai_import_prompt_cs: `Jsi asistent pro převod tabulky krmné dávky štěňat do JSONu pro moji PWA aplikaci. Postupuj takto:

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

Výstup pošli jako čistý JSON bez komentářů a bez textu okolo.`
  },
  en: {
    app_title: 'Puppy Feeding Calculator',
    calculation: 'Calculation',
    feeds: 'Feeds',
    settings: 'Settings',
    weight: 'Weight',
    age: 'Age',
    days: 'days',
    weeks: 'weeks',
    months: 'months',
    birth_date: 'Birth Date',
    auto_age: 'Auto Age',
    select_feed: 'Select Feed',
    calculate: 'Calculate',
    result: 'Result',
    grams_per_day: 'Grams per Day',
    portions_per_day: 'Portions per Day',
    grams_per_portion: 'Grams per Portion',
    how_computed: 'How It Was Computed',
    no_feeds: 'No feeds available',
    import_sample: 'Import Sample Feeds',
    import_feed: 'Import Feed',
    paste_json: 'Paste JSON or upload file',
    preview: 'Preview',
    save_feed: 'Save Feed',
    delete_feed: 'Delete Feed',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    unit_system: 'Unit System',
    metric: 'Metric',
    imperial: 'Imperial',
    rounding_step: 'Rounding Step (g)',
    export_data: 'Export Data',
    import_data: 'Import Data',
    new_version_available: 'A new version is available',
    btn_update: 'Update',
    btn_dismiss: 'Later',
    err_out_of_range: 'Input outside feed range (age: {ageMin}–{ageMax} days, weight: {wMin}–{wMax} kg)',
    err_missing_data: 'Missing data in required table cells',
    err_invalid_feed: 'Invalid feed',
    err_invalid_axis_values: 'Invalid axis values',
    err_matrix_dim_mismatch: 'Matrix dimension mismatch',
    err_unsupported_value_unit: 'Unsupported value unit',
    err_missing_cup_grams: 'Missing cupGrams for cup/day unit',
    err_non_positive_values: 'Values must be positive',
    feed_name: 'Feed Name',
    age_range: 'Age Range',
    weight_range: 'Weight Range',
    enter_weight: 'Enter weight',
    enter_age: 'Enter age',
    validation_weight_required: 'Weight is required',
    validation_age_required: 'Age is required',
    validation_birthdate_required: 'Birth date is required',
    or: 'or',
    kg: 'kg',
    lb: 'lb',
    upload_file: 'Upload File',
    interpolation_details: 'Interpolation Details',
    weight_bounds: 'Weight Bounds',
    age_bounds: 'Age Bounds',
    corner_values: 'Corner Values',
    interpolation_params: 'Interpolation Parameters',
    cancel: 'Cancel',
    confirm_delete: 'Are you sure you want to delete this feed?',
    sample_gday: 'Sample Feed (g/day)',
    sample_cup: 'Sample Feed (cup/day)',
    view_table: 'View Table',
    highlight_in_table: 'Highlight in Table',
    paste_from_excel: 'Paste from Excel/Sheets',
    paste_data: 'Paste data',
    detect_headers: 'Auto-detect headers',
    first_row_headers: 'First row = weight',
    first_col_headers: 'First column = age',
    value_unit: 'Value unit',
    json_import_manual: 'Manual JSON Import',
    json_format_docs: 'Show JSON Format',
    json_docs_title: 'JSON Format Documentation',
    json_docs_intro: 'Feeds can be imported in JSON format with the following structure:',
    json_docs_fields: 'Fields',
    json_docs_units: 'Canonical Units',
    json_docs_units_desc: 'All data is internally converted to canonical units',
    json_docs_conversions: 'Conversion Constants',
    json_docs_example: 'Example',
    json_docs_null_support: 'Null Value Support',
    json_docs_null_desc: 'The values matrix can contain null for missing data. If interpolation calculation requires a cell with null, MISSING_DATA error is returned.',
    json_field_name: 'Feed name (string)',
    json_field_age_values: 'Array of age values (numbers)',
    json_field_weight_values: 'Array of weight values (numbers)',
    json_field_grid_values: '2D matrix [age][weight] of values (numbers or null)',
    json_field_cupgrams: 'Required only if grid.unit is "cup/day"',
    json_field_cupgrams_note: 'specified in feed',
    table_tab: 'Table',
    auto_calc_hint: 'Auto-calculation after 500ms',
    last_input_restored: 'Last inputs restored',
    btn_calculate: 'Calculate',
    btn_highlight_in_table: 'Highlight in Table',
    show_table: 'Show Table',
    hide_table: 'Hide Table',
    hint_enter_weight: 'Enter weight',
    hint_enter_age: 'Enter age',
    err_invalid_input: 'Invalid input',
    import_howto_title: 'How to Import a Feed',
    import_howto_desc: 'There are three ways to import a feeding table into the application:',
    ai_prompt_title: 'AI Assistant (Recommended)',
    ai_prompt_desc: 'Copy this prompt into ChatGPT, Claude, or another AI assistant and follow the instructions. The AI will help you convert the table into the correct JSON format.',
    import_howto_ai_recommended: 'Easiest (Recommended) – Use Your AI Assistant',
    btn_copy_prompt: 'Copy Prompt',
    import_excel_instructions: 'Copy the grid including headers → paste into textarea → set units & orientation → preview → save',
    import_json_instructions: 'Paste JSON according to schema (see JSON Format documentation)',
    table_orientation: 'Table Orientation',
    table_orientation_weight_cols: 'Columns = weight, rows = age',
    table_orientation_age_cols: 'Columns = age, rows = weight',
    prompt_copied: 'Prompt copied to clipboard',
    copied: 'Copied!',
    copy_failed: 'Copy failed',
    ai_import_prompt_en: `You are an assistant converting a puppy feeding table into JSON for my PWA. Follow this:

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

Return ONLY raw JSON (no prose).`
  }
};

let currentLang = 'en';

/**
 * Translate a key with optional parameter substitution
 * @param {string} key - Translation key
 * @param {Object} params - Optional parameters for substitution
 * @returns {string} Translated string
 */
export function t(key, params = {}) {
  let text = translations[currentLang]?.[key] || translations['en']?.[key] || key;

  // Replace parameters
  Object.keys(params).forEach(param => {
    text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
  });

  return text;
}

/**
 * Set current language
 * @param {string} lang - Language code ('cs' or 'en')
 */
export function setLang(lang) {
  if (translations[lang]) {
    currentLang = lang;
    document.documentElement.lang = lang;
  }
}

/**
 * Get current language
 * @returns {string} Current language code
 */
export function getLang() {
  return currentLang;
}

// Expose functions globally for tests
if (typeof window !== 'undefined') {
  window.t = t;
  window.setLang = setLang;
}
