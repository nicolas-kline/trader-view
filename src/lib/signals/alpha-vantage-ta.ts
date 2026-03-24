import { BaseSignal } from './base-signal';
import { SignalResult, SIGNAL_NAMES } from './types';

interface BBANDSEntry {
  'Real Upper Band': string;
  'Real Middle Band': string;
  'Real Lower Band': string;
}

interface AlphaVantageMetaData {
  '5: Last Refreshed': string;
  // may contain other fields
  [key: string]: string;
}

interface AlphaVantageBBANDSResponse {
  'Meta Data'?: AlphaVantageMetaData;
  'Technical Analysis: BBANDS'?: Record<string, BBANDSEntry>;
  Note?: string;
  Information?: string;
}

export class BollingerSignal extends BaseSignal {
  readonly name = SIGNAL_NAMES.BOLLINGER;
  source = 'alpha_vantage';

  async fetch(): Promise<SignalResult> {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      throw new Error('Missing ALPHA_VANTAGE_API_KEY environment variable');
    }

    const url = `https://www.alphavantage.co/query?function=BBANDS&symbol=ETHUSD&interval=daily&time_period=20&series_type=close&apikey=${apiKey}`;

    const data = (await this.fetchJson(url)) as AlphaVantageBBANDSResponse;

    // Handle rate limiting
    if (data.Note || data.Information) {
      return {
        name: this.name,
        rawValue: 0,
        normalizedValue: 0,
        confidence: 0,
        source: this.source,
        metadata: {
          rateLimited: true,
          message: data.Note || data.Information,
        },
        fetchedAt: new Date(),
      };
    }

    const bbandsData = data['Technical Analysis: BBANDS'];
    if (!bbandsData) {
      throw new Error('No BBANDS data in Alpha Vantage response');
    }

    // Get the latest entry (first key in the object)
    const dates = Object.keys(bbandsData);
    if (dates.length === 0) {
      throw new Error('BBANDS data is empty');
    }

    const latestDate = dates[0];
    const latest = bbandsData[latestDate];

    const upperBand = parseFloat(latest['Real Upper Band']);
    const middleBand = parseFloat(latest['Real Middle Band']);
    const lowerBand = parseFloat(latest['Real Lower Band']);

    if (isNaN(upperBand) || isNaN(middleBand) || isNaN(lowerBand)) {
      throw new Error('Invalid BBANDS values from Alpha Vantage');
    }

    // Use middle band as current price proxy (close to actual price)
    // The middle band IS the 20-day SMA, very close to current price
    const price = middleBand;

    const bandWidth = upperBand - lowerBand;
    if (bandWidth === 0) {
      throw new Error('Bollinger band width is zero');
    }

    // Position within bands: 0 = at lower, 1 = at upper
    const position = (price - lowerBand) / (upperBand - lowerBand);

    // Near upper band = overbought = bearish, near lower = oversold = bullish
    const normalizedValue = (0.5 - position) * 2;

    return {
      name: this.name,
      rawValue: position,
      normalizedValue: this.clamp(normalizedValue, -1, 1),
      confidence: 0.7,
      source: this.source,
      metadata: {
        upperBand,
        middleBand,
        lowerBand,
        price,
        position,
        date: latestDate,
      },
      fetchedAt: new Date(),
    };
  }
}
