/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Smart Expense Tracker - Transactions Manager
 * Full CRUD operations, dynamic category population, advanced search & filtering,
 * tabular view with sorting, pagination, and RFC-4180 CSV export.
 */

const EXPENSE_CATEGORIES = [
  'Food', 'Travel', 'Shopping', 'Education', 'Bills', 
  'Healthcare', 'Entertainment', 'Rent', 'Other'
];

const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Scholarship', 'Business', 'Gift', 'Other'
];

const PAYMENT_METHODS = [
  'Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Other'
];

// Current filter, pagination, and view mode state
const transactionState = {
  activeViewMode: 'table', // 'table' | 'calendar'
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth(),
  searchQuery: '',
  typeFilter: 'all',
  categoryFilter: 'all',
  paymentMethodFilter: 'all',
  startDate: '',
  endDate: '',
  sortBy: 'date-desc',
  currentPage: 1,
  pageSize: 10,
  editingId: null
};

/**
 * Initialize Transactions View and Forms
 */
function initTransactions() {
  setupTransactionForm();
  setupFilterControls();
  setupViewModeToggle();
  setupCalendarControls();
  renderTransactionsTable();
}

/**
 * Configure the Add/Edit Transaction Form & Category Switching
 */
function setupTransactionForm() {
  const form = document.getElementById('transaction-form');
  const typeBtns = document.querySelectorAll('.type-toggle-btn');
  const categorySelect = document.getElementById('txn-category');

  if (!form) return;

  // Type Toggle (Expense / Income)
  typeBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetType = btn.dataset.type;
      setTransactionFormType(targetType);
    });
  });

  // Form submit handler with validation
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveTransactionFromForm();
  });

  // Initial category options
  updateCategoryDropdown('expense');
}

/**
 * Switch form between Expense and Income mode
 */
function setTransactionFormType(type) {
  const typeBtns = document.querySelectorAll('.type-toggle-btn');
  const typeInput = document.getElementById('txn-type');

  typeBtns.forEach((btn) => {
    if (btn.dataset.type === type) {
      btn.classList.add('active', type);
    } else {
      btn.classList.remove('active', 'income', 'expense');
    }
  });

  if (typeInput) typeInput.value = type;
  updateCategoryDropdown(type);
}

/**
 * Populate category select options based on transaction type
 */
function updateCategoryDropdown(type, selectedCategory = '') {
  const select = document.getElementById('txn-category');
  if (!select) return;

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  select.innerHTML = '<option value="" disabled>Select category</option>';

  categories.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    if (cat === selectedCategory) opt.selected = true;
    select.appendChild(opt);
  });

  if (!selectedCategory && categories.length > 0) {
    select.value = categories[0];
  }
}

/**
 * Open Modal to Add New Transaction
 */
function openAddTransactionModal(presetType = 'expense', presetDate = null) {
  transactionState.editingId = null;
  const modal = document.getElementById('modal-transaction');
  const modalTitle = document.getElementById('txn-modal-title');
  const submitBtn = document.getElementById('txn-submit-btn');
  const form = document.getElementById('transaction-form');

  if (!modal || !form) return;

  form.reset();
  clearFormErrors();

  if (modalTitle) modalTitle.textContent = presetType === 'income' ? 'Add New Income' : 'Add New Expense';
  if (submitBtn) submitBtn.textContent = 'Save Transaction';

  // Default date to presetDate or today
  const dateInput = document.getElementById('txn-date');
  if (dateInput) dateInput.value = presetDate || getTodayISODate();

  setTransactionFormType(presetType);
  openModal('modal-transaction');
}

/**
 * Open Modal to Edit Existing Transaction
 */
function openEditTransactionModal(txnId) {
  const appData = StorageService.getData();
  const txn = appData.transactions.find((t) => t.id === txnId);
  if (!txn) {
    showToast('Transaction not found', 'error');
    return;
  }

  transactionState.editingId = txnId;
  const modalTitle = document.getElementById('txn-modal-title');
  const submitBtn = document.getElementById('txn-submit-btn');

  if (modalTitle) modalTitle.textContent = 'Edit Transaction';
  if (submitBtn) submitBtn.textContent = 'Update Transaction';

  // Pre-fill form fields
  document.getElementById('txn-title').value = txn.title;
  document.getElementById('txn-amount').value = txn.amount;
  document.getElementById('txn-date').value = txn.date;
  document.getElementById('txn-payment').value = txn.paymentMethod || 'Other';
  document.getElementById('txn-notes').value = txn.notes || '';

  setTransactionFormType(txn.type);
  updateCategoryDropdown(txn.type, txn.category);

  clearFormErrors();
  openModal('modal-transaction');
}

/**
 * Validate and Save/Update Transaction
 */
function saveTransactionFromForm() {
  clearFormErrors();

  const titleInput = document.getElementById('txn-title');
  const amountInput = document.getElementById('txn-amount');
  const typeInput = document.getElementById('txn-type');
  const categoryInput = document.getElementById('txn-category');
  const dateInput = document.getElementById('txn-date');
  const paymentInput = document.getElementById('txn-payment');
  const notesInput = document.getElementById('txn-notes');

  const title = titleInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const type = typeInput.value || 'expense';
  const category = categoryInput.value;
  const date = dateInput.value;
  const paymentMethod = paymentInput.value;
  const notes = notesInput ? notesInput.value.trim() : '';

  let isValid = true;

  if (!title || title.length < 2) {
    setFieldError(titleInput, 'Title must be at least 2 characters');
    isValid = false;
  } else if (title.length > 80) {
    setFieldError(titleInput, 'Title cannot exceed 80 characters');
    isValid = false;
  }

  if (isNaN(amount) || amount <= 0) {
    setFieldError(amountInput, 'Please enter a valid amount greater than 0');
    isValid = false;
  }

  if (!category) {
    setFieldError(categoryInput, 'Please select a category');
    isValid = false;
  }

  if (!date) {
    setFieldError(dateInput, 'Please select a valid date');
    isValid = false;
  }

  if (!isValid) return;

  const appData = StorageService.getData();

  if (transactionState.editingId) {
    // Update existing transaction
    const index = appData.transactions.findIndex((t) => t.id === transactionState.editingId);
    if (index !== -1) {
      appData.transactions[index] = {
        ...appData.transactions[index],
        title,
        amount,
        type,
        category,
        date,
        paymentMethod,
        notes
      };
      StorageService.saveData(appData);
      showToast('Transaction updated successfully!', 'success');
    }
  } else {
    // Add new transaction
    const newTxn = {
      id: generateId('txn'),
      title,
      amount,
      type,
      category,
      date,
      paymentMethod,
      notes,
      createdAt: new Date().toISOString()
    };
    appData.transactions.unshift(newTxn);
    StorageService.saveData(appData);
    showToast(`${type === 'income' ? 'Income' : 'Expense'} recorded successfully!`, 'success');
  }

  closeModal('modal-transaction');
  refreshAllApplicationViews();
}

/**
 * Delete Transaction with Confirmation
 */
async function deleteTransaction(txnId) {
  const confirmed = await confirmDialog({
    title: 'Delete Transaction',
    message: 'Are you sure you want to delete this transaction record? This action cannot be undone.',
    confirmText: 'Delete Record',
    isDanger: true
  });

  if (!confirmed) return;

  const appData = StorageService.getData();
  const initialLength = appData.transactions.length;
  appData.transactions = appData.transactions.filter((t) => t.id !== txnId);

  if (appData.transactions.length < initialLength) {
    StorageService.saveData(appData);
    showToast('Transaction deleted', 'info');
    refreshAllApplicationViews();
  }
}

/**
 * Set up search input, dropdown filters, date pickers, and sorting
 */
function setupFilterControls() {
  const searchInput = document.getElementById('txn-search-input');
  const typeFilter = document.getElementById('txn-filter-type');
  const catFilter = document.getElementById('txn-filter-category');
  const paymentFilter = document.getElementById('txn-filter-payment');
  const startDateInput = document.getElementById('txn-filter-start-date');
  const endDateInput = document.getElementById('txn-filter-end-date');
  const sortSelect = document.getElementById('txn-sort-select');
  const clearBtn = document.getElementById('txn-filter-clear-btn');
  const exportCsvBtn = document.getElementById('txn-export-csv-btn');

  // Populate Category Filter dropdown
  if (catFilter) {
    catFilter.innerHTML = '<option value="all">All Categories</option>';
    const allCategories = Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])).sort();
    allCategories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      catFilter.appendChild(opt);
    });
  }

  // Populate Payment Method dropdown
  if (paymentFilter) {
    paymentFilter.innerHTML = '<option value="all">All Payment Methods</option>';
    PAYMENT_METHODS.forEach((pm) => {
      const opt = document.createElement('option');
      opt.value = pm;
      opt.textContent = pm;
      paymentFilter.appendChild(opt);
    });
  }

  // Event Listeners
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      transactionState.searchQuery = e.target.value.trim().toLowerCase();
      transactionState.currentPage = 1;
      renderTransactionsTable();
    }, 150));
  }

  if (typeFilter) {
    typeFilter.addEventListener('change', (e) => {
      transactionState.typeFilter = e.target.value;
      transactionState.currentPage = 1;
      renderTransactionsTable();
    });
  }

  if (catFilter) {
    catFilter.addEventListener('change', (e) => {
      transactionState.categoryFilter = e.target.value;
      transactionState.currentPage = 1;
      renderTransactionsTable();
    });
  }

  if (paymentFilter) {
    paymentFilter.addEventListener('change', (e) => {
      transactionState.paymentMethodFilter = e.target.value;
      transactionState.currentPage = 1;
      renderTransactionsTable();
    });
  }

  if (startDateInput) {
    startDateInput.addEventListener('change', (e) => {
      transactionState.startDate = e.target.value;
      transactionState.currentPage = 1;
      renderTransactionsTable();
    });
  }

  if (endDateInput) {
    endDateInput.addEventListener('change', (e) => {
      transactionState.endDate = e.target.value;
      transactionState.currentPage = 1;
      renderTransactionsTable();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      transactionState.sortBy = e.target.value;
      renderTransactionsTable();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (typeFilter) typeFilter.value = 'all';
      if (catFilter) catFilter.value = 'all';
      if (paymentFilter) paymentFilter.value = 'all';
      if (startDateInput) startDateInput.value = '';
      if (endDateInput) endDateInput.value = '';
      if (sortSelect) sortSelect.value = 'date-desc';

      transactionState.searchQuery = '';
      transactionState.typeFilter = 'all';
      transactionState.categoryFilter = 'all';
      transactionState.paymentMethodFilter = 'all';
      transactionState.startDate = '';
      transactionState.endDate = '';
      transactionState.sortBy = 'date-desc';
      transactionState.currentPage = 1;

      renderTransactionsTable();
      showToast('Filters cleared', 'info');
    });
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      exportTransactionsCSV();
    });
  }
}

/**
 * Filter and Sort Transactions Helper
 */
function getFilteredAndSortedTransactions() {
  const appData = StorageService.getData();
  let list = [...appData.transactions];

  // 1. Text Search
  if (transactionState.searchQuery) {
    const q = transactionState.searchQuery;
    list = list.filter((t) => 
      t.title.toLowerCase().includes(q) || 
      (t.notes && t.notes.toLowerCase().includes(q)) ||
      t.category.toLowerCase().includes(q)
    );
  }

  // 2. Type Filter
  if (transactionState.typeFilter !== 'all') {
    list = list.filter((t) => t.type === transactionState.typeFilter);
  }

  // 3. Category Filter
  if (transactionState.categoryFilter !== 'all') {
    list = list.filter((t) => t.category === transactionState.categoryFilter);
  }

  // 4. Payment Method Filter
  if (transactionState.paymentMethodFilter !== 'all') {
    list = list.filter((t) => t.paymentMethod === transactionState.paymentMethodFilter);
  }

  // 5. Date Range Filter
  if (transactionState.startDate) {
    list = list.filter((t) => t.date >= transactionState.startDate);
  }
  if (transactionState.endDate) {
    list = list.filter((t) => t.date <= transactionState.endDate);
  }

  // 6. Sorting
  list.sort((a, b) => {
    switch (transactionState.sortBy) {
      case 'date-asc':
        return new Date(a.date) - new Date(b.date);
      case 'date-desc':
        return new Date(b.date) - new Date(a.date);
      case 'amount-desc':
        return b.amount - a.amount;
      case 'amount-asc':
        return a.amount - b.amount;
      case 'title-asc':
        return a.title.localeCompare(b.title);
      default:
        return new Date(b.date) - new Date(a.date);
    }
  });

  return list;
}

/**
 * Render the Transactions Table and Pagination
 */
function renderTransactionsTable() {
  const tbody = document.getElementById('transactions-table-body');
  const paginationWrapper = document.getElementById('transactions-pagination');
  const countIndicator = document.getElementById('txn-filtered-count');
  const emptyState = document.getElementById('transactions-empty-state');
  const tableContainer = document.getElementById('transactions-table-container');

  if (!tbody) return;

  const filtered = getFilteredAndSortedTransactions();
  const settings = StorageService.getSettings();
  const totalCount = filtered.length;

  if (countIndicator) {
    countIndicator.textContent = `Showing ${totalCount} transaction${totalCount === 1 ? '' : 's'}`;
  }

  if (totalCount === 0) {
    tbody.innerHTML = '';
    if (tableContainer) tableContainer.style.display = 'none';
    if (paginationWrapper) paginationWrapper.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (tableContainer) tableContainer.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  // Pagination calculation
  const totalPages = Math.ceil(totalCount / transactionState.pageSize);
  if (transactionState.currentPage > totalPages) {
    transactionState.currentPage = Math.max(1, totalPages);
  }

  const startIndex = (transactionState.currentPage - 1) * transactionState.pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + transactionState.pageSize);

  // Build rows safely
  tbody.innerHTML = '';
  pageItems.forEach((txn) => {
    const tr = document.createElement('tr');

    const isIncome = txn.type === 'income';
    const amountClass = isIncome ? 'amount-income' : 'amount-expense';
    const amountPrefix = isIncome ? '+' : '-';
    const catColor = CATEGORY_COLORS[txn.category] || '#64748b';

    tr.innerHTML = `
      <td>
        <span class="tabular-nums" style="font-size:0.85rem; color:var(--text-secondary);">
          ${formatDate(txn.date, settings.dateFormat)}
        </span>
      </td>
      <td>
        <div style="font-weight:600; color:var(--text-primary);">${escapeHTML(txn.title)}</div>
        ${txn.notes ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${escapeHTML(txn.notes)}</div>` : ''}
      </td>
      <td>
        <span class="category-indicator">
          <span class="cat-dot" style="background-color: ${catColor};"></span>
          <span>${escapeHTML(txn.category)}</span>
        </span>
      </td>
      <td>
        <span style="font-size:0.82rem; color:var(--text-secondary);">${escapeHTML(txn.paymentMethod || 'Other')}</span>
      </td>
      <td>
        <span class="type-badge ${isIncome ? 'type-income' : 'type-expense'}">
          ${isIncome ? 'Income' : 'Expense'}
        </span>
      </td>
      <td class="text-right">
        <span class="tabular-nums ${amountClass}" style="font-size:0.95rem;">
          ${amountPrefix}${formatCurrency(txn.amount, settings.currency)}
        </span>
      </td>
      <td class="text-right">
        <div class="table-actions">
          <button class="btn-table-action edit" data-id="${txn.id}" title="Edit Transaction" aria-label="Edit">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
          </button>
          <button class="btn-table-action delete" data-id="${txn.id}" title="Delete Transaction" aria-label="Delete">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </td>
    `;

    // Action button listeners
    tr.querySelector('.btn-table-action.edit').addEventListener('click', () => openEditTransactionModal(txn.id));
    tr.querySelector('.btn-table-action.delete').addEventListener('click', () => deleteTransaction(txn.id));

    tbody.appendChild(tr);
  });

  // Render pagination controls
  renderPaginationControls(totalCount, totalPages);
}

/**
 * Render pagination numbers and previous/next buttons
 */
function renderPaginationControls(totalCount, totalPages) {
  const container = document.getElementById('transactions-pagination');
  if (!container) return;

  if (totalPages <= 1) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  const startNum = (transactionState.currentPage - 1) * transactionState.pageSize + 1;
  const endNum = Math.min(transactionState.currentPage * transactionState.pageSize, totalCount);

  let html = `
    <div class="pagination-info">
      Showing <strong>${startNum}</strong> to <strong>${endNum}</strong> of <strong>${totalCount}</strong> entries
    </div>
    <div class="pagination-controls">
      <button class="page-btn prev" ${transactionState.currentPage === 1 ? 'disabled' : ''} aria-label="Previous Page">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    // Show first, last, and window around current
    if (i === 1 || i === totalPages || (i >= transactionState.currentPage - 1 && i <= transactionState.currentPage + 1)) {
      html += `<button class="page-btn ${i === transactionState.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    } else if (i === transactionState.currentPage - 2 || i === transactionState.currentPage + 2) {
      html += `<span style="padding:0 4px; color:var(--text-muted);">&hellip;</span>`;
    }
  }

  html += `
      <button class="page-btn next" ${transactionState.currentPage === totalPages ? 'disabled' : ''} aria-label="Next Page">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </button>
    </div>
  `;

  container.innerHTML = html;

  // Bind pagination clicks
  container.querySelectorAll('.page-btn[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      transactionState.currentPage = parseInt(btn.dataset.page, 10);
      renderTransactionsTable();
    });
  });

  const prevBtn = container.querySelector('.page-btn.prev');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (transactionState.currentPage > 1) {
        transactionState.currentPage--;
        renderTransactionsTable();
      }
    });
  }

  const nextBtn = container.querySelector('.page-btn.next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (transactionState.currentPage < totalPages) {
        transactionState.currentPage++;
        renderTransactionsTable();
      }
    });
  }
}

/**
 * Export filtered transactions as RFC-4180 CSV
 */
function exportTransactionsCSV() {
  const filtered = getFilteredAndSortedTransactions();
  if (filtered.length === 0) {
    showToast('No transactions to export', 'warning');
    return;
  }

  const headers = ['Transaction ID', 'Date', 'Title', 'Type', 'Category', 'Amount', 'Payment Method', 'Notes'];
  
  const escapeCsv = (str) => {
    const val = String(str || '');
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const rows = filtered.map((t) => [
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
  a.download = `transactions_${getTodayISODate()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Exported ${filtered.length} transactions as CSV`, 'success');
}

/**
 * Validation helper
 */
function setFieldError(inputEl, message) {
  const group = inputEl.closest('.form-group');
  if (!group) return;
  group.classList.add('has-error');
  const msgEl = group.querySelector('.form-error-msg');
  if (msgEl) msgEl.textContent = message;
}

function clearFormErrors() {
  document.querySelectorAll('.form-group.has-error').forEach((g) => {
    g.classList.remove('has-error');
  });
}

/**
 * --------------------------------------------------------------------------
 * CALENDAR VIEW IMPLEMENTATION
 * --------------------------------------------------------------------------
 */

/**
 * Setup Toggle between Table View and Calendar View
 */
function setupViewModeToggle() {
  const tableBtn = document.getElementById('txn-view-table-btn');
  const calendarBtn = document.getElementById('txn-view-calendar-btn');
  const filterToolbar = document.querySelector('.filter-toolbar');
  const tableContainer = document.getElementById('transactions-table-container');
  const paginationWrapper = document.getElementById('transactions-pagination');
  const countWrapper = document.getElementById('txn-filtered-count-wrapper');
  const calendarContainer = document.getElementById('transactions-calendar-container');

  if (!tableBtn || !calendarBtn) return;

  tableBtn.addEventListener('click', () => {
    transactionState.activeViewMode = 'table';
    tableBtn.classList.add('active');
    tableBtn.setAttribute('aria-selected', 'true');
    calendarBtn.classList.remove('active');
    calendarBtn.setAttribute('aria-selected', 'false');

    if (filterToolbar) filterToolbar.style.display = 'flex';
    if (countWrapper) countWrapper.style.display = 'flex';
    if (calendarContainer) calendarContainer.style.display = 'none';

    renderTransactionsTable();
  });

  calendarBtn.addEventListener('click', () => {
    transactionState.activeViewMode = 'calendar';
    calendarBtn.classList.add('active');
    calendarBtn.setAttribute('aria-selected', 'true');
    tableBtn.classList.remove('active');
    tableBtn.setAttribute('aria-selected', 'false');

    if (filterToolbar) filterToolbar.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'none';
    if (paginationWrapper) paginationWrapper.style.display = 'none';
    if (countWrapper) countWrapper.style.display = 'none';
    const emptyState = document.getElementById('transactions-empty-state');
    if (emptyState) emptyState.style.display = 'none';

    if (calendarContainer) calendarContainer.style.display = 'block';

    renderTransactionsCalendar();
  });
}

/**
 * Setup Calendar Month Navigation Controls
 */
function setupCalendarControls() {
  const prevBtn = document.getElementById('calendar-prev-btn');
  const nextBtn = document.getElementById('calendar-next-btn');
  const todayBtn = document.getElementById('calendar-today-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      transactionState.calendarMonth--;
      if (transactionState.calendarMonth < 0) {
        transactionState.calendarMonth = 11;
        transactionState.calendarYear--;
      }
      renderTransactionsCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      transactionState.calendarMonth++;
      if (transactionState.calendarMonth > 11) {
        transactionState.calendarMonth = 0;
        transactionState.calendarYear++;
      }
      renderTransactionsCalendar();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      const now = new Date();
      transactionState.calendarYear = now.getFullYear();
      transactionState.calendarMonth = now.getMonth();
      renderTransactionsCalendar();
    });
  }
}

/**
 * Render Calendar Grid with Transactions Plotted by Date
 */
function renderTransactionsCalendar() {
  const container = document.getElementById('transactions-calendar-container');
  const grid = document.getElementById('calendar-days-grid');
  const monthTitle = document.getElementById('calendar-month-title');
  const monthIncomeEl = document.getElementById('calendar-month-income');
  const monthExpenseEl = document.getElementById('calendar-month-expense');
  const monthNetEl = document.getElementById('calendar-month-net');

  if (!container || !grid) return;

  const year = transactionState.calendarYear;
  const month = transactionState.calendarMonth;
  const settings = StorageService.getSettings();
  const todayStr = getTodayISODate();

  // Set month & year header title
  const dateObj = new Date(year, month, 1);
  const monthName = dateObj.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  if (monthTitle) monthTitle.textContent = monthName;

  const currentMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Fetch all transactions and group by date
  const appData = StorageService.getData();
  const txnsByDate = {};
  let totalMonthIncome = 0;
  let totalMonthExpense = 0;

  (appData.transactions || []).forEach((t) => {
    if (!t.date) return;
    if (!txnsByDate[t.date]) {
      txnsByDate[t.date] = [];
    }
    txnsByDate[t.date].push(t);

    if (t.date.startsWith(currentMonthKey)) {
      if (t.type === 'income') {
        totalMonthIncome += t.amount;
      } else {
        totalMonthExpense += t.amount;
      }
    }
  });

  const netMonthCashFlow = totalMonthIncome - totalMonthExpense;

  // Update Monthly Summary Stats Strip
  if (monthIncomeEl) monthIncomeEl.textContent = `+${formatCurrency(totalMonthIncome, settings.currency)}`;
  if (monthExpenseEl) monthExpenseEl.textContent = `-${formatCurrency(totalMonthExpense, settings.currency)}`;
  if (monthNetEl) {
    monthNetEl.textContent = formatCurrency(netMonthCashFlow, settings.currency);
    monthNetEl.style.color = netMonthCashFlow >= 0 ? 'var(--color-income)' : 'var(--color-expense)';
  }

  // Calculate calendar grid dates
  const startDay = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];

  // Trailing days from previous month
  for (let i = startDay - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonthIdx = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const isoDate = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    cells.push({
      dayNum,
      isoDate,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      dayNum: d,
      isoDate,
      isCurrentMonth: true
    });
  }

  // Leading days of next month to complete the row
  const remainingCells = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonthIdx = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const isoDate = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      dayNum: d,
      isoDate,
      isCurrentMonth: false
    });
  }

  // Build grid HTML
  grid.innerHTML = '';
  cells.forEach((cell) => {
    const dayTxns = txnsByDate[cell.isoDate] || [];
    const isToday = cell.isoDate === todayStr;

    let dayIncome = 0;
    let dayExpense = 0;
    dayTxns.forEach((t) => {
      if (t.type === 'income') dayIncome += t.amount;
      else dayExpense += t.amount;
    });

    const dayNet = dayIncome - dayExpense;

    const cellEl = document.createElement('div');
    cellEl.className = `calendar-day-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''}`;
    cellEl.setAttribute('role', 'button');
    cellEl.setAttribute('tabindex', '0');
    cellEl.setAttribute('aria-label', `${cell.isoDate}, ${dayTxns.length} transactions`);

    let netBadgeHtml = '';
    if (dayTxns.length > 0) {
      if (dayIncome > 0 && dayExpense === 0) {
        netBadgeHtml = `<span class="calendar-day-net income">+${formatCurrency(dayIncome, settings.currency)}</span>`;
      } else if (dayExpense > 0 && dayIncome === 0) {
        netBadgeHtml = `<span class="calendar-day-net expense">-${formatCurrency(dayExpense, settings.currency)}</span>`;
      } else {
        netBadgeHtml = `<span class="calendar-day-net ${dayNet >= 0 ? 'income' : 'expense'}">${dayNet >= 0 ? '+' : ''}${formatCurrency(dayNet, settings.currency)}</span>`;
      }
    }

    // Render up to 3 event items
    const visibleTxns = dayTxns.slice(0, 3);
    const moreCount = dayTxns.length - visibleTxns.length;

    let eventsHtml = '<div class="calendar-events-list">';
    visibleTxns.forEach((t) => {
      const isInc = t.type === 'income';
      eventsHtml += `
        <div class="calendar-event-chip ${isInc ? 'income' : 'expense'}" title="${escapeHTML(t.title)}: ${formatCurrency(t.amount, settings.currency)}">
          <span class="chip-title">${escapeHTML(t.title)}</span>
          <span class="chip-amount">${isInc ? '+' : '-'}${formatCurrency(t.amount, settings.currency)}</span>
        </div>
      `;
    });

    if (moreCount > 0) {
      eventsHtml += `<div class="calendar-more-badge">+${moreCount} more</div>`;
    }
    eventsHtml += '</div>';

    cellEl.innerHTML = `
      <div class="calendar-day-cell-header">
        <span class="calendar-day-number">${cell.dayNum}</span>
        ${netBadgeHtml}
      </div>
      ${dayTxns.length > 0 ? eventsHtml : ''}
    `;

    // Click handler to open Day Details
    cellEl.addEventListener('click', () => {
      openDayDetailsModal(cell.isoDate);
    });

    // Enter / Space key accessibility
    cellEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDayDetailsModal(cell.isoDate);
      }
    });

    grid.appendChild(cellEl);
  });
}

/**
 * Open Day Details Modal showing all transactions on a given date
 */
function openDayDetailsModal(dateStr) {
  const modal = document.getElementById('modal-day-details');
  const titleEl = document.getElementById('day-details-title');
  const dateFormattedEl = document.getElementById('day-details-formatted-date');
  const listEl = document.getElementById('day-details-list');
  const dayIncomeEl = document.getElementById('day-details-income');
  const dayExpenseEl = document.getElementById('day-details-expense');
  const dayNetEl = document.getElementById('day-details-net');
  const addBtn = document.getElementById('day-details-add-txn-btn');

  if (!modal || !listEl) return;

  const appData = StorageService.getData();
  const settings = StorageService.getSettings();
  const txns = (appData.transactions || []).filter((t) => t.date === dateStr);

  const d = new Date(dateStr + 'T00:00:00');
  const fullDateStr = d.toLocaleDateString('default', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (titleEl) titleEl.textContent = `Daily Ledger`;
  if (dateFormattedEl) dateFormattedEl.textContent = fullDateStr;

  let totalIncome = 0;
  let totalExpense = 0;
  txns.forEach((t) => {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;
  });
  const netBalance = totalIncome - totalExpense;

  if (dayIncomeEl) dayIncomeEl.textContent = `+${formatCurrency(totalIncome, settings.currency)}`;
  if (dayExpenseEl) dayExpenseEl.textContent = `-${formatCurrency(totalExpense, settings.currency)}`;
  if (dayNetEl) {
    dayNetEl.textContent = `${netBalance >= 0 ? '+' : ''}${formatCurrency(netBalance, settings.currency)}`;
    dayNetEl.style.color = netBalance >= 0 ? 'var(--color-income)' : 'var(--color-expense)';
  }

  // Populate transactions list
  if (txns.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state" style="padding: 1.5rem 0.5rem;">
        <p class="empty-state-title" style="font-size:0.95rem;">No transactions on this date</p>
        <p class="empty-state-desc" style="font-size:0.8rem;">Click below to log an income or expense for ${formatDate(dateStr, settings.dateFormat)}.</p>
      </div>
    `;
  } else {
    listEl.innerHTML = '';
    txns.forEach((txn) => {
      const isIncome = txn.type === 'income';
      const catColor = CATEGORY_COLORS[txn.category] || '#64748b';

      const row = document.createElement('div');
      row.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--border-subtle);
      `;

      row.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.65rem;">
          <span class="cat-dot" style="background-color: ${catColor}; width:10px; height:10px;"></span>
          <div>
            <div style="font-weight:600; font-size:0.9rem; color:var(--text-primary);">${escapeHTML(txn.title)}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">
              ${escapeHTML(txn.category)} · ${escapeHTML(txn.paymentMethod || 'Other')}
              ${txn.notes ? ` · <span style="font-style:italic;">${escapeHTML(txn.notes)}</span>` : ''}
            </div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span class="tabular-nums ${isIncome ? 'amount-income' : 'amount-expense'}" style="font-size:0.95rem; font-weight:700;">
            ${isIncome ? '+' : '-'}${formatCurrency(txn.amount, settings.currency)}
          </span>
          <div class="table-actions">
            <button class="btn-table-action edit" data-id="${txn.id}" title="Edit Transaction" aria-label="Edit">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
            <button class="btn-table-action delete" data-id="${txn.id}" title="Delete Transaction" aria-label="Delete">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      `;

      row.querySelector('.btn-table-action.edit').addEventListener('click', () => {
        closeModal('modal-day-details');
        openEditTransactionModal(txn.id);
      });

      row.querySelector('.btn-table-action.delete').addEventListener('click', async () => {
        await deleteTransaction(txn.id);
        // Refresh day details
        openDayDetailsModal(dateStr);
      });

      listEl.appendChild(row);
    });
  }

  // "+ Add Transaction on this Date" button
  if (addBtn) {
    addBtn.onclick = () => {
      closeModal('modal-day-details');
      openAddTransactionModal('expense', dateStr);
    };
  }

  openModal('modal-day-details');
}
