import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { AlpacaClient } from '@/lib/trader/alpaca-client';
import { TradingMode } from '@/generated/prisma';

const ONE_HOUR_MS = 60 * 60 * 1000;
const FOUR_HOURS_MS = 4 * ONE_HOUR_MS;
const TWENTY_FOUR_HOURS_MS = 24 * ONE_HOUR_MS;

/**
 * Evaluates predictions that are old enough to measure outcomes.
 *
 * For each pending prediction:
 * - If >= 1h old and priceAfter1h is null  -> fill priceAfter1h
 * - If >= 4h old and priceAfter4h is null  -> fill priceAfter4h
 * - If >= 24h old and priceAfter24h is null -> fill priceAfter24h
 * - When all three prices are filled, compute actualReturn and outcomeCorrect
 */
export async function evaluateRecentPredictions(mode: TradingMode = 'PAPER'): Promise<number> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - TWENTY_FOUR_HOURS_MS);

  // Find predictions that still need price-after data
  const pendingPredictions = await prisma.prediction.findMany({
    where: {
      priceAfter24h: null,
      createdAt: { lte: oneDayAgo },
    },
    orderBy: { createdAt: 'asc' },
    take: 50, // process in batches
  });

  if (pendingPredictions.length === 0) {
    // Also check for partially-filled predictions (1h, 4h still missing)
    const partialPredictions = await prisma.prediction.findMany({
      where: {
        OR: [
          { priceAfter1h: null, createdAt: { lte: new Date(now.getTime() - ONE_HOUR_MS) } },
          { priceAfter4h: null, createdAt: { lte: new Date(now.getTime() - FOUR_HOURS_MS) } },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    if (partialPredictions.length === 0) {
      logger.info('No predictions to evaluate');
      return 0;
    }

    return evaluateBatch(partialPredictions, mode, now);
  }

  return evaluateBatch(pendingPredictions, mode, now);
}

interface PredictionRow {
  id: string;
  priceAtPrediction: number;
  priceAfter1h: number | null;
  priceAfter4h: number | null;
  priceAfter24h: number | null;
  action: string;
  createdAt: Date;
}

async function evaluateBatch(
  predictions: PredictionRow[],
  mode: TradingMode,
  now: Date,
): Promise<number> {
  const client = new AlpacaClient(mode);
  let currentPrice: number;

  try {
    currentPrice = await client.getLatestEthPrice();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Failed to fetch ETH price for evaluation', { error: message });
    return 0;
  }

  let updatedCount = 0;

  for (const pred of predictions) {
    const ageMs = now.getTime() - new Date(pred.createdAt).getTime();
    const updates: Record<string, unknown> = {};

    // Fill price checkpoints
    if (pred.priceAfter1h === null && ageMs >= ONE_HOUR_MS) {
      updates.priceAfter1h = currentPrice;
    }
    if (pred.priceAfter4h === null && ageMs >= FOUR_HOURS_MS) {
      updates.priceAfter4h = currentPrice;
    }
    if (pred.priceAfter24h === null && ageMs >= TWENTY_FOUR_HOURS_MS) {
      updates.priceAfter24h = currentPrice;
    }

    // When priceAfter24h is now available, compute outcome
    const finalPrice24h = (updates.priceAfter24h as number | undefined) ?? pred.priceAfter24h;
    if (finalPrice24h !== null && finalPrice24h !== undefined) {
      const actualReturn =
        (finalPrice24h - pred.priceAtPrediction) / pred.priceAtPrediction;

      let outcomeCorrect: boolean;
      if (pred.action === 'BUY') {
        outcomeCorrect = actualReturn > 0;
      } else if (pred.action === 'SELL') {
        outcomeCorrect = actualReturn < 0;
      } else {
        // HOLD is correct if price didn't move much
        outcomeCorrect = Math.abs(actualReturn) < 0.02;
      }

      updates.actualReturn = actualReturn;
      updates.outcomeCorrect = outcomeCorrect;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.prediction.update({
        where: { id: pred.id },
        data: updates,
      });
      updatedCount++;
    }
  }

  logger.info('Prediction evaluation complete', {
    evaluated: updatedCount,
    total: predictions.length,
  });

  return updatedCount;
}
