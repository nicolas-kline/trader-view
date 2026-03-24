import { TradeAction, TradingMode, TradeStatus } from '@prisma/client';
import { logger } from '@/lib/utils/logger';
import { OrderSize } from '@/lib/engine/types';
import { AlpacaClient } from './alpaca-client';

interface TradeRecord {
  mode: TradingMode;
  action: TradeAction;
  symbol: string;
  status: TradeStatus;
  orderId: string | null;
  requestedNotional: number | null;
  requestedQty: number | null;
  filledQty: number | null;
  filledPrice: number | null;
  filledNotional: number | null;
  alpacaResponse: Record<string, unknown> | null;
  errorMessage: string | null;
}

/**
 * Executes a trade order through the Alpaca API and returns
 * a record suitable for persisting to the database.
 */
export async function executeOrder(
  action: TradeAction,
  orderSize: OrderSize,
  mode: TradingMode,
): Promise<TradeRecord> {
  const client = new AlpacaClient(mode);

  const record: TradeRecord = {
    mode,
    action,
    symbol: 'ETH/USD',
    status: 'PENDING',
    orderId: null,
    requestedNotional: orderSize.notional ?? null,
    requestedQty: orderSize.qty ?? null,
    filledQty: null,
    filledPrice: null,
    filledNotional: null,
    alpacaResponse: null,
    errorMessage: null,
  };

  try {
    const side = action === 'BUY' ? 'buy' : 'sell';
    const order = await client.placeCryptoOrder({
      side,
      notional: orderSize.notional,
      qty: orderSize.qty,
    });

    record.orderId = order.id;
    record.status = mapOrderStatus(order.status);
    record.filledQty = order.filled_qty ? parseFloat(order.filled_qty) : null;
    record.filledPrice = order.filled_avg_price
      ? parseFloat(order.filled_avg_price)
      : null;
    record.filledNotional =
      record.filledQty && record.filledPrice
        ? record.filledQty * record.filledPrice
        : null;
    record.alpacaResponse = order as unknown as Record<string, unknown>;

    logger.info('Order executed', {
      orderId: order.id,
      status: order.status,
      side,
      mode,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    record.status = 'FAILED';
    record.errorMessage = message;
    logger.error('Order execution failed', { error: message, action, mode });
  }

  return record;
}

function mapOrderStatus(alpacaStatus: string): TradeStatus {
  switch (alpacaStatus) {
    case 'filled':
      return 'FILLED';
    case 'partially_filled':
      return 'PARTIALLY_FILLED';
    case 'cancelled':
    case 'canceled':
      return 'CANCELLED';
    case 'new':
    case 'accepted':
    case 'pending_new':
      return 'PENDING';
    default:
      return 'PENDING';
  }
}
