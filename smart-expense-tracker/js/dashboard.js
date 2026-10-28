/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Smart Expense Tracker - Dashboard Module
 * Metric cards, budget warning thresholds, recent transactions feed,
 * and Chart.js visualizations (Income vs Expense, Category Doughnut, Spending Trend).
 */

let chartInstances = {
  incomeExpense: null,
  categorySpending: null,
  spendingTrend: null
};

/**
 * Initialize and render all Dashboard components
 */
function initDashboard() {
  renderDashboardMetrics();
  renderBudgetWarnings();
  renderRecentTransactions();
  renderDashboardCharts();
}

/**
 * Calculate and render top executive metric cards
 */
function renderDashboardMetrics() {
  const appData = StorageService.getData();
  const settings = StorageService.getSettings();
  const currentMonth = getCurrentMonthKey();

  let totalIncome = 0;
  let totalExpenses = 0;
  let monthlyExpenses = 0;
  let monthlyIncome = 0;

  appData.transactions.forEach((t) => {
    const isThisMonth = t.date && t.date.startsWith(currentMonth);
    if (t.type === 'income') {
      totalIncome += t.amount;
      if (isThisMonth) monthlyIncome += t.amount;
    } else {
      totalExpenses += t.amount;
      if (isThisMonth) monthlyExpenses += t.amount;
    }
  });

  const netBalance = totalIncome - totalExpenses;

  // Calculate total savings from goals
  let totalSavings = 0;
  if (Array.isArray(appData.goals)) {
    appData.goals.forEach((g) => {
      totalSavings += (g.currentAmount || 0);
    });
  }

  // Calculate monthly budget usage
  const budgetForMonth = (appData.budgets && appData.budgets[currentMonth]) || { overallLimit: 0 };
  const overallLimit = budgetForMonth.overallLimit || 0;
  const budgetPercent = overallLimit > 0 ? Math.round((monthlyExpenses / overallLimit) * 100) : 0;

  // Update DOM elements
  const incomeEl = document.getElementById('dash-total-income');
  const expenseEl = document.getElementById('dash-total-expenses');
  const balanceEl = document.getElementById('dash-net-balance');
  const savingsEl = document.getElementById('dash-total-savings');
  const budgetUsageEl = document.getElementById('dash-budget-usage');
  const budgetBarEl = document.getElementById('dash-budget-progress-bar');
  const budgetMetaEl = document.getElementById('dash-budget-meta');

  if (incomeEl) incomeEl.textContent = formatCurrency(totalIncome, settings.currency);
  if (expenseEl) expenseEl.textContent = formatCurrency(totalExpenses, settings.currency);
  if (balanceEl) {
    balanceEl.textContent = formatCurrency(netBalance, settings.currency);
    balanceEl.style.color = netBalance >= 0 ? 'var(--text-primary)' : 'var(--color-expense)';
  }
  if (savingsEl) savingsEl.textContent = formatCurrency(totalSavings, settings.currency);

  if (budgetUsageEl) {
    if (overallLimit > 0) {
      budgetUsageEl.textContent = `${budgetPercent}%`;
      if (budgetBarEl) {
        budgetBarEl.style.width = `${Math.min(budgetPercent, 100)}%`;
        budgetBarEl.className = `progress-bar ${budgetPercent >= 100 ? 'danger' : budgetPercent >= 80 ? 'warning' : ''}`;
      }
      if (budgetMetaEl) {
        budgetMetaEl.innerHTML = `<span>Spent ${formatCurrency(monthlyExpenses, settings.currency)} of ${formatCurrency(overallLimit, settings.currency)}</span>`;
      }
    } else {
      budgetUsageEl.textContent = 'Not Set';
      if (budgetBarEl) budgetBarEl.style.width = '0%';
      if (budgetMetaEl) budgetMetaEl.textContent = 'Set limit in Budgets tab';
    }
  }
}

/**
 * Check and render budget warning banner if spending reaches >= 80% or >= 100%
 */
function renderBudgetWarnings() {
  const container = document.getElementById('dashboard-budget-alert-container');
  if (!container) return;

  const appData = StorageService.getData();
  const settings = StorageService.getSettings();
  const currentMonth = getCurrentMonthKey();
  const budget = (appData.budgets && appData.budgets[currentMonth]) || null;

  if (!budget || !budget.overallLimit) {
    container.innerHTML = '';
    return;
  }

  // Calculate spent this month overall and per category
  let overallSpent = 0;
  const categorySpent = {};

  appData.transactions.forEach((t) => {
    if (t.type === 'expense' && t.date && t.date.startsWith(currentMonth)) {
      overallSpent += t.amount;
      categorySpent[t.category] = (categorySpent[t.category] || 0) + t.amount;
    }
  });

  const overallRatio = overallSpent / budget.overallLimit;
  const criticalCategories = [];
  const warningCategories = [];

  // Check individual categories
  if (budget.categories) {
    for (const [cat, limit] of Object.entries(budget.categories)) {
      if (limit > 0) {
        const spent = categorySpent[cat] || 0;
        const ratio = spent / limit;
        if (ratio >= 1.0) {
          criticalCategories.push({ cat, spent, limit, pct: Math.round(ratio * 100) });
        } else if (ratio >= 0.8) {
          warningCategories.push({ cat, spent, limit, pct: Math.round(ratio * 100) });
        }
      }
    }
  }

  // Determine alert level
  if (overallRatio >= 1.0 || criticalCategories.length > 0) {
    // Danger Alert
    let details = `Overall spending is at ${Math.round(overallRatio * 100)}% of your monthly limit (${formatCurrency(overallSpent, settings.currency)} / ${formatCurrency(budget.overallLimit, settings.currency)}).`;
    if (criticalCategories.length > 0) {
      details += ` Exceeded limits in: ${criticalCategories.map(c => `<strong>${c.cat}</strong> (${c.pct}%)`).join(', ')}.`;
    }

    container.innerHTML = `
      <div class="budget-alert-banner danger" role="alert">
        <div class="alert-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <div class="alert-content">
          <div class="alert-title">Budget Limit Exceeded!</div>
          <div class="alert-desc">${details}</div>
        </div>
      </div>
    `;
  } else if (overallRatio >= 0.8 || warningCategories.length > 0) {
    // Warning Alert
    let details = `You have utilized ${Math.round(overallRatio * 100)}% of your monthly budget limit (${formatCurrency(overallSpent, settings.currency)} / ${formatCurrency(budget.overallLimit, settings.currency)}).`;
    if (warningCategories.length > 0) {
      details += ` Near threshold in: ${warningCategories.map(c => `<strong>${c.cat}</strong> (${c.pct}%)`).join(', ')}.`;
    }

    container.innerHTML = `
      <div class="budget-alert-banner" role="alert">
        <div class="alert-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="alert-content">
          <div class="alert-title">Budget Warning (Approaching Limit)</div>
          <div class="alert-desc">${details}</div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = '';
  }
}

/**
 * Render recent transactions list on Dashboard
 */
function renderRecentTransactions() {
  const container = document.getElementById('dash-recent-transactions-list');
  if (!container) return;

  const appData = StorageService.getData();
  const settings = StorageService.getSettings();

  const sorted = [...appData.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const recent = sorted.slice(0, 6);

  if (recent.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 2rem 1rem;">
        <p class="empty-state-title" style="font-size:0.95rem;">No recent transactions</p>
        <p class="empty-state-desc" style="font-size:0.8rem;">Click "+ Add Expense" or "+ Add Income" above to log your first record.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  recent.forEach((txn) => {
    const isIncome = txn.type === 'income';
    const catColor = CATEGORY_COLORS[txn.category] || '#64748b';

    const item = document.createElement('div');
    item.className = 'recent-txn-item';
    item.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 0.25rem;
      border-bottom: 1px solid var(--border-subtle);
    `;

    item.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <span class="cat-dot" style="background-color: ${catColor}; width:10px; height:10px;"></span>
        <div>
          <div style="font-weight:600; font-size:0.88rem; color:var(--text-primary);">${escapeHTML(txn.title)}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${formatRelativeDate(txn.date, settings.dateFormat)} · ${escapeHTML(txn.category)}</div>
        </div>
      </div>
      <div class="text-right">
        <span class="tabular-nums ${isIncome ? 'amount-income' : 'amount-expense'}" style="font-size:0.92rem; font-weight:700;">
          ${isIncome ? '+' : '-'}${formatCurrency(txn.amount, settings.currency)}
        </span>
      </div>
    `;

    container.appendChild(item);
  });
}

/**
 * Render Chart.js Visualizations (Income vs Expense, Spending by Category, Spending Trend)
 */
function renderDashboardCharts() {
  if (typeof Chart === 'undefined') {
    renderChartFallbacks();
    return;
  }

  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#9ca3af' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  const appData = StorageService.getData();
  const settings = StorageService.getSettings();

  // 1. Chart: Income vs Expenses (Last 6 Months)
  renderIncomeExpenseChart(appData, settings, textColor, gridColor);

  // 2. Chart: Spending by Category (Current Month)
  renderCategorySpendingChart(appData, settings, textColor);

  // 3. Chart: Monthly Spending Trend (Last 6 Months)
  renderSpendingTrendChart(appData, settings, textColor, gridColor);
}

/**
 * 1. Income vs Expense Comparison Bar Chart
 */
function renderIncomeExpenseChart(appData, settings, textColor, gridColor) {
  const canvas = document.getElementById('chart-income-expense');
  if (!canvas) return;

  // Calculate past 6 months labels and data
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'short' });
    months.push({ key, label });
  }

  const incomeData = new Array(6).fill(0);
  const expenseData = new Array(6).fill(0);

  appData.transactions.forEach((t) => {
    if (!t.date) return;
    months.forEach((m, idx) => {
      if (t.date.startsWith(m.key)) {
        if (t.type === 'income') {
          incomeData[idx] += t.amount;
        } else {
          expenseData[idx] += t.amount;
        }
      }
    });
  });

  if (chartInstances.incomeExpense) {
    chartInstances.incomeExpense.destroy();
  }

  const ctx = canvas.getContext('2d');
  chartInstances.incomeExpense = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.map(m => m.label),
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: '#10b981',
          borderRadius: 6,
          barPercentage: 0.6
        },
        {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: '#ef4444',
          borderRadius: 6,
          barPercentage: 0.6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: textColor, font: { family: 'DM Sans', size: 12 } }
        },
        tooltip: {
          callbacks: {
            label: (item) => `${item.dataset.label}: ${formatCurrency(item.raw, settings.currency)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: 'DM Sans' } }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: 'JetBrains Mono' },
            callback: (val) => `${CURRENCY_CONFIG[settings.currency]?.symbol || ''}${val}`
          }
        }
      }
    }
  });
}

/**
 * 2. Category Doughnut Chart
 */
function renderCategorySpendingChart(appData, settings, textColor) {
  const canvas = document.getElementById('chart-category-spending');
  if (!canvas) return;

  const currentMonth = getCurrentMonthKey();
  const catTotals = {};

  appData.transactions.forEach((t) => {
    if (t.type === 'expense' && t.date && t.date.startsWith(currentMonth)) {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    }
  });

  const categories = Object.keys(catTotals);
  const values = Object.values(catTotals);
  const colors = categories.map(cat => CATEGORY_COLORS[cat] || '#64748b');

  if (chartInstances.categorySpending) {
    chartInstances.categorySpending.destroy();
  }

  const ctx = canvas.getContext('2d');

  if (categories.length === 0) {
    // Draw empty state on canvas or fallback
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    chartInstances.categorySpending = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['No Expenses This Month'],
        datasets: [{ data: [1], backgroundColor: ['#e2e8f0'] }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
    return;
  }

  chartInstances.categorySpending = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: textColor,
            boxWidth: 12,
            font: { family: 'DM Sans', size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: (item) => `${item.label}: ${formatCurrency(item.raw, settings.currency)}`
          }
        }
      }
    }
  });
}

/**
 * 3. Monthly Spending Trend Line Chart
 */
function renderSpendingTrendChart(appData, settings, textColor, gridColor) {
  const canvas = document.getElementById('chart-spending-trend');
  if (!canvas) return;

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'short' });
    months.push({ key, label });
  }

  const expenseData = new Array(6).fill(0);

  appData.transactions.forEach((t) => {
    if (t.type === 'expense' && t.date) {
      months.forEach((m, idx) => {
        if (t.date.startsWith(m.key)) {
          expenseData[idx] += t.amount;
        }
      });
    }
  });

  if (chartInstances.spendingTrend) {
    chartInstances.spendingTrend.destroy();
  }

  const ctx = canvas.getContext('2d');
  chartInstances.spendingTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months.map(m => m.label),
      datasets: [
        {
          label: 'Total Expenses',
          data: expenseData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#ef4444',
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => `Spent: ${formatCurrency(item.raw, settings.currency)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: 'DM Sans' } }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: 'JetBrains Mono' },
            callback: (val) => `${CURRENCY_CONFIG[settings.currency]?.symbol || ''}${val}`
          }
        }
      }
    }
  });
}

/**
 * Fallback in case Chart.js CDN is unavailable
 */
function renderChartFallbacks() {
  document.querySelectorAll('.chart-container').forEach((container) => {
    container.innerHTML = `
      <div class="chart-fallback">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32" style="margin-bottom:0.5rem; color:var(--text-muted);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        <p style="font-weight:600; font-size:0.9rem;">Chart library requires an active internet connection</p>
        <p style="font-size:0.8rem; color:var(--text-muted);">Loaded from CDN: cdn.jsdelivr.net/npm/chart.js</p>
      </div>
    `;
  });
}
