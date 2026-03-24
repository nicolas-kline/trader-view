import { BaseSignal } from './base-signal';
import { SignalResult, SIGNAL_NAMES } from './types';

interface OwlracleGasResponse {
  avgGas: number;
  speeds: Array<{
    acceptance: number;
    gasPrice: number;
    estimatedFee: number;
  }>;
  timestamp: string;
}

export class OwlracleGasSignal extends BaseSignal {
  readonly name = SIGNAL_NAMES.GAS_FEES;
  source = 'owlracle';

  async fetch(): Promise<SignalResult> {
    const url = 'https://api.owlracle.info/v4/eth/gas';

    const data = (await this.fetchJson(url)) as OwlracleGasResponse;

    const avgGas = data.avgGas;

    if (typeof avgGas !== 'number' || isNaN(avgGas)) {
      throw new Error('Invalid avgGas value from Owlracle');
    }

    // Baseline: 30 gwei is typical average
    // High gas = high network activity = bullish
    const normalizedValue = this.clamp((avgGas - 30) / 70, -1, 1);

    return {
      name: this.name,
      rawValue: avgGas,
      normalizedValue,
      confidence: 0.5,
      source: this.source,
      metadata: {
        avgGas,
        speeds: data.speeds,
        timestamp: data.timestamp,
      },
      fetchedAt: new Date(),
    };
  }
}
