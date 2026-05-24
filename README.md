# Finance OS — Life Control Center

A private, self-hosted personal finance dashboard built as static HTML/CSS/JS.
Designed for biweekly (catorcena) pay cycles, savings goals, content creation, and crypto tracking.

No accounts. No tracking. No backend. Your data stays in your browser.

---

## ✨ Features

- **Biweekly budget tracking** — built for 14-day pay cycles ("catorcenas")
- **4 pre-loaded savings goals** — plus fund, car, Brazil trip, room upgrades
- **Auto-calculated "safe to spend today"** — daily variable budget that adjusts to your spending
- **Health score** — 0–100 monthly score based on savings rate, spending discipline, and impulse buys
- **Impulse audit** — flag impulse purchases and reflect on them weekly
- **YouTube channel tracking** — subscriber growth, monthly goals
- **Crypto portfolio** — manual price updates, P&L per asset
- **Weekly review template** — auto-pulled stats, wins/lessons reflection
- **Catorcena Setup button** — one click logs paycheck + all planned transfers
- **Monthly subscriptions block** — one click logs all your fixed bills
- **Data export/import** — full JSON backup, restore anywhere
- **Mobile-friendly** — works as a phone home-screen bookmark

---

## 🚀 Deploy to GitHub Pages (10 minutes)

### Step 1 — Create a GitHub repo

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `finance-os` (or whatever you want)
3. Set to **Private** if you want this hidden (recommended), or Public
4. Don't add a README — we already have one
5. Click **Create repository**

### Step 2 — Upload the files

Easiest path (no command line):

1. On the new repo page, click **"uploading an existing file"**
2. Drag all the files from this folder into the upload area:
   - `index.html`
   - `transactions.html`
   - `catorcena.html`
   - `growth.html`
   - `goals.html`
   - `review.html`
   - `settings.html`
   - `style.css`
   - `app.js`
   - `README.md`
3. Click **Commit changes**

### Step 3 — Turn on GitHub Pages

1. Go to **Settings → Pages** (in your repo)
2. Under **Source**, choose **Deploy from a branch**
3. Branch: **main** · Folder: **/ (root)**
4. Click **Save**
5. Wait ~1 minute. GitHub will show you a URL like `https://yourusername.github.io/finance-os/`

### Step 4 — Open it on your phone

1. Visit the URL on your phone's browser
2. **iOS:** tap the share button → "Add to Home Screen"
3. **Android:** tap the menu → "Add to Home screen"

Now it lives as an icon on your phone like an app. The + button in the bottom-right lets you quick-add transactions anywhere.

---

## 📱 Daily usage

**On payday (every 14 days):**
1. Open the app
2. Tap **⚡ Catorcena Setup** — instantly logs your paycheck + all 6 planned transfers (car, Brazil, crypto, YouTube, room, plus fund)
3. Done. Your budget is set for the period.

**On the 1st of the month:**
1. Tap **📅 Add monthly subs** — logs all 12 fixed bills in one click (Netflix, gym, ChatGPT, etc.)

**Every day:**
- Tap the + button when you spend money
- Pick a category, type the amount, hit Add

**Every Sunday (15 min):**
- Open **Weekly review**
- Reflect on the auto-pulled stats
- Write 3 wins, 3 lessons, next week's focus
- Export a backup JSON (Settings page → Export)

---

## ⚠️ Important — data storage

Your data lives in **browser localStorage**, which means:

- ✅ Private to your device — nothing leaves your browser
- ✅ Free, no backend, no accounts
- ⚠️ Lost if you clear browser data, switch browsers, or use incognito
- ⚠️ Does NOT sync between phone and laptop automatically

**Mitigation:** Export a JSON backup every Sunday (Settings → Export). To sync devices: export from one, import on the other.

**Upgrade path:** If you outgrow localStorage, the JSON file structure makes it easy to migrate to a Google Sheets backend, Supabase, or a real database later.

---

## 🛠 Customize

### Change your numbers
Open `app.js` and edit the `SEED` object at the top. Or use the **Settings page** in the app to edit budget values live.

### Add new categories
In `app.js`, edit the `CATEGORIES` array. To get a colored pill, also add a class to `style.css` (search `.pill-` for examples) and map it in the `pillClass()` function.

### Change the aesthetic
The color palette lives in `style.css` at `:root`. The fonts use Fraunces (display) and Inter Tight (body) from Google Fonts — change them in the `@import` line and the `--font-display` / `--font-body` variables.

---

## 📂 File structure

```
finance-os/
├── index.html          ← Home / Life Control Center
├── transactions.html   ← Ledger view
├── catorcena.html      ← Current pay period detail
├── growth.html         ← YouTube + crypto
├── goals.html          ← Savings goals detail
├── review.html         ← Weekly review template
├── settings.html       ← Backup, restore, configure
├── style.css           ← All styling
├── app.js              ← Logic, state, calculations
└── README.md           ← This file
```

---

## 🔁 The system in one paragraph

You get paid 9,000 MXN every 14 days. The moment it hits, you run Catorcena Setup which transfers 3,500 to the car, 325 to Brazil, 500 to crypto, 750 to YouTube, 250 to room upgrades, 250 to the emergency fund — automatically tracked as transactions. That leaves 3,675 for fixed expenses and variable spending across 14 days, with about $143/day "safe to spend" on food and transport. Every Sunday you review. Every January and July, the savings fund injection (~20,000 MXN each) splits 50/50 between car and Brazil, accelerating both goals. In about 7 months: Brazil paid for. In about 8 months: car down payment ready.

---

Built for one user. Designed for sustainability over features.
