import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { AlpacaClient } from '@/lib/trader/alpaca-client';
import { TradingMode } from '@/generated/prisma';

/**
 * Takes a point-in-time snapshot of the portfolio state
 * and persists it for historical tracking.
 */
export async function takeSnapshot(mode: TradingMode): Promise<void> {
  const client = new AlpacaClient(mode);

  const [account, ethPosition, ethPrice] = await Promise.all([
    client.getAccount(),
    client.getEthPosition(),
    client.getLatestEthPrice(),
  ]);

  const equity = parseFloat(account.equity);
  const cash = parseFloat(account.cash);
  const positionValue = ethPosition ? parseFloat(ethPosition.market_value) : 0;
  const positionQty = ethPosition ? parseFloat(ethPosition.qty) : 0;

  // Day P&L: unrealized P&L on the ETH position (intraday)
  const dayPnl = ethPosition ? parseFloat(ethPosition.unrealized_pl) : 0;

  // Total P&L: equity minus cash deposited (portfolio_value includes unrealized)
  // Using (equity - cash) as a proxy for total invested value minus current position P&L
  const portfolioValue = parseFloat(account.portfolio_value);
  const totalPnl = portfolioValue - cash - (positionValue - dayPnl);

  // Total P&L %: relative to initial equity (portfolio_value as base)
  const initialEquity = portfolioValue - totalPnl;
  const totalPnlPct = initialEquity > 0 ? totalPnl / initialEquity : 0;

  await prisma.portfolioSnapshot.create({
    data: {
      mode,
      equity,
      cash,
      positionValue,
      positionQty,
      ethPrice,
      dayPnl,
      totalPnl,
      totalPnlPct,
    },
  });

  logger.info('Portfolio snapshot saved', {
    mode,
    equity,
    cash,
    positionValue,
    ethPrice,
    dayPnl,
    totalPnl,
  });
}
