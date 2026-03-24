import { MACD, RSI } from 'technicalindicators';
import { BaseSignal } from './base-signal';
import { SignalResult, SIGNAL_NAMES } from './types';

interface AlpacaBar {
  t: string; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
  n: number; // number of trades
  vw: number; // volume weighted average price
}

interface AlpacaBarsResponse {
  bars: {
    'ETH/USD': AlpacaBar[];
  };
  next_page_token?: string | null;
}

function getAlpacaHeaders(): Record<string, string> {
  const keyId = process.env.ALPACA_PAPER_KEY_ID;
  const secretKey = process.env.ALPACA_PAPER_SECRET_KEY;

  if (!keyId || !secretKey) {
    throw new Error(
      'Missing ALPACA_PAPER_KEY_ID or ALPACA_PAPER_SECRET_KEY environment variables'
    );
  }

  return {
    'APCA-API-KEY-ID': keyId,
    'APCA-API-SECRET-KEY': secretKey,
    Accept: 'application/json',
  };
}

async function fetchAlpacaBars(
  fetchJson: (url: string, options?: RequestInit) => Promise<unknown>
): Promise<AlpacaBar[]> {
  const url =
    'https://data.alpaca.markets/v1beta3/crypto/us/bars?symbols=ETH/USD&timeframe=6Hour&limit=100';

  const data = (await fetchJson(url, {
    headers: getAlpacaHeaders(),
  })) as AlpacaBarsResponse;

  return data.bars['ETH/USD'] ?? [];
}

export class MacdSignal extends BaseSignal {
  readonly name = SIGNAL_NAMES.MACD;
  source = 'alpaca';

  async fetch(): Promise<SignalResult> {
    const bars = await fetchAlpacaBars(this.fetchJson.bind(this));

    if (bars.length < 35) {
      throw new Error(
        `Not enough bars for MACD calculation: got ${bars.length}, need at least 35`
      );
    }

    const closePrices = bars.map((b) => b.c);

    const macdResult = MACD.calculate({
      values: closePrices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });

    const latest = macdResult[macdResult.length - 1];
    if (!latest || latest.histogram === undefined) {
      throw new Error('MACD calculation returned no histogram');
    }

    const histogram = latest.histogram;

    // Normalize using tanh: histogram / 50 (approx ATR for ETH)
    const normalizedValue = Math.tanh(histogram / 50);

    return {
      name: this.name,
      rawValue: histogram,
      normalizedValue: this.clamp(normalizedValue, -1, 1),
      confidence: 0.75,
      source: this.source,
      metadata: {
        macd: latest.MACD,
        signal: latest.signal,
        histogram: latest.histogram,
        barsUsed: bars.length,
      },
      fetchedAt: new Date(),
    };
  }
}

export class RsiSignal extends BaseSignal {
  readonly name = SIGNAL_NAMES.RSI;
  source = 'alpaca';

  async fetch(): Promise<SignalResult> {
    const bars = await fetchAlpacaBars(this.fetchJson.bind(this));

    if (bars.length < 15) {
      throw new Error(
        `Not enough bars for RSI calculation: got ${bars.length}, need at least 15`
      );
    }

    const closePrices = bars.map((b) => b.c);

    const rsiValues = RSI.calculate({
      values: closePrices,
      period: 14,
    });

    const latestRsi = rsiValues[rsiValues.length - 1];
    if (latestRsi === undefined) {
      throw new Error('RSI calculation returned no value');
    }

    // Overbought (>50) is bearish, oversold (<50) is bullish
    const normalizedValue = -(latestRsi - 50) / 50;

    return {
      name: this.name,
      rawValue: latestRsi,
      normalizedValue: this.clamp(normalizedValue, -1, 1),
      confidence: 0.75,
      source: this.source,
      metadata: {
        rsi: latestRsi,
        barsUsed: bars.length,
      },
      fetchedAt: new Date(),
    };
  }
}
