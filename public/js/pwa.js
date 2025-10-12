// PWA registration and update management

import { t } from './i18n.js';

let registration = null;
let updateCheckInterval = null;

/**
 * Register service worker
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      // Check for updates on load
      registration.update();

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            showUpdateToast();
          }
        });
      });

      // Listen for controller change (after skipWaiting)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      // Start periodic update checks (every 1 hour)
      startUpdateChecks();
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}

/**
 * Start periodic update checks
 */
function startUpdateChecks() {
  // Check every 60 minutes
  updateCheckInterval = setInterval(() => {
    checkForUpdates();
  }, 60 * 60 * 1000);
}

/**
 * Check for updates by fetching version.json
 */
async function checkForUpdates() {
  try {
    const response = await fetch('/version.json', { cache: 'no-store' });
    if (response.ok && registration) {
      registration.update();
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }
}

/**
 * Show update toast notification
 */
function showUpdateToast() {
  const toast = document.createElement('div');
  toast.className = 'update-toast';
  toast.innerHTML = `
    <div class="update-toast-content">
      <p>${t('new_version_available')}</p>
      <div class="update-toast-buttons">
        <button id="btn-update" class="btn btn-primary">${t('btn_update')}</button>
        <button id="btn-dismiss" class="btn btn-secondary">${t('btn_dismiss')}</button>
      </div>
    </div>
  `;

  document.body.appendChild(toast);

  // Update button - send SKIP_WAITING message
  document.getElementById('btn-update').addEventListener('click', () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage('SKIP_WAITING');
    }
    toast.remove();
  });

  // Dismiss button
  document.getElementById('btn-dismiss').addEventListener('click', () => {
    toast.remove();
  });

  // Show toast
  setTimeout(() => toast.classList.add('show'), 100);
}

/**
 * Stop update checks (cleanup)
 */
export function stopUpdateChecks() {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
  }
}
