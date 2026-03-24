import { TradeAction } from '@/generated/prisma';
import { OrderSize } from './types';

interface SizerParams {
  action: TradeAction;
  confidence: number;
  buyingPower: number;
  maxPositionPct: number;
  minTradeUsd: number;
  positionValue: number;
}

/**
 * Determines how large a trade should be based on the predicted action,
 * confidence level, and account constraints.
 *
 * - BUY:  scale notional by confidence and maxPositionPct of buying power
 * - SELL: full exit when confidence > 0.7, partial otherwise
 * - HOLD: no trade
 */
export function calculateOrderSize(params: SizerParams): OrderSize {
  const { action, confidence, buyingPower, maxPositionPct, minTradeUsd, positionValue } = params;

  if (action === 'HOLD') {
    return {};
  }

  if (action === 'BUY') {
    const rawNotional = buyingPower * maxPositionPct * Math.min(confidence, 1.0);
    const notional = Math.max(rawNotional, minTradeUsd);

    // Don't exceed buying power
    if (notional > buyingPower) {
      return {};
    }

    return { notional: Math.round(notional * 100) / 100 };
  }

  // SELL
  if (positionValue <= 0) {
    return {};
  }

  if (confidence > 0.7) {
    // Full exit: sell the entire position
    return { notional: Math.round(positionValue * 100) / 100 };
  }

  // Partial exit: scale between 30% and 100% based on confidence
  const fraction = 0.3 + confidence * 0.7;
  const notional = positionValue * fraction;

  if (notional < minTradeUsd) {
    return {};
  }

  return { notional: Math.round(notional * 100) / 100 };
}
