import { TradeAction } from '@/generated/prisma';
import { AlpacaAccount, AlpacaPosition } from './types';

interface RiskCheckParams {
  action: TradeAction;
  notional?: number;
  qty?: number;
  account: AlpacaAccount;
  ethPosition: AlpacaPosition | null;
  maxPositionPct: number;
  minTradeUsd: number;
}

interface RiskCheckResult {
  approved: boolean;
  reason?: string;
}

/**
 * Validates a proposed order against risk constraints before execution.
 *
 * Checks performed:
 * - BUY: sufficient buying power, position size limit not exceeded
 * - SELL: position exists to sell
 */
export function checkRisk(params: RiskCheckParams): RiskCheckResult {
  const { action, notional, account, ethPosition, maxPositionPct, minTradeUsd } = params;

  if (action === 'HOLD') {
    return { approved: false, reason: 'No trade needed for HOLD action' };
  }

  const buyingPower = parseFloat(account.buying_power);
  const equity = parseFloat(account.equity);
  const positionValue = ethPosition ? parseFloat(ethPosition.market_value) : 0;

  if (action === 'BUY') {
    // Check minimum buying power
    if (buyingPower < minTradeUsd) {
      return {
        approved: false,
        reason: `Insufficient buying power: $${buyingPower.toFixed(2)} < minimum $${minTradeUsd.toFixed(2)}`,
      };
    }

    // Check that the trade notional doesn't exceed buying power
    if (notional !== undefined && notional > buyingPower) {
      return {
        approved: false,
        reason: `Order notional $${notional.toFixed(2)} exceeds buying power $${buyingPower.toFixed(2)}`,
      };
    }

    // Check max position size: don't buy if current position already exceeds limit
    const maxPositionValue = equity * maxPositionPct;
    if (positionValue >= maxPositionValue) {
      return {
        approved: false,
        reason: `Position $${positionValue.toFixed(2)} already at max (${(maxPositionPct * 100).toFixed(0)}% of $${equity.toFixed(2)} equity = $${maxPositionValue.toFixed(2)})`,
      };
    }

    return { approved: true };
  }

  // SELL
  if (!ethPosition || parseFloat(ethPosition.qty) <= 0) {
    return {
      approved: false,
      reason: 'No ETH position to sell',
    };
  }

  return { approved: true };
}
