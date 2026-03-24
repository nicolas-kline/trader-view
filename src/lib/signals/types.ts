export interface SignalResult {
  name: string;
  rawValue: number;
  normalizedValue: number; // [-1, +1] where -1=bearish, +1=bullish
  confidence: number; // 0-1
  source: string;
  metadata?: Record<string, unknown>;
  fetchedAt: Date;
}

export const SIGNAL_NAMES = {
  MACD: 'macd',
  RSI: 'rsi',
  FEAR_GREED: 'fear_greed',
  VIX: 'vix',
  FED_RATE: 'fed_rate',
  TREASURY_SPREAD: 'treasury_spread',
  NEWS_SENTIMENT: 'news_sentiment',
  BOLLINGER: 'bollinger',
  GAS_FEES: 'gas_fees',
  COINGECKO_MOMENTUM: 'coingecko_momentum',
  VOLUME_TREND: 'volume_trend',
} as const;

export type SignalName = typeof SIGNAL_NAMES[keyof typeof SIGNAL_NAMES];
