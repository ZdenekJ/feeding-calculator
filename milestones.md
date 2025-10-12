Strukturovaný plán kroků (CZ)
Milník 0 – Základ projektu (scaffold)

Cíl: Jednoduchá struktura bez buildu, vše ve public/, spustitelné staticky.

Vytvoř adresáře/soubory:Strukturovaný plán kroků (CZ)
Milník 0 – Základ projektu (scaffold)

Cíl: Jednoduchá struktura bez buildu, vše ve public/, spustitelné staticky.

Vytvoř adresáře/soubory:

/public
  index.html
  styles.css
  manifest.webmanifest
  sw.js
  version.json
  /js
    main.js
    pwa.js
    i18n.js
    storage.js
    feeds.js
    calculator.js
    settings.js
    ui.js
  /img
    icons-192.png
    icons-512.png
  tests.js            (golden testy – už máme)
  sample-feed-gday.json
  sample-feed-cup.json


DoD: Stránka se načte, bez chyb v konzoli, /version.json dostupné, ?tests=1 korektně natahuje testy (i když nutně zatím padají).

Milník 1 – Lokalizace (i18n)

Cíl: Minimální i18n slovník + API t(key, params), setLang(lang).

i18n.js: implementuj slovník cs/en včetně povinných klíčů:

app_title, new_version_available, btn_update, btn_dismiss, err_out_of_range

Propoj s UI (data atributy / jednoduchý render).

DoD: Přepnutí jazyka v nastavení okamžitě změní texty v UI.

Milník 2 – Nastavení (Settings)

Cíl: Ukládání uživatelských voleb do LocalStorage (fc_settings_v1).

Položky: theme (light/dark/system), lang, unitSystem (metric/imperial), puppy.birthDate, puppy.autoAge, roundingGrams (default 5), extrapolation: forbid (fixní).

UI: stránka „Nastavení“ s validací data narození.

Téma přepínat přes data-theme na <html>.

DoD: Uložení a opětovné načtení nastavení funguje, přepnutí tématu a jazyka se projeví, věk z DoB se dopočítává.

Milník 3 – Úložiště dat & Zálohy

Cíl: storage.js s rozhraním:

loadSettings()/saveSettings()

loadFeeds()/saveFeeds()

exportAll()/importAll(text)

DoD: Export/Import kompletní zálohy (JSON) funguje; test: export→smazat LS→import→data zpět.

Milník 4 – Import krmiva & Normalizace

Cíl: Nahrání JSONu krmiva, validace a normalizace na interní jednotky.

normalizeFeed(importedFeed) -> normalizedFeed (musí splnit kontrakt a házet kódy chyb):

Osy: seřazené vzestupně, bez duplicit, age → dny (měsíce = 30.4375), weight → kg.

Hodnoty: do g/den (oz/day → × 28.349523125; cup/day → × cupGrams).

Matici validuj na rozměr age × weight, hodnoty > 0.

UI: import (paste/upload), suchý běh s náhledem mřížky + ukázkový výpočet → až pak uložit.

DoD: Import obou ukázkových souborů (sample-feed-gday.json, sample-feed-cup.json) projde validací a uloží se.

Milník 5 – Výpočet & Pravidla porcí

Cíl: Implementace výpočtu a pravidel porcí.

diffInDays(birthDateISO, now?) – lokální půlnoc, Evropa/Prague.

portionsPerDay(ageDays) – <4m: 4; 4–<6m: 3; ≥6m: 2.

computeDaily(normalizedFeed, weightKg, ageDays, roundingStep):

Bilineární interpolace z 4 sousedních bodů.

Extrapolace zakázaná → throw { code: 'OUT_OF_RANGE', meta: {…} }.

Zaokrouhlení na roundingStep (g).

Vrací také debug (rohy a váhy t,u).

DoD: Funkce jsou globálně dostupné (např. na window) a golden testy A–E procházejí přes ?tests=1.

Milník 6 – Hlavní UI flow

Cíl: Stránky: Výpočet / Krmiva / Nastavení (jednoduché SPA přes hash nebo vlastní mini-router).

Výpočet: váha (kg/lb), věk (auto z DoB s možností ručního přepsání), výběr krmiva.

Výsledek: g/den, porce/den, g/porci + „Jak jsme počítali“ (debug).

Chyby: mimo rozsah → i18n hláška s přesnými rozsahy.

UX: uložit poslední vstupy; prázdný stav → CTA na import ukázky.

DoD: Ruční sanity (včetně interpolace), správné jednotky, přístupnost formulářů (klávesnice, labely).

Milník 7 – PWA (offline)

Cíl: Service Worker (app-shell cache-first), manifest, ikony, instalace.

sw.js: cache ASSETS, install/activate/fetch, žádné skipWaiting bez souhlasu.

manifest.webmanifest: názvy, barvy, ikony, display: standalone.

DoD: Appka se dá nainstalovat, funguje offline po prvním načtení.

Milník 8 – Aktualizace s potvrzením

Cíl: Upozornit na novou verzi a aktualizovat až po souhlasu.

pwa.js: registrace SW, updatefound → toast „nová verze“, tlačítko „Aktualizovat“ → postMessage('SKIP_WAITING'), controllerchange → location.reload().

Periodická kontrola /version.json s cache: 'no-store' (např. 1× za hodinu) + reg.update().

DoD: Nový build → objeví se toast; po potvrzení se appka sama obnoví.

Milník 9 – Přístupnost & Lokalizace (QA)

Cíl: WCAG basics + plné pokrytí i18n.

Klávesnice, správné role/ARIA, kontrasty (AA), čitelné stavy chyb.

Projdi UI v cs i en, žádné „tvrdé“ řetězce.

DoD: Manuální checklist OK; žádné i18n „missing key“.

Milník 10 – Dokumentace

Cíl: Stručný README.md.

Co appka dělá, jak spustit lokálně (libovolný static server), jak spustit testy (?tests=1), jak importovat ukázku, jak funguje update, jak exportovat zálohu.

DoD: README vysvětlí vše potřebné pro třetí stranu za 2–3 minuty čtení.