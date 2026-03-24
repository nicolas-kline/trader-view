import { BaseSignal } from './base-signal';
import { SignalResult, SIGNAL_NAMES } from './types';

interface FearGreedResponse {
  data: Array<{
    value: string;
    value_classification: string;
    timestamp: string;
  }>;
}

export class FearGreedSignal extends BaseSignal {
  readonly name = SIGNAL_NAMES.FEAR_GREED;
  source = 'alternative.me';

  async fetch(): Promise<SignalResult> {
    const data = (await this.fetchJson(
      'https://api.alternative.me/fng/?limit=1'
    )) as FearGreedResponse;

    const raw = parseInt(data.data[0].value, 10);

    // Contrarian: extreme greed (100) is bearish (-1), extreme fear (0) is bullish (+1)
    const normalizedValue = -(raw - 50) / 50;

    return {
      name: this.name,
      rawValue: raw,
      normalizedValue: this.clamp(normalizedValue, -1, 1),
      confidence: 0.8,
      source: this.source,
      metadata: {
        classification: data.data[0].value_classification,
        timestamp: data.data[0].timestamp,
      },
      fetchedAt: new Date(),
    };
  }
}
