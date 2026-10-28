# Smart Expense Tracker

> A modern, responsive, and privacy-focused personal finance management web application designed for students and professionals to track income, expenses, budgets, savings goals, and financial analytics with pure client-side persistence.

![Smart Expense Tracker Banner](https://via.placeholder.com/1200x600/0f172a/ffffff?text=Smart+Expense+Tracker+-+Personal+Finance+Dashboard)

---

## 📌 Project Overview

**Smart Expense Tracker** is a full-featured, zero-dependency personal finance management system. Built entirely with **HTML5, CSS3, Vanilla JavaScript**, and **Chart.js**, this application enables users to budget effectively, monitor cash flow, track long-term savings goals, and analyze spending habits without requiring any backend server or paid third-party APIs.

All financial information is stored client-side in the browser's `localStorage`, providing privacy, offline capability, and instant sub-millisecond response times.

---

## ✨ Key Features

### 1. Executive Financial Dashboard
- **Real-Time Financial Health Metrics**: Total cumulative income, total expenses, net liquid balance, savings goal deposits, and monthly budget utilization.
- **Budget Threshold Alert Banner**: Automated warning banners that trigger when total monthly spending crosses **80%** (amber warning) or **100%** (critical red alert).
- **Interactive Chart.js Visualizations**:
  - **Cash Flow Comparison**: Past 6-month side-by-side bar chart of income vs. expenses.
  - **Category Spending Doughnut**: Dynamic distribution of current month's spending with interactive hover percentages.
  - **Spending Trajectory Trend**: Curved area line chart tracking monthly expense velocity.
- **Recent Transactions Feed**: Scannable list of the latest transactions with relative timestamps (*"Today"*, *"Yesterday"*) and category color tags.
- **Quick Action Triggers**: Accessible `+ Income` and `+ Expense` buttons in the top header.

### 2. Full-Featured Transaction Ledger
- **Complete CRUD Operations**: Create, Read, Update, and Delete transactions with friendly modal interfaces.
- **Dual Flow Architecture**: Dedicated categories for income (*Salary, Freelance, Scholarship, Business, Gift, Other*) and expenses (*Food, Travel, Shopping, Education, Bills, Healthcare, Entertainment, Rent, Other*).
- **Payment Method Tagging**: Track transactions by *UPI, Cash, Credit Card, Debit Card, Net Banking*, and *Bank Transfer*.
- **Comprehensive Search & Multi-Filter Engine**:
  - Instant debounced text search across titles and notes.
  - Filter simultaneously by type, category, payment method, and custom date range.
  - Clear all filters with a single click.
- **Flexible Sorting**: Sort transactions by newest first, oldest first, highest amount, lowest amount, or alphabetically.
- **Dual View Modes (Table & Calendar)**: Smooth segmented view switcher to switch between the data grid and an interactive monthly visual calendar.
- **Interactive Calendar Grid**:
  - Plots all income and expense records on their respective calendar dates.
  - Previous / Next month navigation with instant "Today" reset and live monthly cash flow totals.
  - Daily net summaries and colored event chips.
  - Interactive day clicks that open a dedicated **Daily Ledger Modal** with quick transaction logging on that date.
- **RFC-4180 CSV Export**: One-click download of filtered or full transaction records formatted with proper CSV escaping.

### 3. Monthly Budget Management
- **Monthly Scoping**: Select any calendar month to view or set budget targets without affecting past data.
- **Overall & Category Spending Caps**: Configure an overall monthly limit as well as granular category-specific allowances.
- **Three-Tier Visual Progress Bars**:
  - 🟢 **Normal (< 80%)**: Safe spending trajectory.
  - 🟡 **Warning (80% – 99%)**: Approaching maximum threshold.
  - 🔴 **Danger (≥ 100%)**: Budget exceeded with dynamic calculation of overspent amounts.
- **Non-Destructive Resets**: Option to clear budget targets for a specific month while preserving transaction history.

### 4. Savings Goals & Milestones
- **Goal Tracking**: Set target amounts, deadlines, and categories (e.g., *M3 MacBook Fund, Emergency Buffer, Cloud Certification*).
- **Quick Contribution Dialog**: Easily deposit funds toward a goal with instant progress calculation.
- **Deadline Countdown**: Automatic computation of remaining days (*"45 days left"* or *"Due today!"*).
- **Milestone Celebration**: Completed goals (100% target reached) automatically move to a dedicated *"Achieved Milestones"* section.

### 5. Financial Reports & Analytics
- **Flexible Period Filters**: Filter statements by *This Month, Last Month, Year-to-Date (YTD), All Time*, or *Custom Date Range*.
- **Key Financial Ratios**:
  - Net Savings Rate (`((Income - Expenses) / Income) * 100`).
  - Average Daily Expense across the selected timeframe.
  - Identification of the highest spending category and its percentage share.
- **Category Breakdown Table**: Detailed ledger showing category weights, total spent, and share percentages.
- **Print-Friendly Statement View**: Custom `@media print` CSS formats clean, publication-ready financial statements, hiding navigation bars, toolbars, and buttons.

### 6. Automated Recurring Rules
- **Rule Scheduler**: Configure recurring stipends, rent, Wi-Fi bills, and subscriptions (Daily, Weekly, Monthly).
- **Client-Side Startup Processor**: Automatically evaluates rules when the browser tab opens, recording any due transactions up to the present date.
- **Duplicate Prevention**: State-tracking algorithms prevent duplicate generation for the same recurring cycle.
- **Rule Management**: Pause, resume, edit, or delete scheduled rules at will.

### 7. Customization & Data Portability
- **Light & Dark Theme Engine**: High-contrast, accessibility-tested dark mode with system preference auto-detection.
- **Multi-Currency Support**: Switch between **INR (₹)**, **USD ($)**, **EUR (€)**, and **GBP (£)** with instant site-wide recalculation.
- **Date Format Options**: Support for `DD/MM/YYYY`, `MM/DD/YYYY`, and `YYYY-MM-DD`.
- **JSON Backup & Restore**: Export complete database backups and restore them on any computer with schema validation.
- **Sample Demo Dataset**: One-click button to load realistic student/developer sample data for presentations and portfolio showcases.

---

## 🛠️ Technologies Used

| Technology | Purpose |
| :--- | :--- |
| **HTML5** | Semantic structure, accessible ARIA dialogs, and forms |
| **CSS3** | Custom design system, CSS variables for theming, responsive grid/flexbox, and print styles |
| **Vanilla JavaScript (ES6+)** | Pure client-side logic, event delegation, and modular architecture |
| **Chart.js (v4.4.2)** | Interactive canvas-based data visualizations via CDN |
| **Browser LocalStorage** | Zero-latency, persistent client-side data store |

---

## 📁 Project Folder Structure

```
smart-expense-tracker/
│
├── index.html              # Main application entry point & semantic markup
│
├── css/
│   └── style.css           # Complete stylesheet, themes, layout, and print styles
│
├── js/
│   ├── app.js              # View routing, navigation drawer, and application orchestrator
│   ├── storage.js          # LocalStorage layer, schema validation, demo dataset, & JSON backup
│   ├── transactions.js     # Transaction CRUD, multi-filter engine, pagination, and CSV export
│   ├── dashboard.js        # Executive metrics, budget warnings, and Chart.js dashboards
│   ├── budgets.js          # Monthly budget manager, category caps, and progress calculation
│   ├── goals.js            # Savings goals, quick contribution modal, and milestone tracking
│   ├── reports.js          # Period analytics, daily spending averages, and print formatting
│   ├── recurring.js        # Automated client-side recurring engine and duplicate prevention
│   ├── settings.js         # Theme toggles, currency selection, and backup restore
│   └── utils.js            # Currency/date formatters, XSS sanitization, modals, and toasts
│
├── assets/
│   └── favicon.svg         # Modern financial emblem favicon
│
├── README.md               # Complete project documentation & setup guide
├── .gitignore              # Git ignore configuration
└── LICENSE                 # MIT License
```

---

## 🚀 Running the Project Locally

No Node.js, npm, or backend server is required. You can run this project on any system using a simple web browser.

### Option A: Using VS Code Live Server (Recommended)
1. Open **Visual Studio Code**.
2. Install the **Live Server** extension by *Ritwick Dey* (search in Extensions `Ctrl+Shift+X`).
3. Clone or open the `smart-expense-tracker` folder in VS Code.
4. Right-click on `index.html` and select **"Open with Live Server"**.
5. Your default browser will launch at `http://127.0.0.1:5500/index.html`.

### Option B: Using Python's Built-in HTTP Server
If you have Python installed, open your terminal inside the project directory:
```bash
# Python 3.x
python3 -m http.server 8000
```
Then navigate to `http://localhost:8000` in your web browser.

### Option C: Direct File Opening
Double-click `index.html` to open it directly in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari. *(Note: An active internet connection is recommended on first load to fetch Chart.js from the CDN).*

---

## 🌐 Deploying to GitHub Pages (Free Hosting)

Publish your project online in under 3 minutes:

1. Create a new repository on [GitHub](https://github.com/) named `smart-expense-tracker`.
2. Push your project files to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial release of Smart Expense Tracker"
   git branch -M main
   git remote add origin https://github.com/<your-username>/smart-expense-tracker.git
   git push -u origin main
   ```
3. In your GitHub repository, go to **Settings** > **Pages** (in the left sidebar).
4. Under **Source**, select **Deploy from a branch**.
5. Choose branch **main** and folder **/(root)**, then click **Save**.
6. After ~1 minute, GitHub Pages will provide your live URL:
   `https://<your-username>.github.io/smart-expense-tracker/`

---

## 🧪 Testing & Verification Checklist

- [x] **Dashboard Metrics**: Accurately sums income, expenses, liquid balance, and goal savings.
- [x] **Add/Edit Transactions**: Form validates required title, positive amounts, valid dates, and dynamic categories.
- [x] **Transaction Ledger**: Search works in real-time; multi-filters combine correctly; pagination slices data cleanly.
- [x] **Budget Warnings**: Triggers amber banner at $\ge 80\%$ and red banner at $\ge 100\%$ of monthly limits.
- [x] **Savings Goals**: Contributions increase balance; 100% completion automatically shifts card to completed section.
- [x] **Reports & Print**: Analytics recalculate across presets; `@media print` generates clean paper/PDF statements.
- [x] **Recurring Engine**: Advances dates properly; prevents duplicate record creation.
- [x] **Data Integrity**: JSON backups export cleanly; import validates schemas; demo data resets with confirmation.
- [x] **Security**: All text is sanitized via `escapeHTML` / DOM text nodes to prevent XSS.

---

## 🔒 Security & Data Privacy

- **Client-Side Only**: Your financial data never leaves your browser. No third-party analytics, tracking pixels, or external servers are contacted.
- **Untrusted Input Handling**: All user-entered titles, notes, and values are treated as untrusted and safely escaped to prevent cross-site scripting (XSS).
- **LocalStorage Notice**: `localStorage` is unencrypted browser storage. It is suitable for personal budgeting and portfolio demonstrations, but should not be used on shared public kiosks without clearing data upon exit.

---

## 🔮 Future Enhancements

- [ ] Receipt image attachment and local image storage via IndexedDB.
- [ ] Export reports directly to formatted PDF files using `jsPDF`.
- [ ] Split-expense calculator for shared student hostel/roommate bills.
- [ ] Multi-wallet support (separate personal, cash, and bank accounts).

---

## 📄 License

This project is open-source and distributed under the **MIT License**. See [LICENSE](LICENSE) for details.

Developed with ❤️ as a portfolio-ready BCA Capstone Project.
