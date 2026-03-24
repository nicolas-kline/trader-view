import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { runPrediction } from '@/lib/engine/prediction-engine';
import { calculateOrderSize } from '@/lib/engine/position-sizer';
import { AlpacaClient } from '@/lib/trader/alpaca-client';
import { checkRisk } from '@/lib/trader/risk-manager';
import { executeOrder } from '@/lib/trader/order-executor';
import { takeSnapshot } from './snapshot-taker';
import { SignalResult } from '@/lib/signals/types';
import { TradingMode } from '@/generated/prisma';

interface EngineRunResult {
  action: string;
  compositeScore: number;
  confidence: number;
  reasoning: string;
  ethPrice: number;
  tradeExecuted: boolean;
  tradeId?: string;
  error?: string;
}

/**
 * Main orchestrator: runs the full engine cycle.
 *
 * 1.  Load settings from DB
 * 2.  Fetch all enabled signals via registry
 * 3.  Save signals to DB
 * 4.  Run prediction engine
 * 5.  Get current ETH price & save prediction to DB
 * 6.  Get account / positions from Alpaca
 * 7.  If action != HOLD: size position, risk-check, execute, save trade
 * 8.  Take portfolio snapshot
 * 9.  Update settings.lastEngineRun
 * 10. Return result summary
 */
export async function runEngine(): Promise<EngineRunResult> {
  logger.info('Engine run starting');

  // 1. Load settings
  const settings = await prisma.settings.findUniqueOrThrow({
    where: { id: 'singleton' },
  });

  const signalWeights = settings.signalWeights as Record<string, number>;
  const mode = settings.mode as TradingMode;

  // 2. Fetch all enabled signals via registry
  // The registry module is expected to export a function that
  // fetches all enabled signals in parallel.
  let signals: SignalResult[];
  try {
    const { fetchAllSignals } = await import('@/lib/signals/registry');
    signals = await fetchAllSignals(settings.enabledSignals);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Failed to fetch signals', { error: message });
    await prisma.settings.update({
      where: { id: 'singleton' },
      data: {
        lastEngineRun: new Date(),
        lastEngineStatus: 'ERROR',
        lastEngineMessage: `Signal fetch failed: ${message}`,
      },
    });
    throw new Error(`Signal fetch failed: ${message}`);
  }

  if (signals.length === 0) {
    const msg = 'No signals returned; aborting engine run';
    logger.warn(msg);
    await prisma.settings.update({
      where: { id: 'singleton' },
      data: {
        lastEngineRun: new Date(),
        lastEngineStatus: 'SKIPPED',
        lastEngineMessage: msg,
      },
    });
    return {
      action: 'HOLD',
      compositeScore: 0,
      confidence: 0,
      reasoning: msg,
      ethPrice: 0,
      tradeExecuted: false,
    };
  }

  // 4. Run prediction engine
  const prediction = runPrediction(signals, {
    signalWeights,
    buyThreshold: settings.buyThreshold,
    sellThreshold: settings.sellThreshold,
  });

  // 5. Get current ETH price
  const client = new AlpacaClient(mode);
  const ethPrice = await client.getLatestEthPrice();

  // 3. Save signals to DB (we link them to the prediction below)
  // 5 (cont). Save prediction to DB
  const predictionRecord = await prisma.prediction.create({
    data: {
      compositeScore: prediction.compositeScore,
      confidence: prediction.confidence,
      action: prediction.action,
      reasoning: prediction.reasoning,
      signalSnapshot: prediction.signalSnapshot as unknown as import('@/generated/prisma').Prisma.InputJsonValue,
      priceAtPrediction: ethPrice,
      signals: {
        create: signals.map((s) => ({
          name: s.name,
          rawValue: s.rawValue,
          normalizedValue: s.normalizedValue,
          metadata: (s.metadata ?? undefined) as Record<string, unknown> as import('@/generated/prisma').Prisma.InputJsonValue | undefined,
          source: s.source,
          fetchedAt: s.fetchedAt,
        })),
      },
    },
  });

  logger.info('Prediction saved', {
    id: predictionRecord.id,
    action: prediction.action,
    score: prediction.compositeScore,
    confidence: prediction.confidence,
  });

  // 6. Get account & positions from Alpaca
  const account = await client.getAccount();
  const ethPosition = await client.getEthPosition();

  let tradeExecuted = false;
  let tradeId: string | undefined;
  let tradeError: string | undefined;

  // 7. If action != HOLD: calculate position size, risk check, execute, save trade
  if (prediction.action !== 'HOLD') {
    const buyingPower = parseFloat(account.buying_power);
    const positionValue = ethPosition ? parseFloat(ethPosition.market_value) : 0;

    const orderSize = calculateOrderSize({
      action: prediction.action,
      confidence: prediction.confidence,
      buyingPower,
      maxPositionPct: settings.maxPositionPct,
      minTradeUsd: settings.minTradeUsd,
      positionValue,
    });

    // Only proceed if there's something to trade
    if (orderSize.notional || orderSize.qty) {
      const riskResult = checkRisk({
        action: prediction.action,
        notional: orderSize.notional,
        qty: orderSize.qty,
        account,
        ethPosition,
        maxPositionPct: settings.maxPositionPct,
        minTradeUsd: settings.minTradeUsd,
      });

      if (riskResult.approved) {
        const tradeRecord = await executeOrder(
          prediction.action,
          orderSize,
          mode,
        );

        const trade = await prisma.trade.create({
          data: {
            mode: tradeRecord.mode,
            action: tradeRecord.action,
            symbol: tradeRecord.symbol,
            status: tradeRecord.status,
            orderId: tradeRecord.orderId,
            requestedNotional: tradeRecord.requestedNotional,
            requestedQty: tradeRecord.requestedQty,
            filledQty: tradeRecord.filledQty,
            filledPrice: tradeRecord.filledPrice,
            filledNotional: tradeRecord.filledNotional,
            alpacaResponse: (tradeRecord.alpacaResponse ?? undefined) as import('@/generated/prisma').Prisma.InputJsonValue | undefined,
            errorMessage: tradeRecord.errorMessage,
            predictionId: predictionRecord.id,
          },
        });

        tradeId = trade.id;
        tradeExecuted = tradeRecord.status !== 'FAILED';

        if (tradeRecord.errorMessage) {
          tradeError = tradeRecord.errorMessage;
        }

        logger.info('Trade saved', {
          tradeId: trade.id,
          status: tradeRecord.status,
        });
      } else {
        logger.warn('Risk check rejected trade', { reason: riskResult.reason });
        tradeError = riskResult.reason;
      }
    } else {
      logger.info('Position sizer returned empty order size; skipping trade');
    }
  }

  // 8. Take portfolio snapshot
  try {
    await takeSnapshot(mode);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Snapshot failed', { error: message });
  }

  // 9. Update settings.lastEngineRun
  await prisma.settings.update({
    where: { id: 'singleton' },
    data: {
      lastEngineRun: new Date(),
      lastEngineStatus: tradeError ? 'WARNING' : 'OK',
      lastEngineMessage: tradeError
        ? `${prediction.action}: ${tradeError}`
        : `${prediction.action} | score=${prediction.compositeScore.toFixed(4)} conf=${(prediction.confidence * 100).toFixed(1)}%`,
    },
  });

  logger.info('Engine run complete', {
    action: prediction.action,
    tradeExecuted,
    tradeId,
  });

  // 10. Return result summary
  return {
    action: prediction.action,
    compositeScore: prediction.compositeScore,
    confidence: prediction.confidence,
    reasoning: prediction.reasoning,
    ethPrice,
    tradeExecuted,
    tradeId,
    error: tradeError,
  };
}
