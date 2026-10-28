/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Smart Expense Tracker - Recurring Transactions Engine
 * Automated client-side generation upon app startup, duplicate prevention,
 * rule lifecycle management (add, edit, pause/resume, delete).
 */

let editingRecurringId = null;

/**
 * Initialize Recurring Module & Check for Due Transactions
 */
function initRecurring() {
  processDueRecurringTransactions();
  setupRecurringForm();
  renderRecurringRules();
}

/**
 * Automatic Recurring Rule Evaluator
 * Runs upon app startup to check if any recurring rules have arrived at or passed nextDate.
 */
function processDueRecurringTransactions() {
  const appData = StorageService.getData();
  const today = getTodayISODate();
  let generatedCount = 0;

  if (!Array.isArray(appData.recurring)) return;

  appData.recurring.forEach((rule) => {
    if (!rule.active) return;
    if (!rule.nextDate) return;

    // Check if nextDate is today or in the past
    if (rule.nextDate <= today) {
      // Prevent duplicate generation on same date
      if (rule.lastGenerated === rule.nextDate) {
        // Advance nextDate to future
        rule.nextDate = calculateNextOccurrenceDate(rule.nextDate, rule.frequency);
        return;
      }

      // Generate the new transaction
      const newTxn = {
        id: generateId('txn_rec'),
        title: rule.title,
        amount: rule.amount,
        type: rule.type,
        category: rule.category,
        date: rule.nextDate,
        paymentMethod: rule.paymentMethod,
        notes: `[Auto-Generated Recurring: ${rule.frequency}] ${rule.notes || ''}`.trim(),
        createdAt: new Date().toISOString()
      };

      appData.transactions.unshift(newTxn);
      rule.lastGenerated = rule.nextDate;
      rule.nextDate = calculateNextOccurrenceDate(rule.nextDate, rule.frequency);
      generatedCount++;
    }
  });

  if (generatedCount > 0) {
    StorageService.saveData(appData);
    showToast(`Processed ${generatedCount} due recurring transaction${generatedCount === 1 ? '' : 's'}!`, 'info', 4500);
  }
}

/**
 * Calculate next occurrence date given frequency
 */
function calculateNextOccurrenceDate(baseDateStr, frequency) {
  const d = new Date(baseDateStr);
  if (isNaN(d.getTime())) return getTodayISODate();

  if (frequency === 'daily') {
    d.setDate(d.getDate() + 1);
  } else if (frequency === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (frequency === 'monthly') {
    d.setMonth(d.getMonth() + 1);
  }

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Render Recurring Rules List
 */
function renderRecurringRules() {
  const container = document.getElementById('recurring-rules-list');
  const emptyState = document.getElementById('recurring-empty-state');
  const settings = StorageService.getSettings();

  if (!container) return;

  const appData = StorageService.getData();
  const rules = appData.recurring || [];

  if (rules.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  container.innerHTML = '';

  rules.forEach((rule) => {
    const isIncome = rule.type === 'income';
    const catColor = CATEGORY_COLORS[rule.category] || '#64748b';

    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '1rem';
    card.style.borderLeft = rule.active ? `4px solid ${isIncome ? 'var(--color-income)' : 'var(--color-expense)'}` : '4px solid var(--border-default)';

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.75rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span class="cat-dot" style="background-color: ${catColor};"></span>
            <span style="font-weight:700; font-size:1.05rem; color:var(--text-primary);">${escapeHTML(rule.title)}</span>
            <span class="type-badge ${isIncome ? 'type-income' : 'type-expense'}">${rule.type}</span>
            <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-muted); font-weight:600;">${escapeHTML(rule.frequency)}</span>
          </div>
          <div style="font-size:0.82rem; color:var(--text-secondary); margin-top:0.35rem;">
            Category: <strong>${escapeHTML(rule.category)}</strong> · Payment: <strong>${escapeHTML(rule.paymentMethod)}</strong>
          </div>
          ${rule.notes ? `<div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.25rem;">${escapeHTML(rule.notes)}</div>` : ''}
        </div>

        <div style="text-align:right;">
          <div class="tabular-nums ${isIncome ? 'amount-income' : 'amount-expense'}" style="font-size:1.25rem; font-weight:700;">
            ${isIncome ? '+' : '-'}${formatCurrency(rule.amount, settings.currency)}
          </div>
          <div style="font-size:0.78rem; color:${rule.active ? 'var(--color-income)' : 'var(--text-muted)'}; font-weight:600; margin-top:0.2rem;">
            ${rule.active ? `Next: ${formatDate(rule.nextDate, settings.dateFormat)}` : 'Paused'}
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--border-subtle);">
        <button class="btn btn-secondary btn-toggle-status" data-id="${rule.id}" style="font-size:0.8rem; padding:0.35rem 0.75rem;">
          ${rule.active ? 'Pause Rule' : 'Resume Rule'}
        </button>

        <div style="display:flex; gap:0.4rem;">
          <button class="btn-table-action edit" data-id="${rule.id}" title="Edit Rule" aria-label="Edit">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
          </button>
          <button class="btn-table-action delete" data-id="${rule.id}" title="Delete Rule" aria-label="Delete">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
    `;

    // Action listeners
    card.querySelector('.btn-toggle-status').addEventListener('click', () => toggleRecurringStatus(rule.id));
    card.querySelector('button.edit').addEventListener('click', () => openRecurringModal(rule.id));
    card.querySelector('button.delete').addEventListener('click', () => deleteRecurringRule(rule.id));

    container.appendChild(card);
  });
}

/**
 * Setup Recurring Rule Form Modal Handlers
 */
function setupRecurringForm() {
  const addBtn = document.getElementById('btn-add-recurring');
  const form = document.getElementById('recurring-form');
  const typeSelect = document.getElementById('rec-type');
  const categorySelect = document.getElementById('rec-category');

  if (addBtn) {
    addBtn.addEventListener('click', () => openRecurringModal());
  }

  if (typeSelect && categorySelect) {
    typeSelect.addEventListener('change', () => {
      updateRecurringCategoryDropdown(typeSelect.value);
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveRecurringRuleFromModal();
    });
  }
}

/**
 * Populate Category options for Recurring Form
 */
function updateRecurringCategoryDropdown(type, selected = '') {
  const select = document.getElementById('rec-category');
  if (!select) return;

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  select.innerHTML = '';
  categories.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    if (cat === selected) opt.selected = true;
    select.appendChild(opt);
  });
}

/**
 * Open Modal to Create / Edit Recurring Rule
 */
function openRecurringModal(ruleId = null) {
  editingRecurringId = ruleId;
  const form = document.getElementById('recurring-form');
  const modalTitle = document.getElementById('rec-modal-title');
  const titleInput = document.getElementById('rec-title');
  const amountInput = document.getElementById('rec-amount');
  const typeSelect = document.getElementById('rec-type');
  const categorySelect = document.getElementById('rec-category');
  const paymentSelect = document.getElementById('rec-payment');
  const freqSelect = document.getElementById('rec-frequency');
  const nextDateInput = document.getElementById('rec-next-date');
  const notesInput = document.getElementById('rec-notes');

  if (!form) return;
  form.reset();
  clearFormErrors();

  if (paymentSelect) {
    paymentSelect.innerHTML = '';
    PAYMENT_METHODS.forEach((pm) => {
      const opt = document.createElement('option');
      opt.value = pm;
      opt.textContent = pm;
      paymentSelect.appendChild(opt);
    });
  }

  if (ruleId) {
    const appData = StorageService.getData();
    const rule = (appData.recurring || []).find((r) => r.id === ruleId);
    if (!rule) return;

    if (modalTitle) modalTitle.textContent = 'Edit Recurring Rule';
    if (titleInput) titleInput.value = rule.title;
    if (amountInput) amountInput.value = rule.amount;
    if (typeSelect) typeSelect.value = rule.type;
    updateRecurringCategoryDropdown(rule.type, rule.category);
    if (paymentSelect) paymentSelect.value = rule.paymentMethod;
    if (freqSelect) freqSelect.value = rule.frequency;
    if (nextDateInput) nextDateInput.value = rule.nextDate;
    if (notesInput) notesInput.value = rule.notes || '';
  } else {
    if (modalTitle) modalTitle.textContent = 'Schedule Recurring Transaction';
    if (typeSelect) typeSelect.value = 'expense';
    updateRecurringCategoryDropdown('expense');
    if (nextDateInput) nextDateInput.value = getTodayISODate();
  }

  openModal('modal-recurring');
}

/**
 * Save / Update Recurring Rule
 */
function saveRecurringRuleFromModal() {
  clearFormErrors();

  const titleInput = document.getElementById('rec-title');
  const amountInput = document.getElementById('rec-amount');
  const typeSelect = document.getElementById('rec-type');
  const categorySelect = document.getElementById('rec-category');
  const paymentSelect = document.getElementById('rec-payment');
  const freqSelect = document.getElementById('rec-frequency');
  const nextDateInput = document.getElementById('rec-next-date');
  const notesInput = document.getElementById('rec-notes');

  const title = titleInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const type = typeSelect.value;
  const category = categorySelect.value;
  const paymentMethod = paymentSelect.value;
  const frequency = freqSelect.value;
  const nextDate = nextDateInput.value;
  const notes = notesInput ? notesInput.value.trim() : '';

  let isValid = true;
  if (!title || title.length < 2) {
    setFieldError(titleInput, 'Title must be at least 2 characters');
    isValid = false;
  }
  if (isNaN(amount) || amount <= 0) {
    setFieldError(amountInput, 'Please enter a positive amount');
    isValid = false;
  }
  if (!nextDate) {
    setFieldError(nextDateInput, 'Please select the next scheduled date');
    isValid = false;
  }

  if (!isValid) return;

  const appData = StorageService.getData();
  if (!appData.recurring) appData.recurring = [];

  if (editingRecurringId) {
    const idx = appData.recurring.findIndex((r) => r.id === editingRecurringId);
    if (idx !== -1) {
      appData.recurring[idx] = {
        ...appData.recurring[idx],
        title,
        amount,
        type,
        category,
        paymentMethod,
        frequency,
        nextDate,
        notes
      };
      showToast('Recurring rule updated!', 'success');
    }
  } else {
    appData.recurring.push({
      id: generateId('rec'),
      title,
      amount,
      type,
      category,
      paymentMethod,
      frequency,
      startDate: getTodayISODate(),
      nextDate,
      lastGenerated: '',
      active: true,
      notes
    });
    showToast('New recurring rule scheduled!', 'success');
  }

  StorageService.saveData(appData);
  closeModal('modal-recurring');
  renderRecurringRules();
}

/**
 * Toggle Rule active/paused state
 */
function toggleRecurringStatus(ruleId) {
  const appData = StorageService.getData();
  const rule = (appData.recurring || []).find((r) => r.id === ruleId);
  if (!rule) return;

  rule.active = !rule.active;
  StorageService.saveData(appData);
  showToast(`Recurring rule ${rule.active ? 'resumed' : 'paused'}`, 'info');
  renderRecurringRules();
}

/**
 * Delete Recurring Rule
 */
async function deleteRecurringRule(ruleId) {
  const confirmed = await confirmDialog({
    title: 'Delete Recurring Rule',
    message: 'Are you sure you want to delete this scheduled recurring rule? Past transactions generated will remain in your history.',
    confirmText: 'Delete Rule',
    isDanger: true
  });

  if (!confirmed) return;

  const appData = StorageService.getData();
  appData.recurring = (appData.recurring || []).filter((r) => r.id !== ruleId);
  StorageService.saveData(appData);
  showToast('Recurring rule deleted', 'info');
  renderRecurringRules();
}
