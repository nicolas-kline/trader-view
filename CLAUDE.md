# TraderView - Ethereum Auto-Trading System

## Project Overview
Ethereum auto-trading system using multi-signal weighted prediction engine with Bloomberg-style dashboard. Deploys on Digital Ocean App Platform.

## Tech Stack
- Next.js 15 (App Router, standalone output), TypeScript, Tailwind CSS, shadcn/ui
- TradingView Lightweight Charts for financial charting
- Prisma ORM + Supabase PostgreSQL
- `technicalindicators` for local MACD/RSI/Bollinger computation

## Key Architecture
- **Signals** (`src/lib/signals/`): Each signal source has its own fetcher extending `BaseSignal`. Registry fetches all in parallel.
- **Engine** (`src/lib/engine/`): Weighted scoring combines normalized signals [-1,+1] into composite score. Threshold-based BUY/SELL/HOLD decision.
- **Trader** (`src/lib/trader/`): Alpaca client with paper/live mode switching via `Settings.mode` in DB.
- **Worker** (`src/lib/worker/`): Engine runner orchestrates full cycle: fetch signals → predict → trade → snapshot → evaluate past predictions.
- **Dashboard** (`src/app/`): 5 pages - main dashboard, trades, signals, performance, settings.

## Commands
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npx prisma migrate dev` - Run migrations
- `npx prisma db seed` - Seed default settings
- `npx prisma studio` - Database browser

## Environment Variables
See `.env.example` for all required keys. Key services: Alpaca (paper+live), FRED, Finnhub, Alpha Vantage, Supabase.

## Conventions
- All signal values normalized to [-1, +1] range
- Trades and snapshots tagged with TradingMode (PAPER/LIVE)
- API routes at `src/app/api/`
- Business logic in `src/lib/`
- React components in `src/components/`
- Use shadcn/ui components from `src/components/ui/`
