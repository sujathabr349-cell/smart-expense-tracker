/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Smart Expense Tracker - Main Application Orchestrator
 * Bootstraps views, sidebar routing, mobile drawer, quick-add actions,
 * modal dismissals, keyboard navigation, and global view synchronization.
 */

let currentActiveView = 'dashboard';

/**
 * Switch Active View
 */
function switchView(viewName) {
  currentActiveView = viewName;

  // 1. Update navigation links in sidebar
  document.querySelectorAll('.nav-link[data-view]').forEach((link) => {
    if (link.dataset.view === viewName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // 2. Update view containers
  document.querySelectorAll('.view-container').forEach((view) => {
    if (view.id === `view-${viewName}`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  // 3. Update top breadcrumb
  const breadcrumbEl = document.getElementById('header-current-breadcrumb');
  if (breadcrumbEl) {
    const titles = {
      dashboard: 'Dashboard Overview',
      transactions: 'Transactions Management',
      budgets: 'Monthly Budgets',
      goals: 'Savings Goals',
      reports: 'Reports & Analytics',
      recurring: 'Recurring Rules',
      settings: 'Preferences & Backup'
    };
    breadcrumbEl.textContent = titles[viewName] || 'Dashboard';
  }

  // 4. Close mobile sidebar drawer if open
  closeMobileDrawer();

  // 5. Trigger view-specific re-renders
  if (viewName === 'dashboard') {
    renderDashboardMetrics();
    renderBudgetWarnings();
    renderRecentTransactions();
    renderDashboardCharts();
  } else if (viewName === 'transactions') {
    if (typeof transactionState !== 'undefined' && transactionState.activeViewMode === 'calendar') {
      renderTransactionsCalendar();
    } else {
      renderTransactionsTable();
    }
  } else if (viewName === 'budgets') {
    renderBudgetsView();
  } else if (viewName === 'goals') {
    renderGoalsView();
  } else if (viewName === 'reports') {
    renderReportsView();
  } else if (viewName === 'recurring') {
    renderRecurringRules();
  } else if (viewName === 'settings') {
    updateStorageStats();
  }

  // Scroll to top of view
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Mobile Drawer Navigation
 */
function openMobileDrawer() {
  const sidebar = document.querySelector('.app-sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (sidebar) sidebar.classList.add('open');
  if (overlay) overlay.classList.add('active');
}

function closeMobileDrawer() {
  const sidebar = document.querySelector('.app-sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

/**
 * Global Synchronizer to update all components after any write operation
 */
function refreshAllApplicationViews() {
  renderDashboardMetrics();
  renderBudgetWarnings();
  renderRecentTransactions();
  renderDashboardCharts();
  renderTransactionsTable();
  if (typeof renderTransactionsCalendar === 'function' && typeof transactionState !== 'undefined' && transactionState.activeViewMode === 'calendar') {
    renderTransactionsCalendar();
  }
  renderBudgetsView();
  renderGoalsView();
  renderReportsView();
  renderRecurringRules();
  updateStorageStats();
}

/**
 * Setup Global UI and Event Handlers
 */
function setupGlobalUI() {
  // 1. Sidebar Nav Click Handlers
  document.querySelectorAll('.nav-link[data-view]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(link.dataset.view);
    });
  });

  // 2. Mobile Drawer Controls
  const menuToggleBtn = document.getElementById('menu-toggle-btn');
  const overlay = document.querySelector('.sidebar-overlay');
  if (menuToggleBtn) {
    menuToggleBtn.addEventListener('click', () => {
      openMobileDrawer();
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      closeMobileDrawer();
    });
  }

  // 3. Header Quick Action Buttons
  const addIncomeBtn = document.getElementById('header-add-income-btn');
  const addExpenseBtn = document.getElementById('header-add-expense-btn');
  const themeToggleBtn = document.getElementById('header-theme-toggle-btn');

  if (addIncomeBtn) {
    addIncomeBtn.addEventListener('click', () => openAddTransactionModal('income'));
  }
  if (addExpenseBtn) {
    addExpenseBtn.addEventListener('click', () => openAddTransactionModal('expense'));
  }
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const settings = StorageService.getSettings();
      const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
      settings.theme = newTheme;
      StorageService.saveSettings(settings);
      applyTheme(newTheme);
      showToast(`Switched to ${newTheme} mode`, 'info');
      // Re-render charts with updated theme contrast
      renderDashboardCharts();
      renderReportsView();
    });
  }

  // 4. Modal Backdrop and Escape Key Listeners
  document.querySelectorAll('.modal-overlay').forEach((modal) => {
    // Backdrop click to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });

    // Close buttons inside modal
    modal.querySelectorAll('.modal-close-btn, .modal-cancel-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        closeModal(modal.id);
      });
    });
  });

  // Keyboard shortcut: Escape to close modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach((activeModal) => {
        closeModal(activeModal.id);
      });
    }
  });
}

/**
 * Application Entry Point
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize settings & apply saved theme
  const settings = StorageService.getSettings();
  applyTheme(settings.theme);

  // 2. Process due recurring transactions automatically
  initRecurring();

  // 3. Setup individual modules
  setupGlobalUI();
  initTransactions();
  initDashboard();
  initBudgets();
  initGoals();
  initReports();
  initSettings();

  // 4. Set initial view
  switchView('dashboard');
});
