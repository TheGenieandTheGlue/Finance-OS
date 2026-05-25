/* ============================================
   FINANCE OS — Logic v2
   ============================================ */

// ============================================
// SEED DATA
// ============================================

const SEED = {
  income: {
    monthly: 18000,
    biweekly: 9000,
    fundJanuary: 20000,
    fundJuly: 20000,
    // Date of any known payday — system calculates current period from this anchor (every 14 days)
    paydayAnchor: '2026-05-22',
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
  // Goals are now fully editable; users can add/remove/change
  goals: [
    { id: 'g1', name: '⭐ Plus fund',         target: 10000, color: 'emergency', monthly: 500,  biweeklyAmount: 250,  category: 'Plus-Fund' },
    { id: 'g2', name: '🚗 Car down payment',  target: 55000, color: 'car',       monthly: 6500, biweeklyAmount: 3500, category: 'Car-Savings' },
    { id: 'g3', name: '🇧🇷 Brazil trip',       target: 27500, color: 'brazil',    monthly: 650,  biweeklyAmount: 325,  category: 'Brazil-Savings' },
    { id: 'g4', name: '🛏 Room upgrades',     target: 6000,  color: 'room',      monthly: 500,  biweeklyAmount: 250,  category: 'Room' },
  ],
  fixedSubs: [
    { name: 'Gym', amount: 1250, category: 'Fixed-Gym' },
    { name: 'Phone/data', amount: 500, category: 'Fixed-Phone' },
    { name: 'House food contribution', amount: 2000, category: 'Fixed-FoodHome' },
    { name: 'Notion', amount: 480, category: 'Fixed-Subs' },
    { name: 'ChatGPT', amount: 399, category: 'Fixed-AITools' },
    { name: 'Canva', amount: 149, category: 'Fixed-Subs' },
    { name: 'ATracker', amount: 55, category: 'Fixed-Subs' },
    { name: 'iCloud', amount: 49, category: 'Fixed-Subs' },
    { name: 'Netflix', amount: 139, category: 'Fixed-Subs' },
    { name: 'HBO', amount: 149, category: 'Fixed-Subs' },
    { name: 'Amazon Prime', amount: 99, category: 'Fixed-Subs' },
    { name: 'Claude', amount: 300, category: 'Fixed-AITools' },
  ],
  // YouTube — fully editable channels with revenue tracking and time logging
  youtube: {
    channels: [
      { id: 'c1', name: 'Channel 1', subs: 0, monthlyGoal: 100, revenue: 0 },
      { id: 'c2', name: 'Channel 2', subs: 0, monthlyGoal: 100, revenue: 0 },
      { id: 'c3', name: 'Channel 3', subs: 0, monthlyGoal: 100, revenue: 0 },
      { id: 'c4', name: 'Channel 4', subs: 0, monthlyGoal: 100, revenue: 0 },
      { id: 'c5', name: 'Channel 5', subs: 0, monthlyGoal: 100, revenue: 0 },
      { id: 'c6', name: 'Channel 6', subs: 0, monthlyGoal: 100, revenue: 0 },
    ],
    // Pipeline counts per channel
    pipeline: {}, // { channelId: { ideas: 0, progress: 0, done: 0 } }
    // Time sessions logged per channel
    sessions: [], // { id, channelId, date, minutes, note }
  },
  // Crypto — track each transaction (buy/sell/deposit/withdraw)
  crypto: {
    assets: [
      { id: 'a1', symbol: 'BTC', name: 'Bitcoin',  currentPrice: 0, currentPriceUsd: 0, autoPrice: true },
      { id: 'a2', symbol: 'ETH', name: 'Ethereum', currentPrice: 0, currentPriceUsd: 0, autoPrice: true },
      { id: 'a3', symbol: 'SOL', name: 'Solana',   currentPrice: 0, currentPriceUsd: 0, autoPrice: true },
    ],
    movements: [], // { id, date, type: 'deposit'|'withdraw'|'buy'|'sell', asset?, amountMXN, qty?, note }
    usdMxnRate: 17, // fallback, updated via API
    lastPriceUpdate: null,
  },
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
    if (stored) {
      const s = JSON.parse(stored);
      // Migrate old structures
      if (Array.isArray(s.youtube)) {
        s.youtube = { channels: s.youtube, pipeline: {}, sessions: [] };
      }
      if (Array.isArray(s.crypto)) {
        s.crypto = { assets: s.crypto.map((c, i) => ({ id: 'a'+(i+1), symbol: c.asset, name: c.asset, currentPrice: c.current || 0, autoPrice: true })), movements: [], lastPriceUpdate: null };
      }
      if (s.goals && s.goals.length > 0) {
        if (!s.goals[0].category) {
          s.goals = SEED.goals;
        }
        // Migrate: ensure every goal has biweeklyAmount
        s.goals.forEach(g => {
          if (g.biweeklyAmount === undefined || g.biweeklyAmount === null || isNaN(g.biweeklyAmount)) {
            g.biweeklyAmount = Math.round((g.monthly || 0) / 2);
          }
        });
      }
      // Ensure income.paydayAnchor exists
      if (!s.income.paydayAnchor) {
        s.income.paydayAnchor = SEED.income.paydayAnchor;
      }
      // Ensure pipeline object exists for all channels + fix missing revenue
      if (s.youtube && s.youtube.channels) {
        s.youtube.channels.forEach(c => {
          if (!s.youtube.pipeline[c.id]) s.youtube.pipeline[c.id] = { ideas: 0, progress: 0, done: 0 };
          if (typeof c.revenue !== 'number' || isNaN(c.revenue)) c.revenue = 0;
          if (typeof c.subs !== 'number' || isNaN(c.subs)) c.subs = 0;
          if (typeof c.monthlyGoal !== 'number' || isNaN(c.monthlyGoal)) c.monthlyGoal = 100;
        });
      }
      return s;
    }
  } catch (e) { console.error(e); }
  return structuredClone(SEED);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

// Ensure pipeline objects exist
state.youtube.channels.forEach(c => {
  if (!state.youtube.pipeline[c.id]) state.youtube.pipeline[c.id] = { ideas: 0, progress: 0, done: 0 };
});

// ============================================
// HELPERS
// ============================================

function mxn(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function mxnFull(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function currentCatorcena() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Anchor date from settings
  const anchorStr = (state.income && state.income.paydayAnchor) || '2026-05-22';
  const anchor = new Date(anchorStr + 'T00:00:00');

  // How many days from anchor to today
  const diffMs = today - anchor;
  const diffDays = Math.floor(diffMs / 86400000);

  // Which catorcena number we're in (can be negative if today < anchor)
  const catNum = Math.floor(diffDays / 14);

  // Start = anchor + (catNum * 14 days). End = start + 13 days.
  const start = new Date(anchor);
  start.setDate(anchor.getDate() + (catNum * 14));
  const end = new Date(start);
  end.setDate(start.getDate() + 13);
  end.setHours(23, 59, 59);

  const todayEod = new Date(today);
  todayEod.setHours(23, 59, 59);

  const daysLeft = Math.max(0, Math.ceil((end - todayEod) / 86400000) + 1);
  const daysElapsed = Math.max(1, Math.floor((todayEod - start) / 86400000) + 1);

  return {
    start, end,
    daysLeft,
    daysElapsed,
    totalDays: 14,
    nextPayday: new Date(end.getTime() + 86400000), // day after end
  };
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

const VARIABLE_CATS = ['Food-Out', 'Transport', 'Impulse', 'Skincare', 'Amazon', 'YouTube-Spend'];
const FIXED_CATS = ['Fixed-Subs', 'Fixed-Gym', 'Fixed-Phone', 'Fixed-FoodHome', 'Fixed-AITools'];

function savingsCategories() {
  return state.goals.map(g => g.category);
}

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

  // Smart safe-daily: remaining budget / remaining days (rolls over automatically)
  // If you didn't spend yesterday, today's allowance grows because the same budget is split across fewer days
  const safeDaily = cat.daysLeft > 0 ? variableLeft / cat.daysLeft : variableLeft;

  // Also calc "today's quota" = daily allowance for today specifically
  const todayQuota = state.catorcena.variable / cat.totalDays;
  const expectedSpendByNow = todayQuota * cat.daysElapsed;
  const aheadOrBehind = expectedSpendByNow - variableSpent; // positive = ahead (saving), negative = behind (overspending)

  const sCats = savingsCategories();
  const monthSaved = sumBy(monthTxns, t => sCats.includes(t.category));
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

  const savingsComp = Math.min(savingsRate / 50, 1) * 40;
  const spendComp = totalSpent <= state.income.biweekly * 0.55 ? 30 : 0;
  const impulseComp = impulses <= 3 ? 30 : Math.max(0, 30 - (impulses - 3) * 5);
  const healthScore = Math.round(savingsComp + spendComp + impulseComp);

  return {
    cat, catTxns, monthTxns,
    variableSpent, variableLeft, safeDaily, todayQuota, aheadOrBehind,
    totalSpent,
    catRemaining: state.income.biweekly - totalSpent,
    monthSaved, monthIncome, savingsRate, impulses,
    status, statusColor, healthScore,
  };
}

function getGoalProgress() {
  return state.goals.map(g => {
    const contributions = sumBy(state.transactions, t => t.category === g.category);
    const current = contributions;
    const pct = g.target > 0 ? Math.min(100, Math.round((current / g.target) * 100)) : 0;
    return { ...g, current, pct };
  });
}

function getCategoryActuals() {
  const catTxns = txnsInCurrentCatorcena();
  const actuals = {
    fixed: sumBy(catTxns, t => FIXED_CATS.includes(t.category)),
    variable: sumBy(catTxns, t => VARIABLE_CATS.includes(t.category)),
    youtube: sumBy(catTxns, t => t.category === 'YouTube-Spend'),
    crypto: sumBy(catTxns, t => t.category === 'Crypto'),
  };
  // Add a value for each goal's category
  state.goals.forEach(g => {
    actuals[g.id] = sumBy(catTxns, t => t.category === g.category);
  });
  return actuals;
}

// ============================================
// CRYPTO CALCULATIONS — track P&L cleanly
// ============================================

function getCryptoStats() {
  // Aggregate movements per asset
  const byAsset = {};
  state.crypto.assets.forEach(a => {
    byAsset[a.id] = {
      asset: a,
      qty: 0,
      invested: 0, // total MXN spent on buys
      withdrawn: 0, // total MXN sold/withdrawn
      realizedPL: 0, // confirmed P&L from sales
    };
  });

  // Track total cash in/out of exchange (not asset-specific)
  let totalDeposited = 0;
  let totalWithdrawn = 0;

  state.crypto.movements.forEach(m => {
    if (m.type === 'deposit') {
      totalDeposited += m.amountMXN;
    } else if (m.type === 'withdraw') {
      totalWithdrawn += m.amountMXN;
    } else if (m.type === 'buy' && m.assetId) {
      const a = byAsset[m.assetId];
      if (a) {
        a.qty += m.qty || 0;
        a.invested += m.amountMXN;
      }
    } else if (m.type === 'sell' && m.assetId) {
      const a = byAsset[m.assetId];
      if (a) {
        const sellQty = m.qty || 0;
        const avgCost = a.qty > 0 ? a.invested / a.qty : 0;
        const costBasis = avgCost * sellQty;
        a.realizedPL += m.amountMXN - costBasis;
        a.qty -= sellQty;
        a.invested -= costBasis; // reduce cost basis proportionally
      }
    }
  });

  // Calculate current values
  let totalCurrentValue = 0;
  let totalInvestedNow = 0;
  let totalRealizedPL = 0;
  const assets = state.crypto.assets.map(a => {
    const b = byAsset[a.id];
    const currentValue = b.qty * a.currentPrice;
    const unrealizedPL = currentValue - b.invested;
    totalCurrentValue += currentValue;
    totalInvestedNow += b.invested;
    totalRealizedPL += b.realizedPL;
    return {
      ...a,
      qty: b.qty,
      invested: b.invested,
      currentValue,
      unrealizedPL,
      unrealizedPct: b.invested > 0 ? Math.round((unrealizedPL / b.invested) * 100) : 0,
      realizedPL: b.realizedPL,
      avgCost: b.qty > 0 ? b.invested / b.qty : 0,
    };
  });

  // Net "true P&L": what you've put in vs (current value + what you've taken out)
  const netCashIn = totalDeposited - totalWithdrawn;
  const totalReturn = (totalCurrentValue + totalWithdrawn) - totalDeposited;
  const totalReturnPct = totalDeposited > 0 ? Math.round((totalReturn / totalDeposited) * 100) : 0;

  return {
    assets,
    totalDeposited,
    totalWithdrawn,
    netCashIn,
    totalCurrentValue,
    totalInvestedNow,
    totalRealizedPL,
    unrealizedPL: totalCurrentValue - totalInvestedNow,
    totalReturn, // most honest single number
    totalReturnPct,
  };
}

// ============================================
// YOUTUBE STATS
// ============================================

function getYouTubeStats() {
  const channels = state.youtube.channels.map(c => {
    const sessions = state.youtube.sessions.filter(s => s.channelId === c.id);
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.minutes || 0), 0);
    const pipeline = state.youtube.pipeline[c.id] || { ideas: 0, progress: 0, done: 0 };
    const safeRevenue = (typeof c.revenue === 'number' && !isNaN(c.revenue)) ? c.revenue : 0;
    const revPerHour = totalMinutes > 0 ? (safeRevenue / (totalMinutes / 60)) : 0;
    const revPerVideo = pipeline.done > 0 ? safeRevenue / pipeline.done : 0;
    return { ...c, revenue: safeRevenue, totalMinutes, pipeline, revPerHour, revPerVideo };
  });
  const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0);
  const totalMinutes = channels.reduce((s, c) => s + c.totalMinutes, 0);
  const totalDone = channels.reduce((s, c) => s + c.pipeline.done, 0);
  return { channels, totalRevenue, totalMinutes, totalDone };
}

// ============================================
// COINGECKO PRICE FETCH
// ============================================

const COINGECKO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ADA: 'cardano',
  XRP: 'ripple',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  DOT: 'polkadot',
  LINK: 'chainlink',
  USDC: 'usd-coin',
  USDT: 'tether',
  BNB: 'binancecoin',
  LTC: 'litecoin',
  TRX: 'tron',
  SHIB: 'shiba-inu',
};

async function fetchCryptoPrices() {
  const assetsToUpdate = state.crypto.assets.filter(a => a.autoPrice && COINGECKO_IDS[a.symbol]);
  if (assetsToUpdate.length === 0) return { updated: 0, errors: 0 };

  const ids = assetsToUpdate.map(a => COINGECKO_IDS[a.symbol]).join(',');
  try {
    // Get both MXN and USD prices in one call
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=mxn,usd`);
    if (!res.ok) throw new Error('CoinGecko returned ' + res.status);
    const data = await res.json();
    let updated = 0;
    let usdMxnRate = null;
    assetsToUpdate.forEach(a => {
      const cgId = COINGECKO_IDS[a.symbol];
      if (data[cgId]) {
        const asset = state.crypto.assets.find(x => x.id === a.id);
        if (data[cgId].mxn) asset.currentPrice = data[cgId].mxn;
        if (data[cgId].usd) asset.currentPriceUsd = data[cgId].usd;
        // Derive USD/MXN exchange rate
        if (data[cgId].mxn && data[cgId].usd && data[cgId].usd > 0) {
          usdMxnRate = data[cgId].mxn / data[cgId].usd;
        }
        updated++;
      }
    });
    if (usdMxnRate) state.crypto.usdMxnRate = usdMxnRate;
    state.crypto.lastPriceUpdate = new Date().toISOString();
    saveState();
    return { updated, errors: 0 };
  } catch (err) {
    console.error('Price fetch error:', err);
    return { updated: 0, errors: 1, message: err.message };
  }
}

// ============================================
// SIDEBAR
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
        <a href="youtube.html"      class="nav-item ${activePage==='yt'?'active':''}"><span class="ico">▶</span> YouTube</a>
        <a href="crypto.html"       class="nav-item ${activePage==='cr'?'active':''}"><span class="ico">◆</span> Crypto</a>
        <a href="goals.html"        class="nav-item ${activePage==='goals'?'active':''}"><span class="ico">◉</span> Savings goals</a>

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
  'Food-Out', 'Transport', 'Impulse', 'Skincare', 'Amazon', 'YouTube-Spend',
  'Fixed-Subs', 'Fixed-Gym', 'Fixed-Phone', 'Fixed-FoodHome', 'Fixed-AITools',
  'Crypto',
  ...state.goals.map(g => g.category),
  'Income-Salary', 'Income-Fund', 'Income-YouTube', 'Income-Other'
];

function mountAddModal() {
  if (document.getElementById('add-modal')) return;
  const modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.id = 'add-modal';
  modal.innerHTML = `
    <div class="modal">
      <h2>Quick add</h2>
      <div class="modal-field">
        <label>Name</label>
        <input id="m-name" type="text" placeholder="e.g., Uber to studio">
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
          ${[...new Set(CATEGORIES)].map(c => `<option>${c}</option>`).join('')}
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
  fab.onclick = () => openAddModal();
  fab.title = 'Quick add';
  document.body.appendChild(fab);
}

function openAddModal(prefill) {
  document.getElementById('add-modal').classList.add('open');
  if (prefill) {
    if (prefill.category) document.getElementById('m-category').value = prefill.category;
    if (prefill.type) document.getElementById('m-type').value = prefill.type;
    if (prefill.impulse !== undefined) document.getElementById('m-impulse').checked = !!prefill.impulse;
    if (prefill.name) document.getElementById('m-name').value = prefill.name;
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

function runCatorcenaSetup() {
  const date = todayISO();
  const setup = [
    { name: 'Catorcena paycheck', amount: state.income.biweekly, category: 'Income-Salary', type: 'Income' },
    ...state.goals.map(g => ({
      name: g.name + ' transfer',
      amount: g.biweeklyAmount || 0,
      category: g.category,
      type: 'Transfer'
    })).filter(t => t.amount > 0),
    { name: 'Crypto DCA budget', amount: state.catorcena.crypto, category: 'Crypto', type: 'Investment' },
    { name: 'YouTube budget', amount: state.catorcena.youtube, category: 'YouTube-Spend', type: 'Investment' },
  ];
  if (!confirm('Run Catorcena Setup? This adds ' + setup.length + ' transactions (paycheck + all transfers).')) return;
  setup.forEach(t => {
    state.transactions.unshift({ id: Date.now() + Math.random(), date, isImpulse: false, ...t });
  });
  saveState();
  location.reload();
}

function runSubscriptionsBlock() {
  const date = todayISO();
  if (!confirm('Add all monthly fixed subscriptions? (' + state.fixedSubs.length + ' transactions)')) return;
  state.fixedSubs.forEach(s => {
    state.transactions.unshift({
      id: Date.now() + Math.random(),
      name: s.name,
      amount: s.amount,
      category: s.category,
      type: 'Expense',
      date,
      isImpulse: false,
    });
  });
  saveState();
  location.reload();
}

// ============================================
// QUICK ENTRY (pre-configured buttons)
// ============================================

const QUICK_ENTRIES = [
  { label: '☕ Comida fuera',  cat: 'Food-Out',     type: 'Expense' },
  { label: '🚗 Uber',          cat: 'Transport',    type: 'Expense' },
  { label: '📦 Amazon',        cat: 'Amazon',       type: 'Expense' },
  { label: '💆 Skincare',      cat: 'Skincare',     type: 'Expense' },
  { label: '🎬 YT gasto',      cat: 'YouTube-Spend',type: 'Expense' },
  { label: '🚨 Impulso',       cat: 'Impulse',      type: 'Expense', impulse: true },
  { label: '💵 Income extra',  cat: 'Income-Other', type: 'Income' },
  { label: '💼 YT income',     cat: 'Income-YouTube',type: 'Income' },
];

function renderQuickEntries() {
  return QUICK_ENTRIES.map(q => `
    <button class="quick-btn" onclick="openAddModal({category:'${q.cat}',type:'${q.type}',impulse:${q.impulse||false}})">
      ${q.label}
    </button>
  `).join('');
}

// ============================================
// PILL CLASS
// ============================================

function pillClass(cat) {
  if (cat === 'Food-Out') return 'pill-food';
  if (cat === 'Transport') return 'pill-transport';
  if (cat === 'Crypto') return 'pill-crypto';
  if (cat === 'Impulse') return 'pill-impulse';
  if (cat === 'Car-Savings') return 'pill-car';
  if (cat === 'Brazil-Savings') return 'pill-brazil';
  if (cat === 'Plus-Fund' || cat === 'Emergency-Savings') return 'pill-emergency';
  if (cat === 'Room') return 'pill-room';
  if (cat === 'Skincare') return 'pill-room';
  if (cat === 'Amazon') return 'pill-amazon';
  if (cat === 'YouTube-Spend' || cat === 'Income-YouTube') return 'pill-youtube';
  if (cat.startsWith('Fixed-')) return 'pill-fixed';
  if (cat.startsWith('Income-')) return 'pill-income';
  return 'pill-fixed';
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================
// DATA MANAGEMENT
// ============================================

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
