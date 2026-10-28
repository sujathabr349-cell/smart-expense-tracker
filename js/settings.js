/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Smart Expense Tracker - Settings & Data Management Module
 * Theme customization (Light/Dark), currency configuration, date formatting,
 * JSON backup/restore, demo data reset, and clear data workflows.
 */

/**
 * Initialize Settings View
 */
function initSettings() {
  loadAndBindSettingsUI();
  setupBackupAndRestore();
  updateStorageStats();
}

/**
 * Populate and bind settings inputs
 */
function loadAndBindSettingsUI() {
  const settings = StorageService.getSettings();

  const currencySelect = document.getElementById('setting-currency');
  const themeSelect = document.getElementById('setting-theme');
  const dateFormatSelect = document.getElementById('setting-date-format');
  const monthStartSelect = document.getElementById('setting-month-start');

  if (currencySelect) {
    currencySelect.value = settings.currency || 'INR';
    currencySelect.addEventListener('change', (e) => {
      settings.currency = e.target.value;
      StorageService.saveSettings(settings);
      showToast(`Currency set to ${CURRENCY_CONFIG[settings.currency]?.name || settings.currency}`, 'success');
      refreshAllApplicationViews();
    });
  }

  if (themeSelect) {
    themeSelect.value = settings.theme || 'light';
    themeSelect.addEventListener('change', (e) => {
      settings.theme = e.target.value;
      StorageService.saveSettings(settings);
      applyTheme(settings.theme);
      showToast(`Theme changed to ${settings.theme}`, 'info');
      refreshAllApplicationViews();
    });
  }

  if (dateFormatSelect) {
    dateFormatSelect.value = settings.dateFormat || 'DD/MM/YYYY';
    dateFormatSelect.addEventListener('change', (e) => {
      settings.dateFormat = e.target.value;
      StorageService.saveSettings(settings);
      showToast(`Date format updated to ${settings.dateFormat}`, 'success');
      refreshAllApplicationViews();
    });
  }

  if (monthStartSelect) {
    monthStartSelect.value = settings.monthStartDay || 1;
    monthStartSelect.addEventListener('change', (e) => {
      settings.monthStartDay = parseInt(e.target.value, 10) || 1;
      StorageService.saveSettings(settings);
      showToast('Reporting month start day updated', 'info');
      refreshAllApplicationViews();
    });
  }
}

/**
 * Apply Light/Dark Theme to Document
 */
function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else if (theme === 'light') {
    html.classList.remove('dark');
  } else if (theme === 'system') {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  // Update theme toggle button in header if exists
  const themeToggleBtn = document.getElementById('header-theme-toggle-btn');
  if (themeToggleBtn) {
    const isNowDark = html.classList.contains('dark');
    themeToggleBtn.innerHTML = isNowDark
      ? `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`
      : `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>`;
  }
}

/**
 * Setup Backup, Restore, Demo Seed, and Clear Data
 */
function setupBackupAndRestore() {
  const exportBtn = document.getElementById('btn-export-backup');
  const importInput = document.getElementById('input-import-backup');
  const importTriggerBtn = document.getElementById('btn-import-trigger');
  const resetDemoBtn = document.getElementById('btn-reset-demo-data');
  const clearDataBtn = document.getElementById('btn-clear-all-data');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      StorageService.exportBackup();
      showToast('JSON Backup downloaded!', 'success');
    });
  }

  if (importTriggerBtn && importInput) {
    importTriggerBtn.addEventListener('click', () => {
      importInput.click();
    });

    importInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const jsonContent = event.target.result;
        
        const confirmed = await confirmDialog({
          title: 'Confirm Data Import',
          message: 'Importing this backup will replace current transaction records and budgets. Are you sure you wish to continue?',
          confirmText: 'Import & Overwrite',
          isDanger: true
        });

        if (!confirmed) {
          importInput.value = '';
          return;
        }

        const result = StorageService.importBackup(jsonContent);
        if (result.success) {
          showToast(`Successfully imported ${result.count} transactions!`, 'success');
          // Re-apply imported settings
          const newSettings = StorageService.getSettings();
          applyTheme(newSettings.theme);
          loadAndBindSettingsUI();
          refreshAllApplicationViews();
        } else {
          showToast(`Import failed: ${result.error}`, 'error', 5000);
        }

        importInput.value = '';
      };

      reader.readAsText(file);
    });
  }

  if (resetDemoBtn) {
    resetDemoBtn.addEventListener('click', async () => {
      const confirmed = await confirmDialog({
        title: 'Load Portfolio Demo Data',
        message: 'This will replace your current records with the pre-configured sample financial dataset (realistic student transactions, budgets, and savings goals).',
        confirmText: 'Load Demo Data'
      });

      if (!confirmed) return;

      StorageService.resetToDemo();
      showToast('Sample student portfolio data loaded!', 'success');
      refreshAllApplicationViews();
    });
  }

  if (clearDataBtn) {
    clearDataBtn.addEventListener('click', async () => {
      const confirmed = await confirmDialog({
        title: 'Clear All Financial Data',
        message: 'Are you sure you want to permanently erase all transactions, budgets, savings goals, and recurring rules? This cannot be undone.',
        confirmText: 'Clear Everything',
        isDanger: true
      });

      if (!confirmed) return;

      StorageService.clearAll();
      showToast('All local application records cleared', 'info');
      refreshAllApplicationViews();
    });
  }
}

/**
 * Calculate Approximate LocalStorage Byte Usage
 */
function updateStorageStats() {
  const statsEl = document.getElementById('storage-usage-stats');
  if (!statsEl) return;

  try {
    const rawData = localStorage.getItem(STORAGE_KEYS.DATA) || '';
    const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS) || '';
    const totalBytes = (rawData.length + rawSettings.length) * 2; // UTF-16
    const kb = (totalBytes / 1024).toFixed(1);
    statsEl.textContent = `${kb} KB used`;
  } catch (e) {
    statsEl.textContent = 'Storage active';
  }
}
