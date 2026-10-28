/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Smart Expense Tracker - Savings Goals Module
 * Goal creation, contribution tracking, progress calculation, completion milestones,
 * and goal management.
 */

let activeGoalForContribution = null;
let editingGoalId = null;

/**
 * Initialize Goals View and Handlers
 */
function initGoals() {
  const addGoalBtn = document.getElementById('btn-add-goal');
  if (addGoalBtn) {
    addGoalBtn.addEventListener('click', () => {
      openGoalModal();
    });
  }

  setupGoalModal();
  setupContributionModal();
  renderGoalsView();
}

/**
 * Render Active & Completed Savings Goals
 */
function renderGoalsView() {
  const appData = StorageService.getData();
  const settings = StorageService.getSettings();

  const activeContainer = document.getElementById('goals-active-grid');
  const completedContainer = document.getElementById('goals-completed-grid');
  const emptyState = document.getElementById('goals-empty-state');
  const activeSection = document.getElementById('goals-active-section');
  const completedSection = document.getElementById('goals-completed-section');

  if (!activeContainer || !completedContainer) return;

  const goals = appData.goals || [];
  if (goals.length === 0) {
    if (activeSection) activeSection.style.display = 'none';
    if (completedSection) completedSection.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (activeSection) activeSection.style.display = 'block';

  activeContainer.innerHTML = '';
  completedContainer.innerHTML = '';

  let activeCount = 0;
  let completedCount = 0;

  goals.forEach((goal) => {
    const isCompleted = goal.currentAmount >= goal.targetAmount;
    const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 100;
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

    // Calculate days remaining
    let daysText = 'No deadline';
    if (goal.targetDate) {
      const now = new Date();
      const target = new Date(goal.targetDate);
      const diffTime = target - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        daysText = `${Math.abs(diffDays)} days overdue`;
      } else if (diffDays === 0) {
        daysText = 'Due today!';
      } else {
        daysText = `${diffDays} days left`;
      }
    }

    const card = document.createElement('div');
    card.className = `goal-card ${isCompleted ? 'completed' : ''}`;
    card.innerHTML = `
      <div class="goal-header">
        <div>
          <div class="goal-title">${escapeHTML(goal.title)}</div>
          <div class="goal-target-date">
            Target: ${formatDate(goal.targetDate, settings.dateFormat)} · ${escapeHTML(daysText)}
          </div>
        </div>
        <div style="font-size:0.95rem; font-weight:700; color:${isCompleted ? 'var(--color-income)' : 'var(--color-primary)'};">
          ${pct}%
        </div>
      </div>

      <div class="goal-amounts-row">
        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); display:block;">Saved</span>
          <span class="goal-current-amount tabular-nums">${formatCurrency(goal.currentAmount, settings.currency)}</span>
        </div>
        <div class="text-right">
          <span style="font-size:0.75rem; color:var(--text-muted); display:block;">Target Goal</span>
          <span class="goal-target-amount tabular-nums">${formatCurrency(goal.targetAmount, settings.currency)}</span>
        </div>
      </div>

      <div class="progress-container">
        <div class="progress-bar ${isCompleted ? '' : ''}" style="width: ${pct}%; background-color:${isCompleted ? 'var(--color-income)' : 'var(--color-primary)'};"></div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; color:var(--text-muted);">
        <span>${isCompleted ? '🎉 Goal Achieved!' : `Remaining: ${formatCurrency(remaining, settings.currency)}`}</span>
        <div style="display:flex; gap:0.25rem;">
          <button class="btn-table-action edit" data-id="${goal.id}" title="Edit Goal" aria-label="Edit">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
          </button>
          <button class="btn-table-action delete" data-id="${goal.id}" title="Delete Goal" aria-label="Delete">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>

      ${!isCompleted ? `
        <div class="goal-actions">
          <button class="btn btn-secondary btn-contribute" data-id="${goal.id}" style="width:100%; font-size:0.82rem; padding:0.45rem;">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            Add Contribution
          </button>
        </div>
      ` : ''}
    `;

    // Listeners
    card.querySelector('button.edit').addEventListener('click', () => openGoalModal(goal.id));
    card.querySelector('button.delete').addEventListener('click', () => deleteGoal(goal.id));
    
    const contributeBtn = card.querySelector('.btn-contribute');
    if (contributeBtn) {
      contributeBtn.addEventListener('click', () => openContributionModal(goal.id));
    }

    if (isCompleted) {
      completedContainer.appendChild(card);
      completedCount++;
    } else {
      activeContainer.appendChild(card);
      activeCount++;
    }
  });

  if (completedSection) {
    completedSection.style.display = completedCount > 0 ? 'block' : 'none';
  }
}

/**
 * Open Goal Modal for Create / Edit
 */
function openGoalModal(goalId = null) {
  editingGoalId = goalId;
  const form = document.getElementById('goal-form');
  const titleInput = document.getElementById('goal-modal-title-input');
  const modalHeading = document.getElementById('goal-modal-heading');
  const targetAmountInput = document.getElementById('goal-target-amount');
  const currentAmountInput = document.getElementById('goal-current-amount');
  const dateInput = document.getElementById('goal-target-date');
  const notesInput = document.getElementById('goal-notes');

  if (!form) return;
  form.reset();
  clearFormErrors();

  if (goalId) {
    const appData = StorageService.getData();
    const g = (appData.goals || []).find((x) => x.id === goalId);
    if (!g) return;

    if (modalHeading) modalHeading.textContent = 'Edit Savings Goal';
    if (titleInput) titleInput.value = g.title;
    if (targetAmountInput) targetAmountInput.value = g.targetAmount;
    if (currentAmountInput) currentAmountInput.value = g.currentAmount;
    if (dateInput) dateInput.value = g.targetDate;
    if (notesInput) notesInput.value = g.notes || '';
  } else {
    if (modalHeading) modalHeading.textContent = 'Create Savings Goal';
    if (currentAmountInput) currentAmountInput.value = '0';
    if (dateInput) dateInput.value = getRelativeISODate(90); // default 3 months ahead
  }

  openModal('modal-goal');
}

/**
 * Goal Modal Form Setup
 */
function setupGoalModal() {
  const form = document.getElementById('goal-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearFormErrors();

    const titleInput = document.getElementById('goal-modal-title-input');
    const targetAmountInput = document.getElementById('goal-target-amount');
    const currentAmountInput = document.getElementById('goal-current-amount');
    const dateInput = document.getElementById('goal-target-date');
    const notesInput = document.getElementById('goal-notes');

    const title = titleInput.value.trim();
    const targetAmount = parseFloat(targetAmountInput.value);
    const currentAmount = parseFloat(currentAmountInput.value) || 0;
    const targetDate = dateInput.value;
    const notes = notesInput ? notesInput.value.trim() : '';

    let isValid = true;
    if (!title || title.length < 2) {
      setFieldError(titleInput, 'Title must be at least 2 characters');
      isValid = false;
    }

    if (isNaN(targetAmount) || targetAmount <= 0) {
      setFieldError(targetAmountInput, 'Target amount must be greater than 0');
      isValid = false;
    }

    if (currentAmount < 0) {
      setFieldError(currentAmountInput, 'Current savings cannot be negative');
      isValid = false;
    }

    if (!targetDate) {
      setFieldError(dateInput, 'Target date is required');
      isValid = false;
    }

    if (!isValid) return;

    const appData = StorageService.getData();
    if (!appData.goals) appData.goals = [];

    if (editingGoalId) {
      const idx = appData.goals.findIndex((x) => x.id === editingGoalId);
      if (idx !== -1) {
        appData.goals[idx] = {
          ...appData.goals[idx],
          title,
          targetAmount,
          currentAmount,
          targetDate,
          notes
        };
        showToast('Goal updated successfully!', 'success');
      }
    } else {
      appData.goals.push({
        id: generateId('goal'),
        title,
        targetAmount,
        currentAmount,
        targetDate,
        notes,
        createdAt: new Date().toISOString()
      });
      showToast('New savings goal created!', 'success');
    }

    StorageService.saveData(appData);
    closeModal('modal-goal');
    refreshAllApplicationViews();
  });
}

/**
 * Open Quick Contribution Modal
 */
function openContributionModal(goalId) {
  const appData = StorageService.getData();
  const goal = (appData.goals || []).find((g) => g.id === goalId);
  if (!goal) return;

  activeGoalForContribution = goal;
  const goalTitleEl = document.getElementById('contribution-goal-title');
  const amountInput = document.getElementById('contribution-amount');

  if (goalTitleEl) goalTitleEl.textContent = goal.title;
  if (amountInput) amountInput.value = '';

  clearFormErrors();
  openModal('modal-contribution');
}

/**
 * Setup Contribution Form
 */
function setupContributionModal() {
  const form = document.getElementById('contribution-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!activeGoalForContribution) return;

    const amountInput = document.getElementById('contribution-amount');
    const amount = parseFloat(amountInput.value);

    if (isNaN(amount) || amount <= 0) {
      setFieldError(amountInput, 'Please enter a valid positive contribution amount');
      return;
    }

    const appData = StorageService.getData();
    const gIndex = (appData.goals || []).findIndex((g) => g.id === activeGoalForContribution.id);
    if (gIndex === -1) return;

    appData.goals[gIndex].currentAmount = (appData.goals[gIndex].currentAmount || 0) + amount;
    StorageService.saveData(appData);

    const isNowComplete = appData.goals[gIndex].currentAmount >= appData.goals[gIndex].targetAmount;
    if (isNowComplete) {
      showToast(`🏆 Congratulations! You have achieved your goal: "${activeGoalForContribution.title}"!`, 'success', 5000);
    } else {
      showToast(`Added contribution of ${formatCurrency(amount, StorageService.getSettings().currency)}`, 'success');
    }

    closeModal('modal-contribution');
    refreshAllApplicationViews();
  });
}

/**
 * Delete a Goal with Confirmation
 */
async function deleteGoal(goalId) {
  const confirmed = await confirmDialog({
    title: 'Delete Savings Goal',
    message: 'Are you sure you want to delete this savings goal? This will not affect your past transaction records.',
    confirmText: 'Delete Goal',
    isDanger: true
  });

  if (!confirmed) return;

  const appData = StorageService.getData();
  appData.goals = (appData.goals || []).filter((g) => g.id !== goalId);
  StorageService.saveData(appData);
  showToast('Savings goal deleted', 'info');
  refreshAllApplicationViews();
}
