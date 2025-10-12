// Local storage module for persisting app data

const STORAGE_KEYS = {
  FEEDS: 'puppy_feeds',
  SETTINGS: 'puppy_settings',
  PUPPY_DATA: 'puppy_data'
};

/**
 * Get all feeds from storage
 * @returns {Array} Array of normalized feeds
 */
export function getFeeds() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FEEDS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading feeds from storage:', e);
    return [];
  }
}

/**
 * Save feeds to storage
 * @param {Array} feeds - Array of normalized feeds
 */
export function saveFeeds(feeds) {
  try {
    localStorage.setItem(STORAGE_KEYS.FEEDS, JSON.stringify(feeds));
  } catch (e) {
    console.error('Error saving feeds to storage:', e);
  }
}

/**
 * Add a feed to storage
 * @param {Object} feed - Normalized feed to add
 */
export function addFeed(feed) {
  const feeds = getFeeds();
  feeds.push(feed);
  saveFeeds(feeds);
}

/**
 * Delete a feed from storage
 * @param {number} index - Index of feed to delete
 */
export function deleteFeed(index) {
  const feeds = getFeeds();
  feeds.splice(index, 1);
  saveFeeds(feeds);
}

/**
 * Get settings from storage
 * @returns {Object} Settings object
 */
export function getSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {
      theme: 'system',
      language: 'en',
      unitSystem: 'metric',
      roundingStep: 5
    };
  } catch (e) {
    console.error('Error reading settings from storage:', e);
    return {
      theme: 'system',
      language: 'en',
      unitSystem: 'metric',
      roundingStep: 5
    };
  }
}

/**
 * Save settings to storage
 * @param {Object} settings - Settings object
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings to storage:', e);
  }
}

/**
 * Get puppy data from storage (birth date, auto age)
 * @returns {Object} Puppy data
 */
export function getPuppyData() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PUPPY_DATA);
    return data ? JSON.parse(data) : {
      birthDate: '',
      autoAge: false
    };
  } catch (e) {
    console.error('Error reading puppy data from storage:', e);
    return {
      birthDate: '',
      autoAge: false
    };
  }
}

/**
 * Save puppy data to storage
 * @param {Object} puppyData - Puppy data object
 */
export function savePuppyData(puppyData) {
  try {
    localStorage.setItem(STORAGE_KEYS.PUPPY_DATA, JSON.stringify(puppyData));
  } catch (e) {
    console.error('Error saving puppy data to storage:', e);
  }
}

/**
 * Export all data
 * @returns {Object} All stored data
 */
export function exportAllData() {
  return {
    feeds: getFeeds(),
    settings: getSettings(),
    puppyData: getPuppyData()
  };
}

/**
 * Import all data
 * @param {Object} data - Data to import
 */
export function importAllData(data) {
  if (data.feeds) saveFeeds(data.feeds);
  if (data.settings) saveSettings(data.settings);
  if (data.puppyData) savePuppyData(data.puppyData);
}
