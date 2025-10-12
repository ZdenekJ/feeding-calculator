// UI module for page rendering and interaction

import { t, getLang, setLang } from './i18n.js';
import { getFeeds, saveFeeds, deleteFeed, getSettings, saveSettings, getPuppyData, savePuppyData, exportAllData, importAllData } from './storage.js';
import { normalizeFeed, diffInDays, computeDaily } from './calculator.js';

let currentPage = 'calculation';
let selectedFeedIndex = 0;
let lastCalculationResult = null;
let debounceTimer = null;

/**
 * Initialize UI
 */
export function initUI() {
  // Load settings
  const settings = getSettings();
  setLang(settings.language);
  applyTheme(settings.theme);

  // Setup navigation
  setupNavigation();

  // Load initial page
  navigateTo(window.location.hash.slice(1) || 'calculation');

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    navigateTo(window.location.hash.slice(1) || 'calculation');
  });
}

/**
 * Setup navigation
 */
function setupNavigation() {
  const nav = document.querySelector('nav');
  nav.innerHTML = `
    <a href="#calculation" data-page="calculation">${t('calculation')}</a>
    <a href="#feeds" data-page="feeds">${t('feeds')}</a>
    <a href="#settings" data-page="settings">${t('settings')}</a>
  `;
}

/**
 * Navigate to page
 * @param {string} page - Page name
 */
function navigateTo(page) {
  currentPage = page;

  // Update active nav link
  document.querySelectorAll('nav a').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // Render page
  const content = document.getElementById('content');
  switch (page) {
    case 'calculation':
      renderCalculationPage(content);
      break;
    case 'feeds':
      renderFeedsPage(content);
      break;
    case 'settings':
      renderSettingsPage(content);
      break;
    default:
      navigateTo('calculation');
  }
}

/**
 * Get last input from localStorage
 */
function getLastInput() {
  try {
    const data = localStorage.getItem('fc_lastInput_v1');
    return data ? JSON.parse(data) : {
      weight: '',
      ageMode: 'auto',
      ageInput: { value: '', unit: 'days' },
      selectedFeedId: null
    };
  } catch (e) {
    return {
      weight: '',
      ageMode: 'auto',
      ageInput: { value: '', unit: 'days' },
      selectedFeedId: null
    };
  }
}

/**
 * Save last input to localStorage
 */
function saveLastInput(input) {
  try {
    localStorage.setItem('fc_lastInput_v1', JSON.stringify(input));
  } catch (e) {
    console.error('Failed to save last input:', e);
  }
}

/**
 * Collect current inputs for persistence
 */
function collectCurrentInputs() {
  const feeds = getFeeds();
  const puppyData = getPuppyData();
  const weightInput = document.getElementById('weight');
  const ageInput = document.getElementById('age');

  return {
    weight: weightInput?.value || '',
    ageMode: puppyData.autoAge ? 'auto' : 'manual',
    ageInput: {
      value: ageInput?.value || '',
      unit: 'days' // můžeme rozšířit o výběr jednotky později
    },
    selectedFeedId: feeds[selectedFeedIndex]?.id || null
  };
}

/**
 * Render calculation page
 */
function renderCalculationPage(container) {
  const feeds = getFeeds();
  const puppyData = getPuppyData();
  const settings = getSettings();
  const lastInput = getLastInput();

  // Restore last feed selection by ID
  if (lastInput.selectedFeedId) {
    const foundIndex = feeds.findIndex(f => f.id === lastInput.selectedFeedId);
    if (foundIndex >= 0) {
      selectedFeedIndex = foundIndex;
    }
  }

  container.innerHTML = `
    <div class="page-calculation">
      <h1>${t('calculation')}</h1>

      ${feeds.length === 0 ? `
        <div class="empty-state">
          <p>${t('no_feeds')}</p>
          <button id="btn-import-samples" class="btn btn-primary">${t('import_sample')}</button>
        </div>
      ` : `
        <div class="calc-layout">
          <div class="calc-inputs">
            <form id="calc-form">
              <div class="form-group">
                <label for="feed-select">${t('select_feed')}</label>
                <select id="feed-select" required>
                  ${feeds.map((feed, i) => `<option value="${i}" ${i === selectedFeedIndex ? 'selected' : ''}>${feed.name}</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label for="weight">${t('weight')} (${settings.unitSystem === 'metric' ? t('kg') : t('lb')})</label>
                <input type="number" id="weight" step="0.1" min="0" required placeholder="${t('enter_weight')}" value="${lastInput.weight || ''}">
                <small class="validation-hint" id="weight-hint" style="display:none"></small>
              </div>

              <div class="form-group">
                <label>
                  <input type="checkbox" id="auto-age" ${puppyData.autoAge ? 'checked' : ''}>
                  ${t('auto_age')}
                </label>
              </div>

              <div class="form-group" id="birth-date-group" style="${puppyData.autoAge ? '' : 'display:none'}">
                <label for="birth-date">${t('birth_date')}</label>
                <input type="date" id="birth-date" value="${puppyData.birthDate}">
                <small class="validation-hint" id="birth-date-hint" style="display:none"></small>
              </div>

              <div class="form-group" id="age-manual-group" style="${puppyData.autoAge ? 'display:none' : ''}">
                <label for="age">${t('age')} (${t('days')})</label>
                <input type="number" id="age" min="0" placeholder="${t('enter_age')}">
                <small class="validation-hint" id="age-hint" style="display:none"></small>
              </div>

              <button type="submit" class="btn btn-primary">${t('calculate')}</button>
            </form>

            <div id="result" style="display:none">
              <h2>${t('result')}</h2>
              <div class="result-card">
                <div class="result-item">
                  <span class="result-label">${t('grams_per_day')}:</span>
                  <span class="result-value" id="result-grams-day"></span>
                </div>
                <div class="result-item">
                  <span class="result-label">${t('portions_per_day')}:</span>
                  <span class="result-value" id="result-portions"></span>
                </div>
                <div class="result-item">
                  <span class="result-label">${t('grams_per_portion')}:</span>
                  <span class="result-value" id="result-grams-portion"></span>
                </div>
              </div>

              <details class="debug-info">
                <summary>${t('how_computed')}</summary>
                <div id="debug-content"></div>
              </details>
            </div>
          </div>

          <div class="calc-table">
            <h2>${t('table_tab')}</h2>
            <div id="feed-table-container"></div>
          </div>
        </div>
      `}
    </div>
    <div id="error-message" role="alert" aria-live="polite"></div>
  `;

  if (feeds.length === 0) {
    document.getElementById('btn-import-samples')?.addEventListener('click', importSampleFeeds);
  } else {
    setupCalculationForm();
    // Render table immediately
    renderFeedTable();
    // Trigger auto-calculation if we have saved weight
    if (lastInput.weight) {
      setTimeout(() => tryAutoCalculation(), 100);
    }
  }
}

/**
 * Try auto-calculation with validation
 */
function tryAutoCalculation() {
  const weightInput = document.getElementById('weight');
  const ageInput = document.getElementById('age');
  const birthDateInput = document.getElementById('birth-date');
  const puppyData = getPuppyData();

  // Clear previous hints
  const weightHint = document.getElementById('weight-hint');
  const ageHint = document.getElementById('age-hint');
  const birthDateHint = document.getElementById('birth-date-hint');

  if (weightHint) weightHint.style.display = 'none';
  if (ageHint) ageHint.style.display = 'none';
  if (birthDateHint) birthDateHint.style.display = 'none';

  // Check weight
  if (!weightInput || !weightInput.value) {
    if (weightHint) {
      weightHint.textContent = t('validation_weight_required');
      weightHint.style.display = 'block';
    }
    return;
  }

  // If auto age is on, check birth date
  if (puppyData.autoAge) {
    if (!puppyData.birthDate) {
      if (birthDateHint) {
        birthDateHint.textContent = t('validation_birthdate_required');
        birthDateHint.style.display = 'block';
      }
      return;
    }
    calculateFeeding(true);
    return;
  }

  // If manual age, check age input
  if (!ageInput || !ageInput.value) {
    if (ageHint) {
      ageHint.textContent = t('validation_age_required');
      ageHint.style.display = 'block';
    }
    return;
  }

  calculateFeeding(true);
}

/**
 * Debounced auto-calculation
 */
function scheduleAutoCalculation() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    tryAutoCalculation();
  }, 500);
}

/**
 * Setup calculation form handlers
 */
function setupCalculationForm() {
  const form = document.getElementById('calc-form');
  const autoAgeCheckbox = document.getElementById('auto-age');
  const birthDateGroup = document.getElementById('birth-date-group');
  const ageManualGroup = document.getElementById('age-manual-group');
  const feedSelect = document.getElementById('feed-select');
  const weightInput = document.getElementById('weight');
  const ageInput = document.getElementById('age');

  // Auto age toggle
  autoAgeCheckbox?.addEventListener('change', (e) => {
    const autoAge = e.target.checked;
    birthDateGroup.style.display = autoAge ? '' : 'none';
    ageManualGroup.style.display = autoAge ? 'none' : '';

    const puppyData = getPuppyData();
    puppyData.autoAge = autoAge;
    savePuppyData(puppyData);

    saveLastInput(collectCurrentInputs());
    scheduleAutoCalculation();
  });

  // Birth date change
  document.getElementById('birth-date')?.addEventListener('change', (e) => {
    const puppyData = getPuppyData();
    puppyData.birthDate = e.target.value;
    savePuppyData(puppyData);

    scheduleAutoCalculation();
  });

  // Feed selection
  feedSelect?.addEventListener('change', (e) => {
    selectedFeedIndex = parseInt(e.target.value);
    saveLastInput(collectCurrentInputs());
    renderFeedTable();
    scheduleAutoCalculation();
  });

  // Weight input
  weightInput?.addEventListener('input', (e) => {
    saveLastInput(collectCurrentInputs());
    scheduleAutoCalculation();
  });

  // Age input
  ageInput?.addEventListener('input', () => {
    saveLastInput(collectCurrentInputs());
    scheduleAutoCalculation();
  });

  // Form submit - immediate calculation, cancel debounce
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    calculateFeeding(false);
  });
}

/**
 * Calculate feeding amount
 * @param {boolean} isAuto - Whether this is an auto-calculation
 */
function calculateFeeding(isAuto = false) {
  const feeds = getFeeds();
  const settings = getSettings();
  const puppyData = getPuppyData();
  const errorMessageDiv = document.getElementById('error-message');

  const feed = feeds[selectedFeedIndex];
  if (!feed) return;

  try {
    // Get weight
    let weightKg = parseFloat(document.getElementById('weight').value);
    if (settings.unitSystem === 'imperial') {
      weightKg *= 0.45359237; // lb to kg
    }

    // Get age
    let ageDays;
    if (puppyData.autoAge && puppyData.birthDate) {
      ageDays = diffInDays(puppyData.birthDate);
    } else {
      ageDays = parseFloat(document.getElementById('age').value);
    }

    // Compute
    const result = computeDaily(feed, weightKg, ageDays, settings.roundingStep);
    lastCalculationResult = { ...result, feed, weightKg, ageDays };

    // Display result
    document.getElementById('result-grams-day').textContent = result.gramsPerDay + ' g';
    document.getElementById('result-portions').textContent = result.portions;
    document.getElementById('result-grams-portion').textContent = result.gramsPerPortion + ' g';

    // Display debug info
    const debugContent = document.getElementById('debug-content');
    debugContent.innerHTML = `
      <p><strong>${t('weight_bounds')}:</strong> ${result.debug.x0.toFixed(2)} - ${result.debug.x1.toFixed(2)} kg</p>
      <p><strong>${t('age_bounds')}:</strong> ${result.debug.y0.toFixed(0)} - ${result.debug.y1.toFixed(0)} ${t('days')}</p>
      <p><strong>${t('corner_values')}:</strong> Q11=${result.debug.Q11.toFixed(1)}, Q21=${result.debug.Q21.toFixed(1)}, Q12=${result.debug.Q12.toFixed(1)}, Q22=${result.debug.Q22.toFixed(1)}</p>
      <p><strong>${t('interpolation_params')}:</strong> t=${result.debug.t.toFixed(3)}, u=${result.debug.u.toFixed(3)}</p>
    `;

    document.getElementById('result').style.display = 'block';
    errorMessageDiv.textContent = '';
    errorMessageDiv.className = '';

    // Auto-highlight used cells in table
    highlightUsedCells(result.usedCells, isAuto);
  } catch (error) {
    let errorMsg = '';
    if (error.code === 'OUT_OF_RANGE') {
      errorMsg = t('err_out_of_range', error.meta);
    } else if (error.code === 'MISSING_DATA') {
      errorMsg = t('err_missing_data');
      // Highlight missing cells
      highlightMissingCells(error.meta.cells);
    } else {
      errorMsg = t('err_' + (error.code?.toLowerCase() || 'invalid_feed'));
    }
    errorMessageDiv.textContent = errorMsg;
    errorMessageDiv.className = 'error-message';
  }
}

/**
 * Format helper functions for table rendering
 */
function formatAge(val, unit) {
  if (unit === 'months') return val.toFixed(1) + ' ' + t('months');
  if (unit === 'weeks') return val.toFixed(1) + ' ' + t('weeks');
  return Math.round(val) + ' ' + t('days');
}

function formatWeight(val, unit) {
  if (unit === 'lb') return val.toFixed(1) + ' lb';
  return val.toFixed(1) + ' kg';
}

function formatValue(gPerDay, unit, cupGrams) {
  if (unit === 'oz/day') return (gPerDay / 28.3495).toFixed(1) + ' oz/day';
  if (unit === 'cup/day') return (gPerDay / (cupGrams || 100)).toFixed(2) + ' cup/day';
  return Math.round(gPerDay) + ' g/day';
}

/**
 * Render compact feed table for preview (without highlighting)
 * @param {Object} feed - Normalized feed with presentation metadata
 * @returns {string} HTML string
 */
function renderCompactFeedTable(feed) {
  const { axes, grid, presentation } = feed;
  const { values_kg } = axes.weight;
  const { values_days } = axes.age;
  const { values_g_per_day } = grid;

  const pres = presentation || {
    orientation: 'cols-weight_rows-age',
    weight: { unit: 'kg', values: values_kg, label: t('weight') },
    age: { unit: 'days', values: values_days, label: t('age') },
    valueUnit: 'g/day'
  };

  const isTransposed = pres.orientation === 'cols-age_rows-weight';

  let tableHTML = '<div class="feed-table-wrapper compact">';

  // Add axis labels
  if (!isTransposed) {
    tableHTML += `<div class="table-axis-labels">
      <span class="axis-label axis-label-x">${pres.weight.label || t('weight')}</span>
      <span class="axis-label axis-label-y">${pres.age.label || t('age')}</span>
    </div>`;
  } else {
    tableHTML += `<div class="table-axis-labels">
      <span class="axis-label axis-label-x">${pres.age.label || t('age')}</span>
      <span class="axis-label axis-label-y">${pres.weight.label || t('weight')}</span>
    </div>`;
  }

  tableHTML += '<table class="feed-table"><thead><tr><th></th>';

  if (!isTransposed) {
    // Normal: columns = weight, rows = age
    pres.weight.values.forEach(w => {
      tableHTML += `<th>${formatWeight(w, pres.weight.unit)}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    pres.age.values.forEach((ageVal, ageIdx) => {
      tableHTML += `<tr><th>${formatAge(ageVal, pres.age.unit)}</th>`;
      pres.weight.values.forEach((weightVal, weightIdx) => {
        const value = values_g_per_day[ageIdx][weightIdx];
        const displayValue = value === null ? '—' : Math.round(value);
        const cellClass = value === null ? 'cell cell--missing' : 'cell';
        tableHTML += `<td class="${cellClass}" data-age-index="${ageIdx}" data-weight-index="${weightIdx}">${displayValue}</td>`;
      });
      tableHTML += '</tr>';
    });
  } else {
    // Transposed: columns = age, rows = weight
    pres.age.values.forEach(a => {
      tableHTML += `<th>${formatAge(a, pres.age.unit)}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    pres.weight.values.forEach((weightVal, weightIdx) => {
      tableHTML += `<tr><th>${formatWeight(weightVal, pres.weight.unit)}</th>`;
      pres.age.values.forEach((ageVal, ageIdx) => {
        const value = values_g_per_day[ageIdx][weightIdx];
        const displayValue = value === null ? '—' : Math.round(value);
        const cellClass = value === null ? 'cell cell--missing' : 'cell';
        tableHTML += `<td class="${cellClass}" data-age-index="${ageIdx}" data-weight-index="${weightIdx}">${displayValue}</td>`;
      });
      tableHTML += '</tr>';
    });
  }

  tableHTML += '</tbody></table></div>';
  return tableHTML;
}

/**
 * Render feed table visualization using presentation metadata
 */
function renderFeedTable() {
  const feeds = getFeeds();
  const feed = feeds[selectedFeedIndex];
  if (!feed) return;

  const container = document.getElementById('feed-table-container');
  if (!container) return;

  const { axes, grid, presentation } = feed;
  const { values_kg } = axes.weight;
  const { values_days } = axes.age;
  const { values_g_per_day } = grid;

  // Use presentation units (original units from import)
  const pres = presentation || {
    orientation: 'cols-weight_rows-age',
    weight: { unit: 'kg', values: values_kg },
    age: { unit: 'days', values: values_days },
    valueUnit: 'g/day'
  };

  const isTransposed = pres.orientation === 'cols-age_rows-weight';

  // Format display values
  const formatWeight = (val, unit) => {
    if (unit === 'lb') return val.toFixed(1) + ' lb';
    return val.toFixed(1) + ' kg';
  };

  const formatAge = (val, unit) => {
    if (unit === 'months') return val.toFixed(1) + ' ' + t('months');
    if (unit === 'weeks') return val.toFixed(1) + ' ' + t('weeks');
    return Math.round(val) + ' ' + t('days');
  };

  let tableHTML = '';

  // Add axis labels
  if (!isTransposed) {
    tableHTML += `<div class="table-axis-labels">
      <span class="axis-label axis-label-x">${pres.weight.label || t('weight')}</span>
      <span class="axis-label axis-label-y">${pres.age.label || t('age')}</span>
    </div>`;
  } else {
    tableHTML += `<div class="table-axis-labels">
      <span class="axis-label axis-label-x">${pres.age.label || t('age')}</span>
      <span class="axis-label axis-label-y">${pres.weight.label || t('weight')}</span>
    </div>`;
  }

  tableHTML += '<table class="feed-table"><thead><tr><th></th>';

  if (!isTransposed) {
    // Normal: columns = weight, rows = age
    pres.weight.values.forEach(w => {
      tableHTML += `<th>${formatWeight(w, pres.weight.unit)}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    pres.age.values.forEach((ageVal, ageIdx) => {
      tableHTML += `<tr><th>${formatAge(ageVal, pres.age.unit)}</th>`;
      pres.weight.values.forEach((weightVal, weightIdx) => {
        const value = values_g_per_day[ageIdx][weightIdx];
        const cellClass = value === null ? 'cell cell--missing' : 'cell';
        const displayValue = value === null ? '—' : Math.round(value);
        tableHTML += `<td class="${cellClass}" data-age-index="${ageIdx}" data-weight-index="${weightIdx}" tabindex="0">${displayValue}</td>`;
      });
      tableHTML += '</tr>';
    });
  } else {
    // Transposed: columns = age, rows = weight
    pres.age.values.forEach(a => {
      tableHTML += `<th>${formatAge(a, pres.age.unit)}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    pres.weight.values.forEach((weightVal, weightIdx) => {
      tableHTML += `<tr><th>${formatWeight(weightVal, pres.weight.unit)}</th>`;
      pres.age.values.forEach((ageVal, ageIdx) => {
        const value = values_g_per_day[ageIdx][weightIdx];
        const cellClass = value === null ? 'cell cell--missing' : 'cell';
        const displayValue = value === null ? '—' : Math.round(value);
        tableHTML += `<td class="${cellClass}" data-age-index="${ageIdx}" data-weight-index="${weightIdx}" tabindex="0">${displayValue}</td>`;
      });
      tableHTML += '</tr>';
    });
  }

  tableHTML += '</tbody></table>';
  container.innerHTML = tableHTML;
}

/**
 * Highlight used cells in table
 * @param {Array} usedCells - Array of cells used in calculation
 * @param {boolean} preventScroll - If true, don't scroll to highlighted cell
 */
function highlightUsedCells(usedCells, preventScroll = false) {
  // Clear previous highlights
  document.querySelectorAll('.cell--used').forEach(cell => {
    cell.classList.remove('cell--used');
  });

  // Add highlights to used cells
  usedCells.forEach(({ ageIndex, weightIndex }) => {
    const cell = document.querySelector(
      `.cell[data-age-index="${ageIndex}"][data-weight-index="${weightIndex}"]`
    );
    if (cell) {
      cell.classList.add('cell--used');
    }
  });

  // Don't scroll or focus - prevents page jump on mobile
  // Highlighting is sufficient visual feedback
}

/**
 * Highlight missing cells in table
 */
function highlightMissingCells(missingCells) {
  // Clear previous highlights
  document.querySelectorAll('.cell--used').forEach(cell => {
    cell.classList.remove('cell--used');
  });

  // Add highlights to missing cells
  missingCells.forEach(({ ageIndex, weightIndex }) => {
    const cell = document.querySelector(
      `.cell[data-age-index="${ageIndex}"][data-weight-index="${weightIndex}"]`
    );
    if (cell) {
      cell.classList.add('cell--used');
    }
  });

  // Focus first missing cell
  if (missingCells.length > 0) {
    const firstCell = document.querySelector(
      `.cell[data-age-index="${missingCells[0].ageIndex}"][data-weight-index="${missingCells[0].weightIndex}"]`
    );
    if (firstCell) {
      firstCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstCell.focus();
    }
  }
}

/**
 * Import sample feeds
 */
async function importSampleFeeds() {
  try {
    const response = await fetch('/sample-feed-starvita.json');
    const feedData = await response.json();

    const normalized = normalizeFeed(feedData);

    const feeds = getFeeds();
    feeds.push(normalized);
    saveFeeds(feeds);

    navigateTo('calculation');
  } catch (error) {
    console.error('Failed to import sample feed:', error);
    alert('Failed to import sample feed');
  }
}

/**
 * Render feeds page
 */
function renderFeedsPage(container) {
  const feeds = getFeeds();

  container.innerHTML = `
    <div class="page-feeds">
      <h1>${t('feeds')}</h1>

      <button id="btn-import-feed" class="btn btn-primary">${t('import_feed')}</button>

      <details class="import-howto">
        <summary>${t('import_howto_title')}</summary>
        <div class="import-howto-content">
          <p>${t('import_howto_desc')}</p>

          <div class="ai-prompt-section">
            <h4>1. ${t('ai_prompt_title')}</h4>
            <p>${t('ai_prompt_desc')}</p>
            <button id="btn-copy-prompt" class="btn btn-secondary">${t('btn_copy_prompt')}</button>
          </div>

          <div class="import-method-section">
            <h4>2. ${t('paste_from_excel')}</h4>
            <p>${t('import_excel_instructions')}</p>
          </div>

          <div class="import-method-section">
            <h4>3. ${t('json_import_manual')}</h4>
            <p>${t('import_json_instructions')}</p>

            <details class="json-format-details">
              <summary>${t('json_format_docs')}</summary>
              <div class="json-docs-content">
                <p>${t('json_docs_intro')}</p>

                <h5>${t('json_docs_fields')}</h5>
                <ul>
                  <li><code>name</code>: ${t('json_field_name')}</li>
                  <li><code>axes.age.unit</code>: "days", "weeks", ${t('or')} "months"</li>
                  <li><code>axes.age.values</code>: ${t('json_field_age_values')}</li>
                  <li><code>axes.weight.unit</code>: "kg" ${t('or')} "lb"</li>
                  <li><code>axes.weight.values</code>: ${t('json_field_weight_values')}</li>
                  <li><code>grid.unit</code>: "g/day", "oz/day", ${t('or')} "cup/day"</li>
                  <li><code>grid.values</code>: ${t('json_field_grid_values')}</li>
                  <li><code>presentation.orientation</code>: "cols-weight_rows-age" ${t('or')} "cols-age_rows-weight"</li>
                  <li><code>cupGrams</code>: ${t('json_field_cupgrams')}</li>
                </ul>

                <h5>${t('json_docs_units')}</h5>
                <p>${t('json_docs_units_desc')}:</p>
                <ul>
                  <li>${t('weight')}: kg</li>
                  <li>${t('age')}: ${t('days')}</li>
                  <li>${t('value_unit')}: g/day</li>
                </ul>

                <h5>${t('json_docs_conversions')}</h5>
                <ul>
                  <li>1 month = 30.4375 ${t('days')}</li>
                  <li>1 week = 7 ${t('days')}</li>
                  <li>1 lb = 0.454 kg</li>
                  <li>1 oz = 28.35 g</li>
                  <li>1 cup = cupGrams (${t('json_field_cupgrams_note')})</li>
                </ul>

                <h5>${t('json_docs_example')}</h5>
                <pre><code>{
  "name": "Example Feed",
  "axes": {
    "age": { "unit": "months", "values": [2, 4, 6] },
    "weight": { "unit": "kg", "values": [5, 10, 15] }
  },
  "grid": {
    "unit": "g/day",
    "values": [
      [200, 300, 400],
      [220, 320, null],
      [210, 310, 410]
    ]
  },
  "presentation": {
    "orientation": "cols-weight_rows-age"
  }
}</code></pre>

                <p><strong>${t('json_docs_null_support')}:</strong> ${t('json_docs_null_desc')}</p>
              </div>
            </details>
          </div>
        </div>
      </details>

      <div class="feeds-list">
        ${feeds.map((feed, i) => `
          <div class="feed-card">
            <h3>${feed.name}</h3>
            <p>${t('age_range')}: ${feed.axes.age.values_days[0]} - ${feed.axes.age.values_days[feed.axes.age.values_days.length - 1]} ${t('days')}</p>
            <p>${t('weight_range')}: ${feed.axes.weight.values_kg[0].toFixed(1)} - ${feed.axes.weight.values_kg[feed.axes.weight.values_kg.length - 1].toFixed(1)} kg</p>
            <button class="btn btn-danger btn-delete-feed" data-index="${i}">${t('delete_feed')}</button>

            <details class="feed-preview">
              <summary>${t('show_table')}</summary>
              <div class="feed-preview-content" data-feed-index="${i}"></div>
            </details>
          </div>
        `).join('')}
      </div>

      <dialog id="import-dialog">
        <h2>${t('import_feed')}</h2>

        <div class="import-tabs">
          <button id="tab-json" class="tab-btn active">JSON</button>
          <button id="tab-paste" class="tab-btn">${t('paste_from_excel')}</button>
        </div>

        <div id="import-json-panel" class="import-panel">
          <textarea id="feed-json" placeholder="${t('paste_json')}" rows="10"></textarea>
          <input type="file" id="feed-file" accept=".json">
        </div>

        <div id="import-paste-panel" class="import-panel" style="display:none">
          <textarea id="paste-data" placeholder="${t('paste_data')}" rows="10"></textarea>

          <div class="paste-options">
            <div class="form-group">
              <label>
                <input type="checkbox" id="detect-headers" checked>
                ${t('detect_headers')}
              </label>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="first-row-headers">
                ${t('first_row_headers')}
              </label>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="first-col-headers">
                ${t('first_col_headers')}
              </label>
            </div>

            <div class="form-group">
              <label for="age-unit-paste">${t('age')} unit:</label>
              <select id="age-unit-paste">
                <option value="days">${t('days')}</option>
                <option value="weeks">${t('weeks')}</option>
                <option value="months">${t('months')}</option>
              </select>
            </div>

            <div class="form-group">
              <label for="weight-unit-paste">${t('weight')} unit:</label>
              <select id="weight-unit-paste">
                <option value="kg">${t('kg')}</option>
                <option value="lb">${t('lb')}</option>
              </select>
            </div>

            <div class="form-group">
              <label for="value-unit-paste">${t('value_unit')}:</label>
              <select id="value-unit-paste">
                <option value="g/day">g/day</option>
                <option value="oz/day">oz/day</option>
                <option value="cup/day">cup/day</option>
              </select>
            </div>

            <div class="form-group" id="cup-grams-group" style="display:none">
              <label for="cup-grams">Cup grams:</label>
              <input type="number" id="cup-grams" value="100" min="1">
            </div>

            <div class="form-group">
              <label for="feed-name-paste">${t('feed_name')}:</label>
              <input type="text" id="feed-name-paste" value="Imported Feed">
            </div>

            <div class="form-group">
              <label>${t('table_orientation')}:</label>
              <div class="radio-group">
                <label>
                  <input type="radio" name="orientation" value="cols-weight_rows-age" checked>
                  ${t('table_orientation_weight_cols')}
                </label>
                <label>
                  <input type="radio" name="orientation" value="cols-age_rows-weight">
                  ${t('table_orientation_age_cols')}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div id="feed-preview"></div>
        <div class="dialog-buttons">
          <button id="btn-preview" class="btn btn-secondary">${t('preview')}</button>
          <button id="btn-save-feed" class="btn btn-primary" disabled>${t('save_feed')}</button>
          <button id="btn-cancel" class="btn btn-secondary">${t('cancel')}</button>
        </div>
      </dialog>
    </div>
  `;

  // Import button
  document.getElementById('btn-import-feed')?.addEventListener('click', () => {
    document.getElementById('import-dialog').showModal();
  });

  // Copy AI prompt button
  document.getElementById('btn-copy-prompt')?.addEventListener('click', async () => {
    const lang = getLang();
    const prompt = lang === 'cs' ? t('ai_import_prompt_cs') : t('ai_import_prompt_en');

    try {
      await navigator.clipboard.writeText(prompt);
      const btn = document.getElementById('btn-copy-prompt');
      const originalText = btn.textContent;
      btn.textContent = t('copied');
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert(t('copy_failed'));
    }
  });

  // Delete buttons
  document.querySelectorAll('.btn-delete-feed').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      if (confirm(t('confirm_delete'))) {
        deleteFeed(index);
        renderFeedsPage(container);
      }
    });
  });

  // Feed preview expansion
  document.querySelectorAll('.feed-preview').forEach(details => {
    details.addEventListener('toggle', (e) => {
      if (e.target.open) {
        const contentDiv = e.target.querySelector('.feed-preview-content');
        const feedIndex = parseInt(contentDiv.dataset.feedIndex);
        const feed = feeds[feedIndex];
        if (feed) {
          contentDiv.innerHTML = renderCompactFeedTable(feed);
        }
      }
    });
  });

  setupImportDialog();
}

/**
 * Setup import dialog
 */
function setupImportDialog() {
  const dialog = document.getElementById('import-dialog');
  const jsonTextarea = document.getElementById('feed-json');
  const pasteTextarea = document.getElementById('paste-data');
  const fileInput = document.getElementById('feed-file');
  const previewDiv = document.getElementById('feed-preview');
  const btnPreview = document.getElementById('btn-preview');
  const btnSave = document.getElementById('btn-save-feed');
  const btnCancel = document.getElementById('btn-cancel');

  const tabJSON = document.getElementById('tab-json');
  const tabPaste = document.getElementById('tab-paste');
  const jsonPanel = document.getElementById('import-json-panel');
  const pastePanel = document.getElementById('import-paste-panel');

  let previewedFeed = null;

  // Tab switching
  tabJSON?.addEventListener('click', () => {
    tabJSON.classList.add('active');
    tabPaste.classList.remove('active');
    jsonPanel.style.display = 'block';
    pastePanel.style.display = 'none';
  });

  tabPaste?.addEventListener('click', () => {
    tabPaste.classList.add('active');
    tabJSON.classList.remove('active');
    pastePanel.style.display = 'block';
    jsonPanel.style.display = 'none';
  });

  // Value unit change - show/hide cup grams
  document.getElementById('value-unit-paste')?.addEventListener('change', (e) => {
    const cupGramsGroup = document.getElementById('cup-grams-group');
    cupGramsGroup.style.display = e.target.value === 'cup/day' ? 'block' : 'none';
  });

  // File input
  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const text = await file.text();
      jsonTextarea.value = text;
    }
  });

  // Preview
  btnPreview?.addEventListener('click', () => {
    try {
      if (tabJSON.classList.contains('active')) {
        // JSON import
        const json = JSON.parse(jsonTextarea.value);
        previewedFeed = normalizeFeed(json);
      } else {
        // Paste import
        previewedFeed = parsePastedData();
      }

      previewDiv.innerHTML = `
        <div class="feed-preview">
          <h3>${previewedFeed.name}</h3>
          <p>${t('age_range')}: ${previewedFeed.axes.age.values_days[0].toFixed(0)} - ${previewedFeed.axes.age.values_days[previewedFeed.axes.age.values_days.length - 1].toFixed(0)} ${t('days')}</p>
          <p>${t('weight_range')}: ${previewedFeed.axes.weight.values_kg[0].toFixed(1)} - ${previewedFeed.axes.weight.values_kg[previewedFeed.axes.weight.values_kg.length - 1].toFixed(1)} kg</p>
          <table class="preview-table">
            ${renderPreviewTable(previewedFeed)}
          </table>
        </div>
      `;
      btnSave.disabled = false;
    } catch (error) {
      previewDiv.innerHTML = `<p class="error">${error.message || t('err_invalid_feed')}</p>`;
      btnSave.disabled = true;
    }
  });

  // Save
  btnSave?.addEventListener('click', () => {
    if (previewedFeed) {
      const feeds = getFeeds();
      feeds.push(previewedFeed);
      saveFeeds(feeds);
      dialog.close();
      renderFeedsPage(document.getElementById('content'));
    }
  });

  // Cancel
  btnCancel?.addEventListener('click', () => {
    dialog.close();
  });
}

/**
 * Parse pasted TSV/CSV data
 */
function parsePastedData() {
  const pasteData = document.getElementById('paste-data').value;
  const detectHeaders = document.getElementById('detect-headers').checked;
  const firstRowHeaders = document.getElementById('first-row-headers').checked;
  const firstColHeaders = document.getElementById('first-col-headers').checked;
  const ageUnit = document.getElementById('age-unit-paste').value;
  const weightUnit = document.getElementById('weight-unit-paste').value;
  const valueUnit = document.getElementById('value-unit-paste').value;
  const cupGrams = parseFloat(document.getElementById('cup-grams').value) || 100;
  const feedName = document.getElementById('feed-name-paste').value;
  const orientation = document.querySelector('input[name="orientation"]:checked')?.value || 'cols-weight_rows-age';

  // Detect separator
  const lines = pasteData.trim().split('\n');
  let separator = '\t';
  if (lines[0].includes('\t')) {
    separator = '\t';
  } else if (lines[0].includes(';')) {
    separator = ';';
  } else if (lines[0].includes(',')) {
    separator = ',';
  }

  // Parse rows
  const rows = lines.map(line => line.split(separator).map(cell => cell.trim()));

  // Detect headers
  let hasRowHeaders = firstRowHeaders;
  let hasColHeaders = firstColHeaders;

  if (detectHeaders && rows[0][0] === '') {
    hasRowHeaders = true;
    hasColHeaders = true;
  }

  // Extract axes and values
  let ageValues = [];
  let weightValues = [];
  let gridValues = [];

  const startRow = hasRowHeaders ? 1 : 0;
  const startCol = hasColHeaders ? 1 : 0;

  // Extract weight axis
  if (hasRowHeaders) {
    weightValues = rows[0].slice(startCol).map(v => {
      const num = parseFloat(v);
      return isNaN(num) ? null : num;
    }).filter(v => v !== null);
  } else {
    // Generate weight axis
    const numCols = rows[0].length - (hasColHeaders ? 1 : 0);
    weightValues = Array.from({ length: numCols }, (_, i) => i + 1);
  }

  // Extract data
  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];

    // Extract age value
    if (hasColHeaders) {
      const ageVal = parseFloat(row[0]);
      if (!isNaN(ageVal)) {
        ageValues.push(ageVal);
      }
    } else {
      ageValues.push(i - startRow + 1);
    }

    // Extract grid values
    const gridRow = row.slice(startCol).map(v => {
      if (v === '' || v === '-' || v === '—') return null;
      const num = parseFloat(v);
      return isNaN(num) ? null : num;
    });
    gridValues.push(gridRow);
  }

  // Build feed object
  const feedObj = {
    name: feedName,
    axes: {
      age: { unit: ageUnit, values: ageValues },
      weight: { unit: weightUnit, values: weightValues }
    },
    grid: {
      unit: valueUnit,
      values: gridValues
    },
    presentation: {
      orientation: orientation
    }
  };

  if (valueUnit === 'cup/day') {
    feedObj.cupGrams = cupGrams;
  }

  // Normalize
  return normalizeFeed(feedObj);
}

/**
 * Render preview table
 */
function renderPreviewTable(feed) {
  const { axes, grid } = feed;
  const { values_kg } = axes.weight;
  const { values_days } = axes.age;
  const { values_g_per_day } = grid;

  let html = '<thead><tr><th></th>';
  values_kg.forEach(w => {
    html += `<th>${w.toFixed(1)} kg</th>`;
  });
  html += '</tr></thead><tbody>';

  values_days.forEach((age, ageIdx) => {
    html += `<tr><th>${Math.round(age)} days</th>`;
    values_kg.forEach((weight, weightIdx) => {
      const val = values_g_per_day[ageIdx][weightIdx];
      html += `<td>${val === null ? '—' : Math.round(val)}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody>';
  return html;
}

/**
 * Render settings page
 */
function renderSettingsPage(container) {
  const settings = getSettings();
  const puppyData = getPuppyData();

  container.innerHTML = `
    <div class="page-settings">
      <h1>${t('settings')}</h1>

      <form id="settings-form">
        <div class="form-group">
          <label for="theme">${t('theme')}</label>
          <select id="theme">
            <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>${t('light')}</option>
            <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>${t('dark')}</option>
            <option value="system" ${settings.theme === 'system' ? 'selected' : ''}>${t('system')}</option>
          </select>
        </div>

        <div class="form-group">
          <label for="language">${t('language')}</label>
          <select id="language">
            <option value="en" ${settings.language === 'en' ? 'selected' : ''}>English</option>
            <option value="cs" ${settings.language === 'cs' ? 'selected' : ''}>Čeština</option>
          </select>
        </div>

        <div class="form-group">
          <label for="unit-system">${t('unit_system')}</label>
          <select id="unit-system">
            <option value="metric" ${settings.unitSystem === 'metric' ? 'selected' : ''}>${t('metric')}</option>
            <option value="imperial" ${settings.unitSystem === 'imperial' ? 'selected' : ''}>${t('imperial')}</option>
          </select>
        </div>

        <div class="form-group">
          <label for="rounding-step">${t('rounding_step')}</label>
          <input type="number" id="rounding-step" min="1" value="${settings.roundingStep}">
        </div>

        <div class="form-group">
          <label for="birth-date-settings">${t('birth_date')}</label>
          <input type="date" id="birth-date-settings" value="${puppyData.birthDate}">
        </div>

        <button type="submit" class="btn btn-primary">Save</button>
      </form>

      <div class="data-management">
        <h2>Data Management</h2>
        <button id="btn-export" class="btn btn-secondary">${t('export_data')}</button>
        <button id="btn-import" class="btn btn-secondary">${t('import_data')}</button>
        <input type="file" id="import-file" accept=".json" style="display:none">
      </div>
    </div>
  `;

  // Settings form
  document.getElementById('settings-form')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const newSettings = {
      theme: document.getElementById('theme').value,
      language: document.getElementById('language').value,
      unitSystem: document.getElementById('unit-system').value,
      roundingStep: parseInt(document.getElementById('rounding-step').value)
    };

    saveSettings(newSettings);
    setLang(newSettings.language);
    applyTheme(newSettings.theme);

    const newPuppyData = {
      ...getPuppyData(),
      birthDate: document.getElementById('birth-date-settings').value
    };
    savePuppyData(newPuppyData);

    // Refresh UI
    setupNavigation();
    renderSettingsPage(container);
  });

  // Export
  document.getElementById('btn-export')?.addEventListener('click', () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'puppy-calc-data.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import
  document.getElementById('btn-import')?.addEventListener('click', () => {
    document.getElementById('import-file').click();
  });

  document.getElementById('import-file')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        importAllData(data);
        location.reload();
      } catch (error) {
        alert('Failed to import data');
      }
    }
  });
}

/**
 * Apply theme
 * @param {string} theme - Theme name (light, dark, system)
 */
function applyTheme(theme) {
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
