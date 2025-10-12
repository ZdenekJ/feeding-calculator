// Golden tests for puppy feeding calculator
// Run with ?tests=1 in URL

console.log('Starting golden tests...');

const tests = [];
let passedTests = 0;
let failedTests = 0;

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passedTests++;
    console.log(`✓ ${message}`);
    tests.push({ name: message, passed: true });
  } else {
    failedTests++;
    console.error(`✗ ${message}`);
    console.error(`  Expected:`, expected);
    console.error(`  Actual:`, actual);
    tests.push({ name: message, passed: false, expected, actual });
  }
}

function assertThrows(fn, errorCode, message) {
  try {
    fn();
    failedTests++;
    console.error(`✗ ${message} - no error thrown`);
    tests.push({ name: message, passed: false, error: 'No error thrown' });
  } catch (error) {
    if (error.code === errorCode) {
      passedTests++;
      console.log(`✓ ${message}`);
      tests.push({ name: message, passed: true });
    } else {
      failedTests++;
      console.error(`✗ ${message} - wrong error code`);
      console.error(`  Expected code: ${errorCode}`);
      console.error(`  Actual code: ${error.code}`);
      tests.push({ name: message, passed: false, expectedCode: errorCode, actualCode: error.code });
    }
  }
}

function runTests() {
  // Wait for global functions to be available
  if (!window.normalizeFeed || !window.diffInDays || !window.portionsPerDay || !window.computeDaily) {
    console.error('Global functions not found. Make sure calculator.js exposes them.');
    return;
  }

  console.log('\n=== Test A: Unit Normalization ===');

  // Test A1: kg/days/g/day → no conversion
  const feedA1 = {
    name: 'Test Feed A1',
    axes: {
      weight: { unit: 'kg', values: [1, 2] },
      age: { unit: 'days', values: [30, 60] }
    },
    grid: {
      unit: 'g/day',
      values: [[100, 150], [120, 180]]
    }
  };
  const normalizedA1 = window.normalizeFeed(feedA1);
  assertEqual(normalizedA1.axes.weight.values_kg, [1, 2], 'A1: kg unchanged');
  assertEqual(normalizedA1.axes.age.values_days, [30, 60], 'A1: days unchanged');
  assertEqual(normalizedA1.grid.values_g_per_day, [[100, 150], [120, 180]], 'A1: g/day unchanged');

  // Test A2: lb → kg
  const feedA2 = {
    name: 'Test Feed A2',
    axes: {
      weight: { unit: 'lb', values: [2.20462, 4.40924] },
      age: { unit: 'days', values: [30, 60] }
    },
    grid: {
      unit: 'g/day',
      values: [[100, 150], [120, 180]]
    }
  };
  const normalizedA2 = window.normalizeFeed(feedA2);
  const expectedWeightKg = [2.20462 * 0.45359237, 4.40924 * 0.45359237];
  assertEqual(
    normalizedA2.axes.weight.values_kg.map(v => v.toFixed(3)),
    expectedWeightKg.map(v => v.toFixed(3)),
    'A2: lb to kg conversion'
  );

  // Test A3: weeks → days
  const feedA3 = {
    name: 'Test Feed A3',
    axes: {
      weight: { unit: 'kg', values: [1, 2] },
      age: { unit: 'weeks', values: [4, 8] }
    },
    grid: {
      unit: 'g/day',
      values: [[100, 150], [120, 180]]
    }
  };
  const normalizedA3 = window.normalizeFeed(feedA3);
  assertEqual(normalizedA3.axes.age.values_days, [28, 56], 'A3: weeks to days');

  // Test A4: months → days
  const feedA4 = {
    name: 'Test Feed A4',
    axes: {
      weight: { unit: 'kg', values: [1, 2] },
      age: { unit: 'months', values: [2, 4] }
    },
    grid: {
      unit: 'g/day',
      values: [[100, 150], [120, 180]]
    }
  };
  const normalizedA4 = window.normalizeFeed(feedA4);
  assertEqual(normalizedA4.axes.age.values_days, [60.875, 121.75], 'A4: months to days');

  // Test A5: oz/day → g/day
  const feedA5 = {
    name: 'Test Feed A5',
    axes: {
      weight: { unit: 'kg', values: [1, 2] },
      age: { unit: 'days', values: [30, 60] }
    },
    grid: {
      unit: 'oz/day',
      values: [[1, 2], [1.5, 2.5]]
    }
  };
  const normalizedA5 = window.normalizeFeed(feedA5);
  const expectedOz = [[1 * 28.349523125, 2 * 28.349523125], [1.5 * 28.349523125, 2.5 * 28.349523125]];
  assertEqual(
    normalizedA5.grid.values_g_per_day.map(row => row.map(v => v.toFixed(3))),
    expectedOz.map(row => row.map(v => v.toFixed(3))),
    'A5: oz/day to g/day'
  );

  // Test A6: cup/day → g/day
  const feedA6 = {
    name: 'Test Feed A6',
    cupGrams: 100,
    axes: {
      weight: { unit: 'kg', values: [1, 2] },
      age: { unit: 'days', values: [30, 60] }
    },
    grid: {
      unit: 'cup/day',
      values: [[1, 2], [1.5, 2.5]]
    }
  };
  const normalizedA6 = window.normalizeFeed(feedA6);
  assertEqual(normalizedA6.grid.values_g_per_day, [[100, 200], [150, 250]], 'A6: cup/day to g/day');

  console.log('\n=== Test B: Bilinear Interpolation ===');

  // Test B: Center point interpolation
  const feedB = {
    name: 'Test Feed B',
    axes: {
      weight: { unit: 'kg', values: [5, 10] },
      age: { unit: 'days', values: [60, 120] }
    },
    grid: {
      unit: 'g/day',
      values: [[200, 300], [200, 300]]
    }
  };
  const normalizedB = window.normalizeFeed(feedB);
  const resultB = window.computeDaily(normalizedB, 7.5, 90, 5);
  assertEqual(resultB.gramsPerDay, 250, 'B: Center interpolation = 250 g/day');

  console.log('\n=== Test C: OUT_OF_RANGE Error ===');

  // Test C: Out of range error
  const feedC = {
    name: 'Test Feed C',
    axes: {
      weight: { unit: 'kg', values: [5, 10] },
      age: { unit: 'days', values: [60, 120] }
    },
    grid: {
      unit: 'g/day',
      values: [[200, 300], [200, 300]]
    }
  };
  const normalizedC = window.normalizeFeed(feedC);

  assertThrows(
    () => window.computeDaily(normalizedC, 15, 90, 5),
    'OUT_OF_RANGE',
    'C1: Weight too high throws OUT_OF_RANGE'
  );

  assertThrows(
    () => window.computeDaily(normalizedC, 7.5, 150, 5),
    'OUT_OF_RANGE',
    'C2: Age too high throws OUT_OF_RANGE'
  );

  // Test OUT_OF_RANGE meta
  try {
    window.computeDaily(normalizedC, 15, 90, 5);
  } catch (error) {
    if (error.meta) {
      assertEqual(error.meta.wMin, 5, 'C3: OUT_OF_RANGE meta.wMin');
      assertEqual(error.meta.wMax, 10, 'C4: OUT_OF_RANGE meta.wMax');
      assertEqual(error.meta.ageMin, 60, 'C5: OUT_OF_RANGE meta.ageMin');
      assertEqual(error.meta.ageMax, 120, 'C6: OUT_OF_RANGE meta.ageMax');
    }
  }

  console.log('\n=== Test D: Portions by Age ===');

  assertEqual(window.portionsPerDay(30), 4, 'D1: 30 days (< 4 months) → 4 portions');
  assertEqual(window.portionsPerDay(121), 4, 'D2: 121 days (< 4 months) → 4 portions');
  assertEqual(window.portionsPerDay(121.75), 4, 'D3: 4 months exactly → 4 portions');
  assertEqual(window.portionsPerDay(122), 3, 'D4: 122 days (>= 4 and < 6 months) → 3 portions');
  assertEqual(window.portionsPerDay(152.2), 3, 'D5: 5 months → 3 portions');
  assertEqual(window.portionsPerDay(182.625), 3, 'D6: 6 months exactly → 3 portions');
  assertEqual(window.portionsPerDay(183), 2, 'D7: 183 days (>= 6 months) → 2 portions');
  assertEqual(window.portionsPerDay(365), 2, 'D8: 365 days (>= 6 months) → 2 portions');

  console.log('\n=== Test E: Rounding ===');

  const feedE = {
    name: 'Test Feed E',
    axes: {
      weight: { unit: 'kg', values: [5, 10] },
      age: { unit: 'days', values: [60, 120] }
    },
    grid: {
      unit: 'g/day',
      values: [[203, 307], [203, 307]]
    }
  };
  const normalizedE = window.normalizeFeed(feedE);

  // Rounding step 5
  const resultE1 = window.computeDaily(normalizedE, 7.5, 90, 5);
  assertEqual(resultE1.gramsPerDay, 255, 'E1: 255 rounded to step 5 = 255');

  // Rounding step 10
  const resultE2 = window.computeDaily(normalizedE, 7.5, 90, 10);
  assertEqual(resultE2.gramsPerDay, 260, 'E2: 255 rounded to step 10 = 260');

  // Rounding step 1
  const resultE3 = window.computeDaily(normalizedE, 7.5, 90, 1);
  assertEqual(resultE3.gramsPerDay, 255, 'E3: 255 rounded to step 1 = 255');

  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Total tests: ${passedTests + failedTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);

  if (failedTests === 0) {
    console.log('\n🎉 All golden tests passed!');
  } else {
    console.error('\n❌ Some tests failed. See details above.');
  }

  // Display results in UI
  displayTestResults();
}

function displayTestResults() {
  const content = document.getElementById('content');
  if (!content) return;

  const resultHTML = `
    <div class="test-results">
      <h1>Golden Test Results</h1>
      <div class="test-summary">
        <p><strong>Total:</strong> ${passedTests + failedTests}</p>
        <p><strong>Passed:</strong> <span style="color: #4CAF50">${passedTests}</span></p>
        <p><strong>Failed:</strong> <span style="color: #f44336">${failedTests}</span></p>
      </div>
      <div class="test-list">
        ${tests.map(test => `
          <div class="test-item ${test.passed ? 'passed' : 'failed'}">
            <span>${test.passed ? '✓' : '✗'}</span>
            <span>${test.name}</span>
          </div>
        `).join('')}
      </div>
      ${failedTests === 0 ? '<h2 style="color: #4CAF50">🎉 All tests passed!</h2>' : ''}
    </div>
  `;

  content.innerHTML = resultHTML;

  // Add test styles
  const style = document.createElement('style');
  style.textContent = `
    .test-results {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .test-summary {
      background-color: var(--bg-secondary);
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }
    .test-summary p {
      margin-bottom: 0.5rem;
    }
    .test-list {
      background-color: var(--bg-secondary);
      padding: 1rem;
      border-radius: 8px;
    }
    .test-item {
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      border-radius: 4px;
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    .test-item.passed {
      background-color: rgba(76, 175, 80, 0.1);
      border-left: 4px solid #4CAF50;
    }
    .test-item.failed {
      background-color: rgba(244, 67, 54, 0.1);
      border-left: 4px solid #f44336;
    }
  `;
  document.head.appendChild(style);
}

// Run tests after a short delay to ensure modules are loaded
setTimeout(runTests, 500);
