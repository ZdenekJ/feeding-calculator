// Main entry point

import { registerServiceWorker } from './pwa.js';
import { initUI } from './ui.js';
import { setLang } from './i18n.js';
import { getSettings } from './storage.js';

// Initialize app
async function init() {
  // Load settings
  const settings = getSettings();
  setLang(settings.language);

  // Initialize UI
  initUI();

  // Register service worker
  await registerServiceWorker();
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
