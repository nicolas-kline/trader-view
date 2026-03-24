import { TradeAction } from '@prisma/client';
import { SignalResult } from '../signals/types';

export interface PredictionResult {
  compositeScore: number;  // [-1, +1]
  confidence: number;      // [0, 1]
  action: TradeAction;
  reasoning: string;
  signalSnapshot: Record<string, { raw: number; normalized: number; weight: number; confidence: number }>;
  signals: SignalResult[];
}

export interface OrderSize {
  notional?: number;
  qty?: number;
}
