import { BaseSignal } from './base-signal';
import { SignalResult, SIGNAL_NAMES } from './types';

interface AlpacaBar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  n: number;
  vw: number;
}

interface AlpacaBarsResponse {
  bars: {
    'ETH/USD': AlpacaBar[];
  };
  next_page_token?: string | null;
}

export class VolumeTrendSignal extends BaseSignal {
  readonly name = SIGNAL_NAMES.VOLUME_TREND;
  source = 'alpaca';

  async fetch(): Promise<SignalResult> {
    const keyId = process.env.ALPACA_PAPER_KEY_ID;
    const secretKey = process.env.ALPACA_PAPER_SECRET_KEY;

    if (!keyId || !secretKey) {
      throw new Error(
        'Missing ALPACA_PAPER_KEY_ID or ALPACA_PAPER_SECRET_KEY environment variables'
      );
    }

    const url =
      'https://data.alpaca.markets/v1beta3/crypto/us/bars?symbols=ETH/USD&timeframe=1Day&limit=7';

    const data = (await this.fetchJson(url, {
      headers: {
        'APCA-API-KEY-ID': keyId,
        'APCA-API-SECRET-KEY': secretKey,
        Accept: 'application/json',
      },
    })) as AlpacaBarsResponse;

    const bars = data.bars['ETH/USD'] ?? [];

    if (bars.length < 2) {
      throw new Error(
        `Not enough daily bars for volume trend: got ${bars.length}, need at least 2`
      );
    }

    const volumes = bars.map((b) => b.v);
    const currentVolume = volumes[volumes.length - 1];
    const avgVolume =
      volumes.reduce((sum, v) => sum + v, 0) / volumes.length;

    if (avgVolume === 0) {
      throw new Error('Average volume is zero');
    }

    const ratio = currentVolume / avgVolume;

    // Above average volume = bullish, below = bearish
    const normalizedValue = this.clamp((ratio - 1) * 2, -1, 1);

    return {
      name: this.name,
      rawValue: ratio,
      normalizedValue,
      confidence: 0.65,
      source: this.source,
      metadata: {
        currentVolume,
        avgVolume,
        ratio,
        daysUsed: bars.length,
      },
      fetchedAt: new Date(),
    };
  }
}
