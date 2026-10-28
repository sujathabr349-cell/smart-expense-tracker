/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Smart Expense Tracker - Reports & Analytics Module
 * Comprehensive financial period analytics, Chart.js reporting,
 * average daily spending, highest category analysis, CSV export, and print formatting.
 */

let reportChartInstances = {
  comparison: null,
  categoryShare: null
};

let currentReportPeriod = 'this-month'; // 'this-month', 'last-month', 'ytd', 'all-time', 'custom'

/**
 * Initialize Reports View
 */
function initReports() {
  setupReportControls();
  renderReportsView();
}

/**
 * Setup Period Selectors and Action Buttons
 */
function setupReportControls() {
  const periodSelect = document.getElementById('report-period-select');
  const customDatesWrapper = document.getElementById('report-custom-dates');
  const startDateInput = document.getElementById('report-start-date');
  const endDateInput = document.getElementById('report-end-date');
  const applyBtn = document.getElementById('report-apply-btn');
  const printBtn = document.getElementById('report-print-btn');
  const exportBtn = document.getElementById('report-export-csv-btn');

  if (periodSelect) {
    periodSelect.addEventListener('change', (e) => {
      currentReportPeriod = e.target.value;
      if (customDatesWrapper) {
        customDatesWrapper.style.display = currentReportPeriod === 'custom' ? 'flex' : 'none';
      }
      if (currentReportPeriod !== 'custom') {
        renderReportsView();
      }
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      renderReportsView();
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportReportTransactionsCSV();
    });
  }
}

/**
 * Get date range for currently selected report period
 */
function getReportDateRange() {
  const now = new Date();
  let start = '';
  let end = '';

  if (currentReportPeriod === 'this-month') {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    start = `${y}-${m}-01`;
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
  } else if (currentReportPeriod === 'last-month') {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const y = prev.getFullYear();
    const m = String(prev.getMonth() + 1).padStart(2, '0');
    start = `${y}-${m}-01`;
    const lastDay = new Date(y, prev.getMonth() + 1, 0).getDate();
    end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
  } else if (currentReportPeriod === 'ytd') {
    const y = now.getFullYear();
    start = `${y}-01-01`;
    end = getTodayISODate();
  } else if (currentReportPeriod === 'all-time') {
    start = '1970-01-01';
    end = '2099-12-31';
  } else if (currentReportPeriod === 'custom') {
    const sInput = document.getElementById('report-start-date');
    const eInput = document.getElementById('report-end-date');
    start = sInput && sInput.value ? sInput.value : '1970-01-01';
    end = eInput && eInput.value ? eInput.value : getTodayISODate();
  }

  return { start, end };
}

/**
 * Filter transactions falling within selected period
 */
function getReportTransactions() {
  const { start, end } = getReportDateRange();
  const appData = StorageService.getData();

  return appData.transactions.filter((t) => {
    if (!t.date) return false;
    return t.date >= start && t.date <= end;
  });
}

/**
 * Render Reports View Analytics & Charts
 */
function renderReportsView() {
  const txns = getReportTransactions();
  const settings = StorageService.getSettings();
  const { start, end } = getReportDateRange();

  let totalIncome = 0;
  let totalExpenses = 0;
  let maxExpense = 0;
  const categoryExpenses = {};

  txns.forEach((t) => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
      categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
      if (t.amount > maxExpense) maxExpense = t.amount;
    }
  });

  const netBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)) : 0;

  // Calculate day count in period for average daily expense
  const startDateObj = new Date(start === '1970-01-01' ? (txns.length > 0 ? txns[txns.length - 1].date : getTodayISODate()) : start);
  const endDateObj = new Date(end === '2099-12-31' ? getTodayISODate() : end);
  const diffDays = Math.max(1, Math.round((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1);
  const avgDailyExpense = totalExpenses / diffDays;

  // Identify highest spending category
  let topCategory = 'None';
  let topCategoryAmount = 0;
  for (const [cat, amt] of Object.entries(categoryExpenses)) {
    if (amt > topCategoryAmount) {
      topCategoryAmount = amt;
      topCategory = cat;
    }
  }

  const topCategoryShare = totalExpenses > 0 ? Math.round((topCategoryAmount / totalExpenses) * 100) : 0;

  // Update DOM Metric elements
  const incomeEl = document.getElementById('report-total-income');
  const expenseEl = document.getElementById('report-total-expense');
  const netEl = document.getElementById('report-net-balance');
  const rateEl = document.getElementById('report-savings-rate');
  const topCatEl = document.getElementById('report-top-category');
  const avgDailyEl = document.getElementById('report-avg-daily');
  const countEl = document.getElementById('report-txn-count');

  if (incomeEl) incomeEl.textContent = formatCurrency(totalIncome, settings.currency);
  if (expenseEl) expenseEl.textContent = formatCurrency(totalExpenses, settings.currency);
  if (netEl) {
    netEl.textContent = formatCurrency(netBalance, settings.currency);
    netEl.style.color = netBalance >= 0 ? 'var(--color-income)' : 'var(--color-expense)';
  }
  if (rateEl) rateEl.textContent = `${savingsRate}%`;
  if (topCatEl) {
    topCatEl.innerHTML = topCategoryAmount > 0 
      ? `<strong>${escapeHTML(topCategory)}</strong> <span style="font-size:0.75rem; color:var(--text-muted);">(${topCategoryShare}%)</span>`
      : 'None';
  }
  if (avgDailyEl) avgDailyEl.textContent = formatCurrency(avgDailyExpense, settings.currency);
  if (countEl) countEl.textContent = `${txns.length} records`;

  // Render Category Breakdown Table
  renderCategoryBreakdownTable(categoryExpenses, totalExpenses, settings);

  // Render Charts
  renderReportsCharts(txns, categoryExpenses, settings);
}

/**
 * Render category spending table
 */
function renderCategoryBreakdownTable(catExpenses, totalExpenses, settings) {
  const tbody = document.getElementById('report-category-table-body');
  if (!tbody) return;

  const entries = Object.entries(catExpenses).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding:2rem; color:var(--text-muted);">No expense records in selected period</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  entries.forEach(([cat, amt]) => {
    const pct = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
    const catColor = CATEGORY_COLORS[cat] || '#64748b';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <span class="category-indicator">
          <span class="cat-dot" style="background-color: ${catColor};"></span>
          <strong>${escapeHTML(cat)}</strong>
        </span>
      </td>
      <td class="text-right tabular-nums">
        ${formatCurrency(amt, settings.currency)}
      </td>
      <td class="text-right tabular-nums">
        ${pct}%
      </td>
      <td>
        <div class="progress-container" style="height:6px;">
          <div class="progress-bar" style="width:${pct}%; background-color:${catColor};"></div>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Render Reports Chart.js charts
 */
function renderReportsCharts(txns, catExpenses, settings) {
  if (typeof Chart === 'undefined') return;

  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#9ca3af' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  // Chart 1: Category Distribution Horizontal Bar
  const catCanvas = document.getElementById('chart-report-categories');
  if (catCanvas) {
    if (reportChartInstances.categoryShare) {
      reportChartInstances.categoryShare.destroy();
    }

    const categories = Object.keys(catExpenses);
    const amounts = Object.values(catExpenses);
    const colors = categories.map(c => CATEGORY_COLORS[c] || '#64748b');

    const ctx = catCanvas.getContext('2d');
    reportChartInstances.categoryShare = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [{
          label: 'Spent',
          data: amounts,
          backgroundColor: colors,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
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
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { family: 'JetBrains Mono' },
              callback: (val) => `${CURRENCY_CONFIG[settings.currency]?.symbol || ''}${val}`
            }
          },
          y: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: 'DM Sans', size: 12 } }
          }
        }
      }
    });
  }
}

/**
 * Export filtered report transactions
 */
function exportReportTransactionsCSV() {
  const txns = getReportTransactions();
  if (txns.length === 0) {
    showToast('No transactions in this period to export', 'warning');
    return;
  }

  const headers = ['ID', 'Date', 'Title', 'Type', 'Category', 'Amount', 'Payment Method', 'Notes'];
  const escapeCsv = (str) => {
    const val = String(str || '');
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const rows = txns.map((t) => [
    escapeCsv(t.id),
    escapeCsv(t.date),
    escapeCsv(t.title),
    escapeCsv(t.type),
    escapeCsv(t.category),
    t.amount.toFixed(2),
    escapeCsv(t.paymentMethod),
    escapeCsv(t.notes)
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `financial_report_${currentReportPeriod}_${getTodayISODate()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Report exported (${txns.length} records)`, 'success');
}
