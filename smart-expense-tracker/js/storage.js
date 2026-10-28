/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Smart Expense Tracker - Storage Layer
 * LocalStorage persistence, JSON export/import, schema validation, and demo dataset.
 */

const STORAGE_KEYS = {
  DATA: 'smart_expense_tracker_data_v1',
  SETTINGS: 'smart_expense_tracker_settings_v1'
};

const DEFAULT_SETTINGS = {
  currency: 'INR',
  theme: 'light',
  dateFormat: 'DD/MM/YYYY',
  monthStartDay: 1
};

/**
 * Generate relative date strings for realistic demo data based on current date.
 */
function getRelativeISODate(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentMonthKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Pre-seeded realistic demo data tailored for BCA students & young developers.
 */
function getInitialDemoData() {
  const currentMonth = getCurrentMonthKey();
  
  return {
    transactions: [
      {
        id: 'txn_demo_01',
        title: 'Monthly Tech Internship Stipend',
        amount: 25000,
        type: 'income',
        category: 'Salary',
        date: getRelativeISODate(-2),
        paymentMethod: 'Bank Transfer',
        notes: 'Frontend developer internship stipend for the month'
      },
      {
        id: 'txn_demo_02',
        title: 'Freelance React Portfolio Project',
        amount: 12000,
        type: 'income',
        category: 'Freelance',
        date: getRelativeISODate(-10),
        paymentMethod: 'UPI',
        notes: 'Landing page client payout'
      },
      {
        id: 'txn_demo_03',
        title: 'Merit Academic Scholarship',
        amount: 8000,
        type: 'income',
        category: 'Scholarship',
        date: getRelativeISODate(-20),
        paymentMethod: 'Bank Transfer',
        notes: 'Semester 5 top rank academic award'
      },
      {
        id: 'txn_demo_04',
        title: 'Campus Cafeteria & Groceries',
        amount: 3450,
        type: 'expense',
        category: 'Food',
        date: getRelativeISODate(-1),
        paymentMethod: 'UPI',
        notes: 'Weekly meal plan & hostel snack refill'
      },
      {
        id: 'txn_demo_05',
        title: 'Metro Smart Card Recharge',
        amount: 1200,
        type: 'expense',
        category: 'Travel',
        date: getRelativeISODate(-3),
        paymentMethod: 'UPI',
        notes: 'Monthly campus commute travel pass'
      },
      {
        id: 'txn_demo_06',
        title: 'High-Speed Hostel Fiber Wi-Fi',
        amount: 999,
        type: 'expense',
        category: 'Bills',
        date: getRelativeISODate(-5),
        paymentMethod: 'Net Banking',
        notes: 'Unlimited 100Mbps coding fiber plan'
      },
      {
        id: 'txn_demo_07',
        title: 'Data Structures & Algorithms Book',
        amount: 850,
        type: 'expense',
        category: 'Education',
        date: getRelativeISODate(-7),
        paymentMethod: 'Credit Card',
        notes: 'Reference book for campus placements'
      },
      {
        id: 'txn_demo_08',
        title: 'Weekend Cinema & Team Dinner',
        amount: 1400,
        type: 'expense',
        category: 'Entertainment',
        date: getRelativeISODate(-9),
        paymentMethod: 'UPI',
        notes: 'Outing with college project teammates'
      },
      {
        id: 'txn_demo_09',
        title: 'Ergonomic Wireless Mouse & Keyboard',
        amount: 2800,
        type: 'expense',
        category: 'Shopping',
        date: getRelativeISODate(-14),
        paymentMethod: 'Debit Card',
        notes: 'Desk hardware setup for long coding sessions'
      },
      {
        id: 'txn_demo_10',
        title: 'Hostel Accommodation Shared Rent',
        amount: 6500,
        type: 'expense',
        category: 'Rent',
        date: getRelativeISODate(-18),
        paymentMethod: 'Net Banking',
        notes: 'Monthly room rent share'
      },
      {
        id: 'txn_demo_11',
        title: 'Prescription Eyewear & Health Check',
        amount: 1500,
        type: 'expense',
        category: 'Healthcare',
        date: getRelativeISODate(-22),
        paymentMethod: 'Cash',
        notes: 'Blue light eye filter glasses'
      },
      {
        id: 'txn_demo_12',
        title: 'Family Birthday Gift Received',
        amount: 3000,
        type: 'income',
        category: 'Gift',
        date: getRelativeISODate(-25),
        paymentMethod: 'UPI',
        notes: 'Gift from elder brother'
      }
    ],
    budgets: {
      [currentMonth]: {
        overallLimit: 25000,
        categories: {
          Food: 6000,
          Travel: 2500,
          Shopping: 3500,
          Education: 2500,
          Bills: 2000,
          Rent: 7000,
          Entertainment: 2500,
          Healthcare: 2000
        }
      }
    },
    goals: [
      {
        id: 'goal_01',
        title: 'M3 MacBook Air for App Dev',
        targetAmount: 95000,
        currentAmount: 52000,
        targetDate: getRelativeISODate(120),
        category: 'Tech',
        notes: 'Primary machine for Flutter and full-stack development'
      },
      {
        id: 'goal_02',
        title: 'Emergency Student Buffer Fund',
        targetAmount: 30000,
        currentAmount: 22500,
        targetDate: getRelativeISODate(60),
        category: 'Emergency',
        notes: '3-month hostel and food reserve'
      },
      {
        id: 'goal_03',
        title: 'Cloud Certification Exam Fee',
        targetAmount: 15000,
        currentAmount: 15000, // Completed Goal
        targetDate: getRelativeISODate(-5),
        category: 'Education',
        notes: 'AWS Certified Developer Associate exam fee'
      }
    ],
    recurring: [
      {
        id: 'rec_01',
        title: 'Monthly Tech Internship Stipend',
        amount: 25000,
        type: 'income',
        category: 'Salary',
        paymentMethod: 'Bank Transfer',
        frequency: 'monthly',
        startDate: getRelativeISODate(-60),
        nextDate: getRelativeISODate(28),
        lastGenerated: getRelativeISODate(-2),
        active: true,
        notes: 'Direct bank credit on 1st of month'
      },
      {
        id: 'rec_02',
        title: 'Hostel High-Speed Fiber Wi-Fi',
        amount: 999,
        type: 'expense',
        category: 'Bills',
        paymentMethod: 'Net Banking',
        frequency: 'monthly',
        startDate: getRelativeISODate(-90),
        nextDate: getRelativeISODate(25),
        lastGenerated: getRelativeISODate(-5),
        active: true,
        notes: 'Monthly billing auto-renew'
      }
    ]
  };
}

/**
 * Storage Wrapper Object with Safe Fallbacks
 */
const StorageService = {
  /**
   * Load entire application data safely.
   */
  getData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DATA);
      if (!raw) {
        const demo = getInitialDemoData();
        this.saveData(demo);
        return demo;
      }
      const parsed = JSON.parse(raw);
      // Validate schema sanity
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.transactions)) {
        console.warn('Corrupted data detected, restoring demo seed.');
        const demo = getInitialDemoData();
        this.saveData(demo);
        return demo;
      }
      return parsed;
    } catch (err) {
      console.error('LocalStorage read error:', err);
      return getInitialDemoData();
    }
  },

  /**
   * Persist application data.
   */
  saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error('LocalStorage write error:', err);
      showToast('Storage limit reached or browser blocking cookies/storage.', 'error');
      return false;
    }
  },

  /**
   * Load User Preferences / Settings.
   */
  getSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (err) {
      return { ...DEFAULT_SETTINGS };
    }
  },

  /**
   * Save User Preferences.
   */
  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (err) {
      return false;
    }
  },

  /**
   * Reset data to initial demo dataset.
   */
  resetToDemo() {
    const demo = getInitialDemoData();
    this.saveData(demo);
    return demo;
  },

  /**
   * Wipe all user data cleanly.
   */
  clearAll() {
    const empty = {
      transactions: [],
      budgets: {},
      goals: [],
      recurring: []
    };
    this.saveData(empty);
    return empty;
  },

  /**
   * Export all data as formatted JSON backup file.
   */
  exportBackup() {
    const appData = this.getData();
    const settings = this.getSettings();
    const backupObj = {
      version: '1.0.0',
      appName: 'Smart Expense Tracker',
      exportedAt: new Date().toISOString(),
      settings,
      data: appData
    };

    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart_expense_tracker_backup_${getTodayISODate()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Validate and import JSON backup file content.
   */
  importBackup(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON root format');
      }

      // Check if it's the wrapped backup or direct data object
      const incomingData = parsed.data || parsed;

      if (!Array.isArray(incomingData.transactions)) {
        throw new Error('Backup is missing transactions list');
      }

      // Sanitize transactions
      const validTransactions = incomingData.transactions.map((t) => ({
        id: String(t.id || generateId('txn')),
        title: String(t.title || 'Untitled Transaction').slice(0, 100),
        amount: Math.abs(Number(t.amount) || 0),
        type: t.type === 'income' ? 'income' : 'expense',
        category: String(t.category || 'Other'),
        date: String(t.date || getTodayISODate()),
        paymentMethod: String(t.paymentMethod || 'Other'),
        notes: String(t.notes || '').slice(0, 300)
      }));

      // Budgets sanitization
      const validBudgets = {};
      if (incomingData.budgets && typeof incomingData.budgets === 'object') {
        for (const [mKey, bVal] of Object.entries(incomingData.budgets)) {
          if (bVal && typeof bVal === 'object') {
            validBudgets[mKey] = {
              overallLimit: Number(bVal.overallLimit) || 0,
              categories: (bVal.categories && typeof bVal.categories === 'object') ? bVal.categories : {}
            };
          }
        }
      }

      // Goals sanitization
      const validGoals = Array.isArray(incomingData.goals) ? incomingData.goals.map((g) => ({
        id: String(g.id || generateId('goal')),
        title: String(g.title || 'Savings Goal').slice(0, 100),
        targetAmount: Math.abs(Number(g.targetAmount) || 1000),
        currentAmount: Math.max(0, Number(g.currentAmount) || 0),
        targetDate: String(g.targetDate || getTodayISODate()),
        category: String(g.category || 'General'),
        notes: String(g.notes || '').slice(0, 300)
      })) : [];

      // Recurring rules sanitization
      const validRecurring = Array.isArray(incomingData.recurring) ? incomingData.recurring.map((r) => ({
        id: String(r.id || generateId('rec')),
        title: String(r.title || 'Recurring Rule').slice(0, 100),
        amount: Math.abs(Number(r.amount) || 0),
        type: r.type === 'income' ? 'income' : 'expense',
        category: String(r.category || 'Other'),
        paymentMethod: String(r.paymentMethod || 'Other'),
        frequency: ['daily', 'weekly', 'monthly'].includes(r.frequency) ? r.frequency : 'monthly',
        startDate: String(r.startDate || getTodayISODate()),
        nextDate: String(r.nextDate || getTodayISODate()),
        lastGenerated: String(r.lastGenerated || ''),
        active: r.active !== false,
        notes: String(r.notes || '').slice(0, 300)
      })) : [];

      const cleanData = {
        transactions: validTransactions,
        budgets: validBudgets,
        goals: validGoals,
        recurring: validRecurring
      };

      this.saveData(cleanData);

      // Restore settings if present
      if (parsed.settings && typeof parsed.settings === 'object') {
        this.saveSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
      }

      return { success: true, count: validTransactions.length };
    } catch (err) {
      console.error('Import validation failed:', err);
      return { success: false, error: err.message };
    }
  }
};
