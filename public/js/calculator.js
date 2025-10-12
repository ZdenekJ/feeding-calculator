// Core calculation functions for puppy feeding calculator

/**
 * Normalize imported feed to canonical units (kg, days, g/day)
 * @param {Object} importedFeed - Raw imported feed data
 * @returns {Object} Normalized feed with canonical units
 * @throws {Object} Error with code and message
 */
export function normalizeFeed(importedFeed) {
  if (!importedFeed || typeof importedFeed !== 'object') {
    throw { code: 'INVALID_FEED', message: 'Invalid feed object' };
  }

  const { axes, grid } = importedFeed;

  if (!axes || !axes.weight || !axes.age || !grid) {
    throw { code: 'INVALID_FEED', message: 'Missing required feed structure' };
  }

  // Normalize weight axis to kg
  const weightValues = axes.weight.values || [];
  const weightUnit = axes.weight.unit || 'kg';
  let values_kg;

  if (weightUnit === 'kg') {
    values_kg = [...weightValues];
  } else if (weightUnit === 'lb') {
    values_kg = weightValues.map(v => v * 0.45359237);
  } else {
    throw { code: 'INVALID_AXIS_VALUES', message: `Unsupported weight unit: ${weightUnit}` };
  }

  // Validate weight axis
  if (values_kg.length === 0) {
    throw { code: 'INVALID_AXIS_VALUES', message: 'Weight axis is empty' };
  }
  for (let i = 1; i < values_kg.length; i++) {
    if (values_kg[i] <= values_kg[i - 1]) {
      throw { code: 'INVALID_AXIS_VALUES', message: 'Weight axis must be strictly ascending and unique' };
    }
  }

  // Normalize age axis to days
  const ageValues = axes.age.values || [];
  const ageUnit = axes.age.unit || 'days';
  let values_days;

  if (ageUnit === 'days') {
    values_days = [...ageValues];
  } else if (ageUnit === 'weeks') {
    values_days = ageValues.map(v => v * 7);
  } else if (ageUnit === 'months') {
    values_days = ageValues.map(v => v * 30.4375);
  } else {
    throw { code: 'INVALID_AXIS_VALUES', message: `Unsupported age unit: ${ageUnit}` };
  }

  // Validate age axis
  if (values_days.length === 0) {
    throw { code: 'INVALID_AXIS_VALUES', message: 'Age axis is empty' };
  }
  for (let i = 1; i < values_days.length; i++) {
    if (values_days[i] <= values_days[i - 1]) {
      throw { code: 'INVALID_AXIS_VALUES', message: 'Age axis must be strictly ascending and unique' };
    }
  }

  // Normalize grid values to g/day (null values are preserved)
  const valueUnit = grid.unit || 'g/day';
  const gridValues = grid.values || [];
  let values_g_per_day;

  if (valueUnit === 'g/day') {
    values_g_per_day = gridValues.map(row => row.map(v => v === null ? null : v));
  } else if (valueUnit === 'oz/day') {
    values_g_per_day = gridValues.map(row => row.map(v => v === null ? null : v * 28.349523125));
  } else if (valueUnit === 'cup/day') {
    const cupGrams = importedFeed.cupGrams;
    if (typeof cupGrams !== 'number' || cupGrams <= 0) {
      throw { code: 'MISSING_CUP_GRAMS', message: 'cupGrams must be provided for cup/day unit' };
    }
    values_g_per_day = gridValues.map(row => row.map(v => v === null ? null : v * cupGrams));
  } else {
    throw { code: 'UNSUPPORTED_VALUE_UNIT', message: `Unsupported value unit: ${valueUnit}` };
  }

  // Validate matrix dimensions
  if (values_g_per_day.length !== values_days.length) {
    throw {
      code: 'MATRIX_DIM_MISMATCH',
      message: `Matrix row count (${values_g_per_day.length}) does not match age axis length (${values_days.length})`
    };
  }
  for (let i = 0; i < values_g_per_day.length; i++) {
    if (values_g_per_day[i].length !== values_kg.length) {
      throw {
        code: 'MATRIX_DIM_MISMATCH',
        message: `Matrix row ${i} column count (${values_g_per_day[i].length}) does not match weight axis length (${values_kg.length})`
      };
    }
  }

  // Validate all non-null values are positive
  for (let i = 0; i < values_g_per_day.length; i++) {
    for (let j = 0; j < values_g_per_day[i].length; j++) {
      const val = values_g_per_day[i][j];
      if (val !== null && val <= 0) {
        throw {
          code: 'NON_POSITIVE_VALUES',
          message: `Non-positive value at age index ${i}, weight index ${j}: ${val}`
        };
      }
    }
  }

  return {
    name: importedFeed.name || 'Unnamed Feed',
    id: importedFeed.id || 'feed-' + Date.now(),
    axes: {
      weight: { values_kg },
      age: { values_days }
    },
    grid: {
      values_g_per_day
    },
    presentation: {
      orientation: importedFeed.presentation?.orientation || 'cols-weight_rows-age',
      age: {
        unit: ageUnit,
        values: [...ageValues],
        label: axes.age.label
      },
      weight: {
        unit: weightUnit,
        values: [...weightValues],
        label: axes.weight.label
      },
      valueUnit: valueUnit,
      cupGrams: importedFeed.cupGrams || null
    },
    source: importedFeed.source,
    version: importedFeed.version,
    lastUpdated: importedFeed.lastUpdated
  };
}

/**
 * Compute difference in days between birth date and now
 * @param {string} birthDateISO - Birth date in YYYY-MM-DD format
 * @param {Date} now - Current date (default: new Date())
 * @returns {number} Whole days difference
 */
export function diffInDays(birthDateISO, now = new Date()) {
  // Parse dates in Europe/Prague timezone to avoid TZ drift
  // Use local midnight for both dates
  const birth = new Date(birthDateISO + 'T00:00:00');
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = current - birth;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determine number of portions per day based on age
 * @param {number} ageDays - Age in days
 * @returns {number} Number of portions (4, 3, or 2)
 */
export function portionsPerDay(ageDays) {
  const ageMonths = ageDays / 30.4375;

  if (ageMonths < 4) {
    return 4;
  } else if (ageMonths < 6) {
    return 3;
  } else {
    return 2;
  }
}

/**
 * Round value to nearest step
 * @param {number} value - Value to round
 * @param {number} step - Rounding step
 * @returns {number} Rounded value
 */
function roundToStep(value, step) {
  return Math.round(value / step) * step;
}

/**
 * Compute daily food amount using bilinear interpolation
 * @param {Object} normalizedFeed - Normalized feed data
 * @param {number} weightKg - Puppy weight in kg
 * @param {number} ageDays - Puppy age in days
 * @param {number} roundingStep - Rounding step in grams (default: 5)
 * @returns {Object} Result with gramsPerDay, portions, gramsPerPortion, debug, usedCells
 * @throws {Object} OUT_OF_RANGE error if input is outside feed ranges
 * @throws {Object} MISSING_DATA error if required cells contain null
 */
export function computeDaily(normalizedFeed, weightKg, ageDays, roundingStep = 5) {
  const { axes, grid } = normalizedFeed;
  const { values_kg } = axes.weight;
  const { values_days } = axes.age;
  const { values_g_per_day } = grid;

  // Check if input is within range
  const ageMin = values_days[0];
  const ageMax = values_days[values_days.length - 1];
  const wMin = values_kg[0];
  const wMax = values_kg[values_kg.length - 1];

  if (ageDays < ageMin || ageDays > ageMax || weightKg < wMin || weightKg > wMax) {
    throw {
      code: 'OUT_OF_RANGE',
      message: `Input outside feed range`,
      meta: { ageMin, ageMax, wMin, wMax }
    };
  }

  // Find bounding indices for age (y-axis)
  let y0_idx = 0;
  let y1_idx = 0;
  for (let i = 0; i < values_days.length - 1; i++) {
    if (ageDays >= values_days[i] && ageDays <= values_days[i + 1]) {
      y0_idx = i;
      y1_idx = i + 1;
      break;
    }
  }
  // Edge case: exact match with last value
  if (ageDays === values_days[values_days.length - 1]) {
    y0_idx = values_days.length - 2;
    y1_idx = values_days.length - 1;
  }

  // Find bounding indices for weight (x-axis)
  let x0_idx = 0;
  let x1_idx = 0;
  for (let i = 0; i < values_kg.length - 1; i++) {
    if (weightKg >= values_kg[i] && weightKg <= values_kg[i + 1]) {
      x0_idx = i;
      x1_idx = i + 1;
      break;
    }
  }
  // Edge case: exact match with last value
  if (weightKg === values_kg[values_kg.length - 1]) {
    x0_idx = values_kg.length - 2;
    x1_idx = values_kg.length - 1;
  }

  const x0 = values_kg[x0_idx];
  const x1 = values_kg[x1_idx];
  const y0 = values_days[y0_idx];
  const y1 = values_days[y1_idx];

  // Compute interpolation parameters
  const t = x1 === x0 ? 0 : (weightKg - x0) / (x1 - x0);
  const u = y1 === y0 ? 0 : (ageDays - y0) / (y1 - y0);

  // Determine which cells are used
  const usedCells = [];
  const missingCells = [];

  // Check if exact match (t=0 or 1, u=0 or 1)
  const exactWeight = t === 0 || t === 1;
  const exactAge = u === 0 || u === 1;

  if (exactWeight && exactAge) {
    // Exact match - single cell
    const ageIdx = u === 0 ? y0_idx : y1_idx;
    const weightIdx = t === 0 ? x0_idx : x1_idx;
    usedCells.push({ ageIndex: ageIdx, weightIndex: weightIdx });

    const value = values_g_per_day[ageIdx][weightIdx];
    if (value === null) {
      missingCells.push({ ageIndex: ageIdx, weightIndex: weightIdx });
    }
  } else if (exactWeight) {
    // 1D interpolation on age axis (fixed weight)
    const weightIdx = t === 0 ? x0_idx : x1_idx;
    usedCells.push(
      { ageIndex: y0_idx, weightIndex: weightIdx },
      { ageIndex: y1_idx, weightIndex: weightIdx }
    );

    if (values_g_per_day[y0_idx][weightIdx] === null) {
      missingCells.push({ ageIndex: y0_idx, weightIndex: weightIdx });
    }
    if (values_g_per_day[y1_idx][weightIdx] === null) {
      missingCells.push({ ageIndex: y1_idx, weightIndex: weightIdx });
    }
  } else if (exactAge) {
    // 1D interpolation on weight axis (fixed age)
    const ageIdx = u === 0 ? y0_idx : y1_idx;
    usedCells.push(
      { ageIndex: ageIdx, weightIndex: x0_idx },
      { ageIndex: ageIdx, weightIndex: x1_idx }
    );

    if (values_g_per_day[ageIdx][x0_idx] === null) {
      missingCells.push({ ageIndex: ageIdx, weightIndex: x0_idx });
    }
    if (values_g_per_day[ageIdx][x1_idx] === null) {
      missingCells.push({ ageIndex: ageIdx, weightIndex: x1_idx });
    }
  } else {
    // 2D bilinear interpolation - all 4 corners
    usedCells.push(
      { ageIndex: y0_idx, weightIndex: x0_idx },
      { ageIndex: y0_idx, weightIndex: x1_idx },
      { ageIndex: y1_idx, weightIndex: x0_idx },
      { ageIndex: y1_idx, weightIndex: x1_idx }
    );

    // Check all 4 corners
    if (values_g_per_day[y0_idx][x0_idx] === null) {
      missingCells.push({ ageIndex: y0_idx, weightIndex: x0_idx });
    }
    if (values_g_per_day[y0_idx][x1_idx] === null) {
      missingCells.push({ ageIndex: y0_idx, weightIndex: x1_idx });
    }
    if (values_g_per_day[y1_idx][x0_idx] === null) {
      missingCells.push({ ageIndex: y1_idx, weightIndex: x0_idx });
    }
    if (values_g_per_day[y1_idx][x1_idx] === null) {
      missingCells.push({ ageIndex: y1_idx, weightIndex: x1_idx });
    }
  }

  // If any required cells are missing, throw MISSING_DATA error
  if (missingCells.length > 0) {
    throw {
      code: 'MISSING_DATA',
      message: 'Required data cells contain null values',
      meta: { cells: missingCells }
    };
  }

  // Get corner values (Q notation: Q[age_idx][weight_idx])
  const Q11 = values_g_per_day[y0_idx][x0_idx]; // bottom-left
  const Q21 = values_g_per_day[y0_idx][x1_idx]; // bottom-right
  const Q12 = values_g_per_day[y1_idx][x0_idx]; // top-left
  const Q22 = values_g_per_day[y1_idx][x1_idx]; // top-right

  // Bilinear interpolation
  const gramsPerDayRaw =
    Q11 * (1 - t) * (1 - u) +
    Q21 * t * (1 - u) +
    Q12 * (1 - t) * u +
    Q22 * t * u;

  const gramsPerDay = roundToStep(gramsPerDayRaw, roundingStep);
  const portions = portionsPerDay(ageDays);
  const gramsPerPortion = roundToStep(gramsPerDay / portions, roundingStep);

  return {
    gramsPerDay,
    portions,
    gramsPerPortion,
    debug: { x0, x1, y0, y1, Q11, Q21, Q12, Q22, t, u },
    usedCells
  };
}

// Expose functions globally for tests
if (typeof window !== 'undefined') {
  window.normalizeFeed = normalizeFeed;
  window.diffInDays = diffInDays;
  window.portionsPerDay = portionsPerDay;
  window.computeDaily = computeDaily;
}
