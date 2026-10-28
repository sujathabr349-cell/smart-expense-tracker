/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Smart Expense Tracker - Budget Management Module
 * Monthly budget allocation, overall and category spending limits,
 * dynamic progress calculation, warning thresholds (80% & 100%), and budget editing.
 */

let selectedBudgetMonth = getCurrentMonthKey();

/**
 * Initialize Budgets View
 */
function initBudgets() {
  const monthInput = document.getElementById('budget-month-picker');
  if (monthInput) {
    monthInput.value = selectedBudgetMonth;
    monthInput.addEventListener('change', (e) => {
      selectedBudgetMonth = e.target.value || getCurrentMonthKey();
      renderBudgetsView();
    });
  }

  const setBudgetBtn = document.getElementById('btn-set-budget');
  if (setBudgetBtn) {
    setBudgetBtn.addEventListener('click', () => {
      openBudgetModal(selectedBudgetMonth);
    });
  }

  setupBudgetModal();
  renderBudgetsView();
}

/**
 * Render complete monthly budget cards and overall progress
 */
function renderBudgetsView() {
  const appData = StorageService.getData();
  const settings = StorageService.getSettings();

  const budget = (appData.budgets && appData.budgets[selectedBudgetMonth]) || null;
  const gridContainer = document.getElementById('budgets-category-grid');
  const overallCard = document.getElementById('budget-overall-card');
  const emptyState = document.getElementById('budgets-empty-state');
  const monthLabel = document.getElementById('budget-current-month-label');

  if (monthLabel) {
    const [y, m] = selectedBudgetMonth.split('-');
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    monthLabel.textContent = dateObj.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  }

  // Calculate actual spending in selected month
  let totalSpent = 0;
  const categorySpent = {};

  appData.transactions.forEach((t) => {
    if (t.type === 'expense' && t.date && t.date.startsWith(selectedBudgetMonth)) {
      totalSpent += t.amount;
      categorySpent[t.category] = (categorySpent[t.category] || 0) + t.amount;
    }
  });

  if (!budget || (!budget.overallLimit && (!budget.categories || Object.keys(budget.categories).length === 0))) {
    if (overallCard) overallCard.style.display = 'none';
    if (gridContainer) gridContainer.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (overallCard) overallCard.style.display = 'block';
  if (gridContainer) gridContainer.style.display = 'grid';

  // 1. Render Overall Monthly Budget Card
  const overallLimit = budget.overallLimit || 0;
  const overallSpent = totalSpent;
  const overallRemaining = Math.max(0, overallLimit - overallSpent);
  const overallPercent = overallLimit > 0 ? Math.round((overallSpent / overallLimit) * 100) : 0;

  const overallSpentEl = document.getElementById('budget-overall-spent');
  const overallLimitEl = document.getElementById('budget-overall-limit');
  const overallRemainEl = document.getElementById('budget-overall-remaining');
  const overallPercentEl = document.getElementById('budget-overall-percent');
  const overallBarEl = document.getElementById('budget-overall-progress-bar');
  const overallAlertEl = document.getElementById('budget-overall-alert');

  if (overallSpentEl) overallSpentEl.textContent = formatCurrency(overallSpent, settings.currency);
  if (overallLimitEl) overallLimitEl.textContent = formatCurrency(overallLimit, settings.currency);
  if (overallRemainEl) overallRemainEl.textContent = formatCurrency(overallRemaining, settings.currency);
  if (overallPercentEl) overallPercentEl.textContent = `${overallPercent}% used`;

  if (overallBarEl) {
    overallBarEl.style.width = `${Math.min(overallPercent, 100)}%`;
    overallBarEl.className = `progress-bar ${overallPercent >= 100 ? 'danger' : overallPercent >= 80 ? 'warning' : ''}`;
  }

  if (overallAlertEl) {
    if (overallPercent >= 100) {
      overallAlertEl.innerHTML = `<span style="color:var(--color-expense); font-weight:600;">Over Budget! You have exceeded your overall target by ${formatCurrency(overallSpent - overallLimit, settings.currency)}.</span>`;
    } else if (overallPercent >= 80) {
      overallAlertEl.innerHTML = `<span style="color:var(--color-warning); font-weight:600;">Warning: You have utilized ${overallPercent}% of your overall monthly budget limit.</span>`;
    } else {
      overallAlertEl.innerHTML = `<span style="color:var(--color-income); font-weight:600;">On Track: ${formatCurrency(overallRemaining, settings.currency)} remaining for this month.</span>`;
    }
  }

  // 2. Render Category-Specific Budget Cards
  gridContainer.innerHTML = '';
  const categoriesConfigured = budget.categories || {};

  EXPENSE_CATEGORIES.forEach((cat) => {
    const limit = categoriesConfigured[cat] || 0;
    const spent = categorySpent[cat] || 0;
    
    // Only show categories that have a limit set OR have spending in this month
    if (limit === 0 && spent === 0) return;

    const remaining = Math.max(0, limit - spent);
    const pct = limit > 0 ? Math.round((spent / limit) * 100) : 100;
    const catColor = CATEGORY_COLORS[cat] || '#64748b';

    let statusClass = '';
    let barClass = '';
    let statusText = 'Normal';

    if (limit > 0) {
      if (pct >= 100) {
        statusClass = 'danger-border';
        barClass = 'danger';
        statusText = 'Limit Exceeded';
      } else if (pct >= 80) {
        statusClass = 'warning-border';
        barClass = 'warning';
        statusText = 'Near Limit';
      } else {
        statusText = 'On Track';
      }
    } else {
      statusText = 'No Limit Set';
    }

    const card = document.createElement('div');
    card.className = `budget-card ${statusClass}`;
    card.innerHTML = `
      <div class="budget-card-header">
        <div class="budget-category-info">
          <div class="budget-icon-badge" style="background-color: ${catColor}15; color: ${catColor};">
            <span class="cat-dot" style="background-color:${catColor};"></span>
          </div>
          <div>
            <div class="budget-cat-name">${escapeHTML(cat)}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${statusText}</div>
          </div>
        </div>
        <div style="font-size:0.85rem; font-weight:700; color:${pct >= 100 ? 'var(--color-expense)' : pct >= 80 ? 'var(--color-warning)' : 'var(--text-secondary)'};">
          ${limit > 0 ? `${pct}%` : 'Uncapped'}
        </div>
      </div>

      <div class="budget-amounts">
        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); display:block;">Spent</span>
          <span class="spent-amount tabular-nums">${formatCurrency(spent, settings.currency)}</span>
        </div>
        <div class="text-right">
          <span style="font-size:0.75rem; color:var(--text-muted); display:block;">Budget Limit</span>
          <span class="tabular-nums" style="font-weight:600;">${limit > 0 ? formatCurrency(limit, settings.currency) : 'None'}</span>
        </div>
      </div>

      <div class="progress-container">
        <div class="progress-bar ${barClass}" style="width: ${limit > 0 ? Math.min(pct, 100) : 0}%;"></div>
      </div>

      <div class="budget-footer">
        <span>${limit > 0 ? `Remaining: ${formatCurrency(remaining, settings.currency)}` : `No cap configured`}</span>
        <button class="btn-table-action edit" data-cat="${cat}" title="Adjust ${cat} budget" style="width:auto; padding:0 6px; font-size:0.75rem;">
          Edit Limit
        </button>
      </div>
    `;

    card.querySelector('button.edit').addEventListener('click', () => {
      openBudgetModal(selectedBudgetMonth, cat);
    });

    gridContainer.appendChild(card);
  });
}

/**
 * Setup Budget Modal Form Handlers
 */
function setupBudgetModal() {
  const form = document.getElementById('budget-form');
  const deleteBtn = document.getElementById('budget-delete-btn');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveBudgetFromModal();
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      const confirmed = await confirmDialog({
        title: 'Reset Budget for Month',
        message: `Remove all budget limits for ${selectedBudgetMonth}? Historical transactions will not be deleted.`,
        confirmText: 'Remove Budget',
        isDanger: true
      });

      if (!confirmed) return;

      const appData = StorageService.getData();
      if (appData.budgets && appData.budgets[selectedBudgetMonth]) {
        delete appData.budgets[selectedBudgetMonth];
        StorageService.saveData(appData);
        showToast('Budget removed for this month', 'info');
        closeModal('modal-budget');
        refreshAllApplicationViews();
      }
    });
  }
}

/**
 * Open Modal to Add/Edit Budgets
 */
function openBudgetModal(monthKey, highlightCategory = null) {
  const modal = document.getElementById('modal-budget');
  const monthInput = document.getElementById('modal-budget-month');
  const overallLimitInput = document.getElementById('budget-modal-overall');
  const categoryInputsContainer = document.getElementById('budget-modal-categories-list');

  if (!modal || !categoryInputsContainer) return;

  const appData = StorageService.getData();
  const currentBudget = (appData.budgets && appData.budgets[monthKey]) || { overallLimit: 0, categories: {} };

  if (monthInput) monthInput.value = monthKey;
  if (overallLimitInput) overallLimitInput.value = currentBudget.overallLimit || '';

  // Render Category Limit Inputs
  categoryInputsContainer.innerHTML = '';
  EXPENSE_CATEGORIES.forEach((cat) => {
    const val = (currentBudget.categories && currentBudget.categories[cat]) || '';
    const catColor = CATEGORY_COLORS[cat] || '#64748b';

    const row = document.createElement('div');
    row.className = 'form-group';
    row.style.marginBottom = '0.75rem';
    row.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
        <label class="form-label" style="display:flex; align-items:center; gap:0.4rem; font-size:0.82rem;">
          <span class="cat-dot" style="background-color:${catColor};"></span>
          ${escapeHTML(cat)} Limit
        </label>
      </div>
      <input type="number" min="0" step="50" class="form-input budget-cat-input" data-category="${cat}" placeholder="Optional limit for ${cat}" value="${val}">
    `;

    categoryInputsContainer.appendChild(row);
  });

  openModal('modal-budget');

  if (highlightCategory) {
    setTimeout(() => {
      const targetInput = categoryInputsContainer.querySelector(`input[data-category="${highlightCategory}"]`);
      if (targetInput) targetInput.focus();
    }, 100);
  }
}

/**
 * Save Budget limits from modal
 */
function saveBudgetFromModal() {
  const monthInput = document.getElementById('modal-budget-month');
  const overallLimitInput = document.getElementById('budget-modal-overall');
  const catInputs = document.querySelectorAll('.budget-cat-input');

  const monthKey = monthInput ? monthInput.value : selectedBudgetMonth;
  const overallLimit = parseFloat(overallLimitInput.value) || 0;

  const categories = {};
  catInputs.forEach((inp) => {
    const cat = inp.dataset.category;
    const val = parseFloat(inp.value);
    if (!isNaN(val) && val > 0) {
      categories[cat] = val;
    }
  });

  const appData = StorageService.getData();
  if (!appData.budgets) appData.budgets = {};

  appData.budgets[monthKey] = {
    overallLimit,
    categories
  };

  StorageService.saveData(appData);
  showToast(`Budget for ${monthKey} updated!`, 'success');
  closeModal('modal-budget');
  refreshAllApplicationViews();
}
