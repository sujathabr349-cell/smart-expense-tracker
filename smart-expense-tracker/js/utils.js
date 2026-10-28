/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Smart Expense Tracker - Utility Functions
 * Pure vanilla JavaScript helper functions for formatting, sanitization, modals, and notifications.
 */

// Global Currency Symbols and Formatter Map
const CURRENCY_CONFIG = {
  INR: { symbol: '₹', locale: 'en-IN', name: 'Indian Rupee' },
  USD: { symbol: '$', locale: 'en-US', name: 'US Dollar' },
  EUR: { symbol: '€', locale: 'de-DE', name: 'Euro' },
  GBP: { symbol: '£', locale: 'en-GB', name: 'British Pound' }
};

// Category Colors for Badges and Charts
const CATEGORY_COLORS = {
  // Expenses
  Food: '#f97316',
  Travel: '#0ea5e9',
  Shopping: '#ec4899',
  Education: '#8b5cf6',
  Bills: '#eab308',
  Healthcare: '#14b8a6',
  Entertainment: '#a855f7',
  Rent: '#f43f5e',
  // Income
  Salary: '#10b981',
  Freelance: '#06b6d4',
  Scholarship: '#6366f1',
  Business: '#3b82f6',
  Gift: '#f59e0b',
  Other: '#64748b'
};

/**
 * Safely format monetary amount with currency symbol and localized grouping.
 * @param {number} amount
 * @param {string} currencyCode - INR, USD, EUR, GBP
 * @returns {string}
 */
function formatCurrency(amount, currencyCode = 'INR') {
  const num = Number(amount) || 0;
  const config = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG.INR;

  try {
    const formatted = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(num));

    const sign = num < 0 ? '-' : '';
    return `${sign}${config.symbol}${formatted}`;
  } catch (e) {
    return `${config.symbol}${num.toFixed(2)}`;
  }
}

/**
 * Format date string into user's preferred display format.
 * @param {string|Date} dateInput
 * @param {string} format - 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'
 * @returns {string}
 */
function formatDate(dateInput, format = 'DD/MM/YYYY') {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (format === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`;
  } else if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }
  // Default 'DD/MM/YYYY'
  return `${day}/${month}/${year}`;
}

/**
 * Human friendly relative date formatting ("Today", "Yesterday", or formatted date)
 */
function formatRelativeDate(dateStr, formatPref = 'DD/MM/YYYY') {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const now = new Date();

  // Reset times for accurate date-only comparison
  const dZero = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.round((nowZero - dZero) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';

  return formatDate(dateStr, formatPref);
}

/**
 * Get current ISO date YYYY-MM-DD
 */
function getTodayISODate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate a unique ID for transactions, goals, rules.
 */
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sanitize and escape HTML strings to prevent XSS.
 * @param {string} str 
 * @returns {string}
 */
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Debounce helper for instant search input without hammering CPU.
 */
function debounce(fn, delay = 200) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Toast Notification Dispatcher
 * @param {string} message 
 * @param {'success'|'error'|'warning'|'info'} type 
 * @param {number} duration 
 */
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  const icons = {
    success: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
    error: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
    warning: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
    info: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
  };

  toast.innerHTML = `
    <div style="flex-shrink:0; display:flex; align-items:center;">${icons[type] || icons.info}</div>
    <div class="toast-msg">${escapeHTML(message)}</div>
    <button class="toast-close" aria-label="Dismiss">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => toast.remove(), 200);
    }
  }, duration);
}

/**
 * Accessible Modal Helpers
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');

  // Focus the first input or close button
  const focusable = modal.querySelectorAll('input:not([type="hidden"]), select, textarea, button:not([disabled])');
  if (focusable.length > 0) {
    setTimeout(() => focusable[0].focus(), 50);
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
}

/**
 * Custom Accessible Confirmation Dialog (Returns a Promise)
 * Avoids disruptive window.confirm alerts.
 * @param {object} options - { title, message, confirmText, cancelText, isDanger }
 * @returns {Promise<boolean>}
 */
function confirmDialog(options = {}) {
  const {
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false
  } = options;

  return new Promise((resolve) => {
    let confirmModal = document.getElementById('modal-confirm');
    if (!confirmModal) {
      // Fallback in case not yet rendered in HTML
      resolve(true);
      return;
    }

    const titleEl = confirmModal.querySelector('#confirm-modal-title');
    const msgEl = confirmModal.querySelector('#confirm-modal-message');
    const okBtn = confirmModal.querySelector('#confirm-modal-ok');
    const cancelBtn = confirmModal.querySelector('#confirm-modal-cancel');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    if (okBtn) {
      okBtn.textContent = confirmText;
      if (isDanger) {
        okBtn.className = 'btn btn-expense';
      } else {
        okBtn.className = 'btn btn-primary';
      }
    }

    const cleanup = () => {
      confirmModal.classList.remove('active');
      confirmModal.setAttribute('aria-hidden', 'true');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
    };

    const onOk = () => {
      cleanup();
      resolve(true);
    };

    const onCancel = () => {
      cleanup();
      resolve(false);
    };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);

    confirmModal.classList.add('active');
    confirmModal.setAttribute('aria-hidden', 'false');
    okBtn.focus();
  });
}
