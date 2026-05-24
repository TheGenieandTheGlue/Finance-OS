/* ============================================
   FINANCE OS — Logic
   ============================================ */

// ============================================
// SEED DATA (your real numbers)
// ============================================

const SEED = {
  income: {
    monthly: 18000,
    biweekly: 9000,
    fundJanuary: 20000,
    fundJuly: 20000,
  },
  planned: {
    fixed: 5319,
    variable: 2031,
    youtube: 1500,
    crypto: 1000,
    room: 500,
    car: 7000,
    brazil: 650,
    emergency: 500,
  },
  catorcena: {
    fixed: 2660,
    variable: 1015,
    youtube: 750,
    crypto: 500,
    room: 250,
    car: 3500,
    brazil: 325,
    emergency: 250,
  },
  goals: [
    { id: 'emergency', name: '🚨 Emergency fund', target: 10000, current: 0, color: 'emergency', monthly: 500 },
    { id: 'car',       name: '🚗 Car down payment', target: 55000, current: 0, color: 'car', monthly: 6500 },
    { id: 'brazil',    name: '🇧🇷 Brazil trip', target: 27500, current: 0, color: 'brazil', monthly: 650 },
    { id: 'room',      name: '🛏 Room upgrades', target: 6000, current: 0, color: 'room', monthly: 500 },
  ],
  fixedSubs: [
    { name: 'Gym', amount: 1250 },
    { name: 'Phone/data', amount: 500 },
    { name: 'House food contribution', amount: 2000 },
    { name: 'Notion', amount: 480 },
    { name: 'ChatGPT', amount: 399 },
    { name: 'Canva', amount: 149 },
    { name: 'ATracker', amount: 55 },
    { name: 'iCloud', amount: 49 },
    { name: 'Netflix', amount: 139 },
    { name: 'HBO', amount: 149 },
    { name: 'Amazon Prime', amount: 99 },
    { name: 'Claude', amount: 300 },
  ],
  youtube: [
    { name: 'Channel A', subs: 0, monthlyGoal: 200 },
    { name: 'Channel B', subs: 0, monthlyGoal: 100 },
  ],
  crypto: [
    { asset: 'BTC', held: 0, avgBuy: 0, current: 0, invested: 0 },
    { asset: 'ETH', held: 0, avgBuy: 0, current: 0, invested: 0 },
    { asset: 'SOL', held: 0, avgBuy: 0, current: 0, invested: 0 },
  ],
  habits: { gym: 0, noImpulse: 0, ytWork: 0, dca: false },
  reviews: [],
  transactions: [],
};

// ============================================
// STORAGE
// ============================================

const STORAGE_KEY = 'finance-os-v1';

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { console.error(e); }
  return structuredClone(SEED);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

// ============================================
// HELPERS
// ============================================

function mxn(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

// Determine current catorcena boundaries (assumes paydays on 1st and 15th — adjustable)
function currentCatorcena() {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth();
  const year = today.getFullYear();
  let start, end;
  if (day < 15) {
    start = new Date(year, month, 1);
    end = new Date(year, month, 14);
  } else {
    start = new Date(year, month, 15);
    end = new Date(year, month + 1, 0); // last day of month
  }
  return { start, end, daysLeft: Math.max(0, Math.ceil((end - today) / 86400000)) };
}

function txnsInCurrentCatorcena() {
  const { start, end } = currentCatorcena();
  return state.transactions.filter(t => {
    const d = new Date(t.date);
    return d >= start && d <= end;
  });
}

function txnsInCurrentMonth() {
  const m = currentMonth();
  return state.transactions.filter(t => t.date.startsWith(m));
}

function sumBy(txns, predicate) {
  return txns.filter(predicate).reduce((sum, t) => sum + t.amount, 0);
}

// Category groupings
const VARIABLE_CATS = ['Food-Out', 'Transport', 'Impulse', 'Fixed-AITools'];
const FIXED_CATS = ['Fixed-Subs', 'Fixed-Gym', 'Fixed-Phone', 'Fixed-FoodHome', 'Fixed-AITools'];
const SAVINGS_CATS = ['Car-Savings', 'Brazil-Savings', 'Emergency-Savings', 'Room'];
const INVESTMENT_CATS = ['Crypto', 'YouTube'];

// ============================================
// CALCULATIONS
// ============================================

function getDashboardStats() {
  const cat = currentCatorcena();
  const catTxns = txnsInCurrentCatorcena();
  const monthTxns = txnsInCurrentMonth();

  const variableSpent = sumBy(catTxns, t => VARIABLE_CATS.includes(t.category) && t.type === 'Expense');
  const totalSpent = sumBy(catTxns, t => t.type === 'Expense' || t.type === 'Investment' || t.type === 'Transfer');
  const variableLeft = state.catorcena.variable - variableSpent;
  const safeDaily = cat.daysLeft > 0 ? variableLeft / cat.daysLeft : 0;

  const monthSaved = sumBy(monthTxns, t => SAVINGS_CATS.includes(t.category));
  const monthIncome = sumBy(monthTxns, t => t.type === 'Income') || state.income.monthly;
  const savingsRate = monthIncome > 0 ? Math.round((monthSaved / monthIncome) * 100) : 0;

  const impulses = monthTxns.filter(t => t.isImpulse).length;

  let status, statusColor;
  if (variableSpent > state.catorcena.variable) {
    status = '🔴 Overspending';
    statusColor = 'bad';
  } else if (variableSpent / state.catorcena.variable > 0.85) {
    status = '🟡 Caution';
    statusColor = 'warn';
  } else if (variableSpent / state.catorcena.variable > 0.5) {
    status = '🟢 On track';
    statusColor = 'good';
  } else {
    status = '🟢 Safe to spend';
    statusColor = 'good';
  }

  // Health score 0-100
  const savingsComp = Math.min(savingsRate / 50, 1) * 40;
  const spendComp = totalSpent <= state.income.biweekly * 0.55 ? 30 : 0;
  const impulseComp = impulses <= 3 ? 30 : Math.max(0, 30 - (impulses - 3) * 5);
  const healthScore = Math.round(savingsComp + spendComp + impulseComp);

  return {
    cat,
    catTxns,
    monthTxns,
    variableSpent,
    variableLeft,
    safeDaily,
    totalSpent,
    catRemaining: state.income.biweekly - totalSpent,
    monthSaved,
    monthIncome,
    savingsRate,
    impulses,
    status,
    statusColor,
    healthScore,
  };
}

function getGoalProgress() {
  return state.goals.map(g => {
    const contributions = sumBy(state.transactions, t => {
      if (g.id === 'car') return t.category === 'Car-Savings';
      if (g.id === 'brazil') return t.category === 'Brazil-Savings';
      if (g.id === 'emergency') return t.category === 'Emergency-Savings';
      if (g.id === 'room') return t.category === 'Room';
      return false;
    });
    const current = g.current + contributions;
    const pct = g.target > 0 ? Math.min(100, Math.round((current / g.target) * 100)) : 0;
    return { ...g, current, pct };
  });
}

function getCategoryActuals() {
  const catTxns = txnsInCurrentCatorcena();
  return {
    fixed: sumBy(catTxns, t => FIXED_CATS.includes(t.category)),
    variable: sumBy(catTxns, t => VARIABLE_CATS.includes(t.category)),
    car: sumBy(catTxns, t => t.category === 'Car-Savings'),
    brazil: sumBy(catTxns, t => t.category === 'Brazil-Savings'),
    youtube: sumBy(catTxns, t => t.category === 'YouTube'),
    crypto: sumBy(catTxns, t => t.category === 'Crypto'),
    room: sumBy(catTxns, t => t.category === 'Room'),
    emergency: sumBy(catTxns, t => t.category === 'Emergency-Savings'),
  };
}

// ============================================
// SIDEBAR RENDERER
// ============================================

function renderSidebar(activePage) {
  return `
    <aside class="sidebar">
      <div class="brand">Finance OS</div>
      <div class="brand-sub">Life Control Center</div>
      <nav>
        <div class="nav-section">Daily</div>
        <a href="index.html"        class="nav-item ${activePage==='home'?'active':''}"><span class="ico">◐</span> Home</a>
        <a href="transactions.html" class="nav-item ${activePage==='txn'?'active':''}"><span class="ico">≡</span> Transactions</a>
        <a href="catorcena.html"    class="nav-item ${activePage==='cat'?'active':''}"><span class="ico">◧</span> Catorcena</a>

        <div class="nav-section">Growth</div>
        <a href="growth.html"       class="nav-item ${activePage==='growth'?'active':''}"><span class="ico">↗</span> YouTube &amp; crypto</a>
        <a href="goals.html"        class="nav-item ${activePage==='goals'?'active':''}"><span class="ico">◉</span> Savings goals</a>

        <div class="nav-section">Reflect</div>
        <a href="review.html"       class="nav-item ${activePage==='review'?'active':''}"><span class="ico">✎</span> Weekly review</a>

        <div class="nav-section">System</div>
        <a href="settings.html"     class="nav-item ${activePage==='settings'?'active':''}"><span class="ico">⚙</span> Settings &amp; data</a>
      </nav>
    </aside>
  `;
}

// ============================================
// MODAL — QUICK ADD TRANSACTION
// ============================================

const CATEGORIES = [
  'Food-Out', 'Transport', 'Impulse',
  'Fixed-Subs', 'Fixed-Gym', 'Fixed-Phone', 'Fixed-FoodHome', 'Fixed-AITools',
  'YouTube', 'Crypto', 'Room',
  'Car-Savings', 'Brazil-Savings', 'Emergency-Savings',
  'Income-Salary', 'Income-Fund', 'Income-Other'
];

function mountAddModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.id = 'add-modal';
  modal.innerHTML = `
    <div class="modal">
      <h2>Quick add</h2>
      <div class="modal-field">
        <label>Name</label>
        <input id="m-name" type="text" placeholder="Uber to studio">
      </div>
      <div class="modal-field">
        <label>Amount (MXN)</label>
        <input id="m-amount" type="number" step="0.01" placeholder="185">
      </div>
      <div class="modal-field">
        <label>Type</label>
        <select id="m-type">
          <option>Expense</option>
          <option>Income</option>
          <option>Investment</option>
          <option>Transfer</option>
        </select>
      </div>
      <div class="modal-field">
        <label>Category</label>
        <select id="m-category">
          ${CATEGORIES.map(c => `<option>${c}</option>`).join('')}
        </select>
      </div>
      <div class="modal-field">
        <label>Date</label>
        <input id="m-date" type="date" value="${todayISO()}">
      </div>
      <div class="modal-checkbox">
        <input type="checkbox" id="m-impulse">
        <label for="m-impulse">Mark as impulse 🚨</label>
      </div>
      <div class="modal-actions">
        <button class="btn" onclick="closeAddModal()">Cancel</button>
        <button class="btn primary" onclick="submitTxn()">Add</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const fab = document.createElement('button');
  fab.className = 'btn-add';
  fab.innerHTML = '+';
  fab.onclick = openAddModal;
  fab.title = 'Quick add';
  document.body.appendChild(fab);
}

function openAddModal(prefill) {
  document.getElementById('add-modal').classList.add('open');
  if (prefill) {
    document.getElementById('m-category').value = prefill.category || 'Food-Out';
    document.getElementById('m-type').value = prefill.type || 'Expense';
    document.getElementById('m-impulse').checked = !!prefill.impulse;
  }
  setTimeout(() => document.getElementById('m-name').focus(), 50);
}

function closeAddModal() {
  document.getElementById('add-modal').classList.remove('open');
  document.getElementById('m-name').value = '';
  document.getElementById('m-amount').value = '';
  document.getElementById('m-impulse').checked = false;
}

function submitTxn() {
  const name = document.getElementById('m-name').value.trim();
  const amount = parseFloat(document.getElementById('m-amount').value);
  const type = document.getElementById('m-type').value;
  const category = document.getElementById('m-category').value;
  const date = document.getElementById('m-date').value;
  const isImpulse = document.getElementById('m-impulse').checked;

  if (!name || !amount || amount <= 0) {
    alert('Add a name and a valid amount.');
    return;
  }

  state.transactions.unshift({
    id: Date.now(),
    name, amount, type, category, date, isImpulse,
  });
  saveState();
  closeAddModal();
  location.reload();
}

// Run a "Catorcena Setup" — adds all 8 planned transfers
function runCatorcenaSetup() {
  const date = todayISO();
  const setup = [
    { name: 'Car savings transfer',     amount: state.catorcena.car,       category: 'Car-Savings',       type: 'Transfer' },
    { name: 'Brazil savings transfer',  amount: state.catorcena.brazil,    category: 'Brazil-Savings',    type: 'Transfer' },
    { name: 'Emergency fund transfer',  amount: state.catorcena.emergency, category: 'Emergency-Savings', type: 'Transfer' },
    { name: 'Crypto DCA budget',        amount: state.catorcena.crypto,    category: 'Crypto',            type: 'Investment' },
    { name: 'YouTube budget',           amount: state.catorcena.youtube,   category: 'YouTube',           type: 'Investment' },
    { name: 'Room upgrade budget',      amount: state.catorcena.room,      category: 'Room',              type: 'Transfer' },
    { name: 'Catorcena paycheck',       amount: state.income.biweekly,     category: 'Income-Salary',     type: 'Income' },
  ];
  if (!confirm('Run Catorcena Setup? This adds 7 transactions (paycheck + 6 transfers).')) return;
  setup.forEach(t => {
    state.transactions.unshift({ id: Date.now() + Math.random(), date, isImpulse: false, ...t });
  });
  saveState();
  location.reload();
}

// Add all fixed subscriptions at once (run on the 1st)
function runSubscriptionsBlock() {
  const date = todayISO();
  if (!confirm('Add all monthly fixed subscriptions? (' + state.fixedSubs.length + ' transactions)')) return;
  state.fixedSubs.forEach(s => {
    state.transactions.unshift({
      id: Date.now() + Math.random(),
      name: s.name,
      amount: s.amount,
      category: s.name === 'Gym' ? 'Fixed-Gym' : s.name.includes('Phone') ? 'Fixed-Phone' : s.name.includes('House') ? 'Fixed-FoodHome' : s.name === 'Claude' ? 'Fixed-AITools' : 'Fixed-Subs',
      type: 'Expense',
      date,
      isImpulse: false,
    });
  });
  saveState();
  location.reload();
}

// ============================================
// PILL CLASS FROM CATEGORY
// ============================================

function pillClass(cat) {
  if (cat === 'Food-Out') return 'pill-food';
  if (cat === 'Transport') return 'pill-transport';
  if (cat === 'Crypto') return 'pill-crypto';
  if (cat === 'Impulse') return 'pill-impulse';
  if (cat === 'Car-Savings') return 'pill-car';
  if (cat === 'Brazil-Savings') return 'pill-brazil';
  if (cat === 'Emergency-Savings') return 'pill-emergency';
  if (cat === 'Room') return 'pill-room';
  if (cat.startsWith('Fixed-')) return 'pill-fixed';
  if (cat.startsWith('Income-')) return 'pill-income';
  if (cat === 'YouTube') return 'pill-youtube';
  return 'pill-fixed';
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Export / import data
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finance-os-backup-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported.transactions) throw new Error('Invalid file');
      if (!confirm('Replace all current data with imported file?')) return;
      state = imported;
      saveState();
      location.reload();
    } catch (err) {
      alert('Could not import: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function resetData() {
  if (!confirm('Reset everything to seed defaults? This cannot be undone.')) return;
  if (!confirm('Really sure? All transactions will be deleted.')) return;
  state = structuredClone(SEED);
  saveState();
  location.reload();
}
