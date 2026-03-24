# TraderView - Ethereum Auto-Trading System

Multi-signal prediction engine that auto-trades ETH/USD via Alpaca, with a Bloomberg-style dark dashboard. Tracks its own prediction accuracy to improve over time.

## Features

- **Multi-Signal Prediction Engine**: 11 signals from 7 data sources (technical analysis, macro, sentiment, on-chain)
- **Weighted Scoring**: Configurable signal weights with auto-normalization
- **Paper + Live Mode**: Separate API keys, switch with one click
- **Self-Tracking**: Evaluates prediction accuracy at 1h/4h/24h, ranks signal performance
- **Bloomberg-Style Dashboard**: Equity curve, signal gauges, trade history, performance analytics
- **Configurable Frequency**: Trade 1x/hour to 1x/day (default: daily)
- **Digital Ocean Ready**: App Platform deployment with cron jobs

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd traderview
npm install
```

### 2. Get API Keys

You need API keys from these services:

| Service | Required | Cost | Get Key |
|---------|----------|------|---------|
| **Supabase** | Yes | Free tier | [supabase.com](https://supabase.com) - Create project, get connection strings |
| **Alpaca (Paper)** | Yes | Free | [app.alpaca.markets](https://app.alpaca.markets) - Paper trading dashboard |
| **Alpaca (Live)** | For live trading | Free | [app.alpaca.markets](https://app.alpaca.markets) - Live trading dashboard |
| **FRED** | Yes | Free | [fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html) |
| **Finnhub** | Yes | Free | [finnhub.io/register](https://finnhub.io/register) |
| **Alpha Vantage** | Yes | Free (25 req/day) | [alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key) |
| Alternative.me | Auto | Free, no key | Fear & Greed Index |
| CoinGecko | Auto | Free, no key | Market data |
| Owlracle | Auto | Free, no key | Gas fees |

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > Database > Connection string
3. Copy the **URI** (pooled, port 6543) for `DATABASE_URL`
4. Copy the **URI** (direct, port 5432) for `DIRECT_URL`

### 4. Configure Environment

```bash
cp .env.example .env
```

Fill in all values in `.env`:

```bash
# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Alpaca Paper Trading
ALPACA_PAPER_KEY_ID="PK..."
ALPACA_PAPER_SECRET_KEY="..."

# Alpaca Live Trading (optional, for live mode)
ALPACA_LIVE_KEY_ID="AK..."
ALPACA_LIVE_SECRET_KEY="..."

# FRED
FRED_API_KEY="..."

# Finnhub
FINNHUB_API_KEY="..."

# Alpha Vantage
ALPHA_VANTAGE_API_KEY="..."

# Cron secret (generate a random string)
CRON_SECRET="$(openssl rand -hex 32)"
```

### 5. Set Up Database

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Test the Engine

Trigger the trading engine manually from the dashboard (Engine Status card > "Run Engine" button) or via API:

```bash
curl -X POST http://localhost:3000/api/engine/run
```

## Architecture

```
Signals (7 sources) -> Prediction Engine -> Trade Decision -> Alpaca API
     |                      |                   |
  Store signals      Store prediction        Store trade
                           |
                  Evaluate after 24h
                           |
                  Update signal rankings
```

### Signal Sources

| Signal | Source | Weight | What It Measures |
|--------|--------|--------|-----------------|
| MACD | Alpaca | 20% | Trend momentum crossover |
| RSI | Alpaca | 15% | Overbought/oversold |
| Fear & Greed | Alternative.me | 12% | Crypto market sentiment (contrarian) |
| News Sentiment | Finnhub | 10% | Crypto news tone |
| Bollinger Bands | Alpha Vantage | 10% | Price vs. statistical bands |
| VIX | FRED | 8% | Stock market fear (inverse) |
| CoinGecko Momentum | CoinGecko | 8% | 24h/7d price momentum |
| Volume Trend | Alpaca | 7% | Volume vs. average |
| Gas Fees | Owlracle | 5% | Network activity |
| Fed Rate | FRED | 3% | Rate change direction |
| Treasury Spread | FRED | 2% | Yield curve shape |

### Prediction Engine

All signals normalized to [-1, +1] range (bearish to bullish). Weighted composite score determines action:

- Score > buy threshold (0.3) -> **BUY**
- Score < sell threshold (-0.3) -> **SELL**
- Otherwise -> **HOLD**

Position size scales with prediction confidence.

## Deploy to Digital Ocean

### 1. Push to GitHub

```bash
git init
git add -A
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Update `.do/app.yaml`

Replace `your-username/traderview` with your actual GitHub repo path.

### 3. Create App

```bash
doctl apps create --spec .do/app.yaml
```

Or use the Digital Ocean web console: Apps > Create App > Import from GitHub.

### 4. Set Environment Variables

In the Digital Ocean console, go to your app's Settings > Environment Variables and add all keys from `.env.example`.

### 5. Run Migration

The app's run command automatically runs `prisma migrate deploy` on startup.

## Dashboard Pages

- **Dashboard** (`/`): Equity curve, position, P&L summary, signal gauges, engine status, recent trades
- **Trades** (`/trades`): Full trade history with sortable table and detail modals
- **Signals** (`/signals`): Signal history charts and current readings
- **Performance** (`/performance`): Prediction accuracy, signal rankings, outcome analysis
- **Settings** (`/settings`): Paper/Live mode, trade frequency, signal weights, API status

## Configuration

All settings configurable from the Settings page:

| Setting | Default | Description |
|---------|---------|-------------|
| Mode | PAPER | Paper or Live trading |
| Frequency | 24h | How often the engine runs |
| Buy Threshold | 0.3 | Composite score to trigger buy |
| Sell Threshold | -0.3 | Composite score to trigger sell |
| Max Position % | 95% | Max % of buying power to use |
| Min Trade | $10 | Minimum order size |

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Charts**: TradingView Lightweight Charts
- **Database**: Prisma ORM + Supabase PostgreSQL
- **Deployment**: Digital Ocean App Platform
- **APIs**: Alpaca, FRED, Finnhub, Alpha Vantage, CoinGecko, Alternative.me, Owlracle
