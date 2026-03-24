import { BaseSignal } from './base-signal';
import { SignalResult, SIGNAL_NAMES } from './types';

interface FredObservation {
  date: string;
  value: string;
}

interface FredResponse {
  observations: FredObservation[];
}

function getFredApiKey(): string {
  const key = process.env.FRED_API_KEY;
  if (!key) {
    throw new Error('Missing FRED_API_KEY environment variable');
  }
  return key;
}

async function fetchFredSeries(
  fetchJson: (url: string, options?: RequestInit) => Promise<unknown>,
  seriesId: string,
  limit: number = 5
): Promise<FredObservation[]> {
  const apiKey = getFredApiKey();
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&sort_order=desc&limit=${limit}&api_key=${apiKey}&file_type=json`;

  const data = (await fetchJson(url)) as FredResponse;
  return data.observations ?? [];
}

function parseObservationValue(obs: FredObservation): number | null {
  if (obs.value === '.' || obs.value === '') return null;
  const val = parseFloat(obs.value);
  return isNaN(val) ? null : val;
}

export class VixSignal extends BaseSignal {
  readonly name = SIGNAL_NAMES.VIX;
  source = 'fred';

  async fetch(): Promise<SignalResult> {
    const observations = await fetchFredSeries(
      this.fetchJson.bind(this),
      'VIXCLS'
    );

    // Find the first observation with a valid value
    let vix: number | null = null;
    for (const obs of observations) {
      vix = parseObservationValue(obs);
      if (vix !== null) break;
    }

    if (vix === null) {
      throw new Error('No valid VIX observations found');
    }

    // Low VIX (<20) = bullish, High VIX (>20) = bearish
    const normalizedValue = this.clamp((20 - vix) / 20, -1, 1);

    return {
      name: this.name,
      rawValue: vix,
      normalizedValue,
      confidence: 0.6,
      source: this.source,
      metadata: {
        vix,
        date: observations[0]?.date,
      },
      fetchedAt: new Date(),
    };
  }
}

export class FedRateSignal extends BaseSignal {
  readonly name = SIGNAL_NAMES.FED_RATE;
  source = 'fred';

  async fetch(): Promise<SignalResult> {
    const observations = await fetchFredSeries(
      this.fetchJson.bind(this),
      'DFF',
      5
    );

    // Find last 2 valid readings
    const validValues: number[] = [];
    for (const obs of observations) {
      const val = parseObservationValue(obs);
      if (val !== null) {
        validValues.push(val);
        if (validValues.length >= 2) break;
      }
    }

    if (validValues.length < 2) {
      throw new Error(
        'Not enough valid Fed Rate observations (need at least 2)'
      );
    }

    const current = validValues[0];
    const previous = validValues[1];
    const rateChange = current - previous;

    // Rate hike = bearish, rate cut = bullish
    const normalizedValue = this.clamp(-rateChange * 8, -1, 1);

    return {
      name: this.name,
      rawValue: current,
      normalizedValue,
      confidence: 0.6,
      source: this.source,
      metadata: {
        currentRate: current,
        previousRate: previous,
        rateChange,
      },
      fetchedAt: new Date(),
    };
  }
}

export class TreasurySpreadSignal extends BaseSignal {
  readonly name = SIGNAL_NAMES.TREASURY_SPREAD;
  source = 'fred';

  async fetch(): Promise<SignalResult> {
    const observations = await fetchFredSeries(
      this.fetchJson.bind(this),
      'T10Y2Y'
    );

    let spread: number | null = null;
    for (const obs of observations) {
      spread = parseObservationValue(obs);
      if (spread !== null) break;
    }

    if (spread === null) {
      throw new Error('No valid Treasury Spread observations found');
    }

    // Negative spread = inverted yield curve = bearish
    const normalizedValue = this.clamp(spread, -1, 1);

    return {
      name: this.name,
      rawValue: spread,
      normalizedValue,
      confidence: 0.6,
      source: this.source,
      metadata: {
        spread,
        date: observations[0]?.date,
      },
      fetchedAt: new Date(),
    };
  }
}
