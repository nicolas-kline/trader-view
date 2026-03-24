import { TradeAction } from '@/generated/prisma';
import { SignalResult } from '@/lib/signals/types';
import { PredictionResult } from './types';

interface EngineSettings {
  signalWeights: Record<string, number>;
  buyThreshold: number;
  sellThreshold: number;
}

/**
 * Core prediction engine.
 * Combines normalized signal values using weighted scoring,
 * then makes a BUY / SELL / HOLD decision based on thresholds.
 */
export function runPrediction(
  signals: SignalResult[],
  settings: EngineSettings,
): PredictionResult {
  const { signalWeights, buyThreshold, sellThreshold } = settings;

  // ---- Build snapshot & compute composite score ----
  const signalSnapshot: PredictionResult['signalSnapshot'] = {};
  let weightedSum = 0;
  let weightConfidenceSum = 0;

  for (const sig of signals) {
    const weight = signalWeights[sig.name] ?? 1;
    const wc = weight * sig.confidence;
    weightedSum += sig.normalizedValue * wc;
    weightConfidenceSum += wc;

    signalSnapshot[sig.name] = {
      raw: sig.rawValue,
      normalized: sig.normalizedValue,
      weight,
      confidence: sig.confidence,
    };
  }

  const compositeScore =
    weightConfidenceSum > 0 ? weightedSum / weightConfidenceSum : 0;

  // ---- Compute confidence ----
  const confidence = computeConfidence(signals);

  // ---- Determine action ----
  const effectiveScore = compositeScore * confidence;
  let action: TradeAction;
  if (effectiveScore > buyThreshold) {
    action = 'BUY';
  } else if (effectiveScore < sellThreshold) {
    action = 'SELL';
  } else {
    action = 'HOLD';
  }

  // ---- Generate reasoning ----
  const reasoning = generateReasoning(signals, signalWeights, compositeScore, confidence, action);

  return {
    compositeScore,
    confidence,
    action,
    reasoning,
    signalSnapshot,
    signals,
  };
}

/**
 * Confidence = 0.5 * agreement + 0.3 * avgMagnitude + 0.2 * freshness
 */
function computeConfidence(signals: SignalResult[]): number {
  if (signals.length === 0) return 0;

  // Agreement: max(bullish, bearish) / totalDirectional
  let bullish = 0;
  let bearish = 0;
  for (const sig of signals) {
    if (sig.normalizedValue > 0) bullish++;
    else if (sig.normalizedValue < 0) bearish++;
  }
  const totalDirectional = bullish + bearish;
  const agreement =
    totalDirectional > 0
      ? Math.max(bullish, bearish) / totalDirectional
      : 0.5; // neutral when all signals are exactly 0

  // Average magnitude of normalized values
  const avgMagnitude =
    signals.reduce((sum, s) => sum + Math.abs(s.normalizedValue), 0) /
    signals.length;

  // Freshness: avg of max(0, 1 - ageHours / 24)
  const now = Date.now();
  const freshness =
    signals.reduce((sum, s) => {
      const ageHours = (now - new Date(s.fetchedAt).getTime()) / (1000 * 60 * 60);
      return sum + Math.max(0, 1 - ageHours / 24);
    }, 0) / signals.length;

  const confidence = 0.5 * agreement + 0.3 * avgMagnitude + 0.2 * freshness;
  return Math.min(confidence, 1);
}

/**
 * Produces a human-readable reasoning string
 * listing the top 3 bullish and top 3 bearish signals.
 */
function generateReasoning(
  signals: SignalResult[],
  weights: Record<string, number>,
  compositeScore: number,
  confidence: number,
  action: TradeAction,
): string {
  const scored = signals.map((s) => ({
    name: s.name,
    contribution: s.normalizedValue * (weights[s.name] ?? 1) * s.confidence,
  }));

  const bullish = scored
    .filter((s) => s.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);

  const bearish = scored
    .filter((s) => s.contribution < 0)
    .sort((a, b) => a.contribution - b.contribution)
    .slice(0, 3);

  const parts: string[] = [
    `Action: ${action} | Composite: ${compositeScore.toFixed(4)} | Confidence: ${(confidence * 100).toFixed(1)}%`,
  ];

  if (bullish.length > 0) {
    parts.push(
      `Bullish: ${bullish.map((s) => `${s.name}(+${s.contribution.toFixed(3)})`).join(', ')}`,
    );
  }

  if (bearish.length > 0) {
    parts.push(
      `Bearish: ${bearish.map((s) => `${s.name}(${s.contribution.toFixed(3)})`).join(', ')}`,
    );
  }

  return parts.join(' | ');
}
