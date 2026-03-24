import { BaseSignal } from './base-signal';
import { SignalResult } from './types';
import { MacdSignal, RsiSignal } from './alpaca-technical';
import { VolumeTrendSignal } from './alpaca-price';
import { FearGreedSignal } from './fear-greed';
import { VixSignal, FedRateSignal, TreasurySpreadSignal } from './fred-macro';
import { CoingeckoMomentumSignal } from './coingecko-market';
import { BollingerSignal } from './alpha-vantage-ta';
import { FinnhubSentimentSignal } from './finnhub-sentiment';
import { OwlracleGasSignal } from './owlracle-gas';

class SignalRegistry {
  private signals: BaseSignal[] = [];

  constructor() {
    this.signals = [
      new MacdSignal(),
      new RsiSignal(),
      new VolumeTrendSignal(),
      new FearGreedSignal(),
      new VixSignal(),
      new FedRateSignal(),
      new TreasurySpreadSignal(),
      new CoingeckoMomentumSignal(),
      new BollingerSignal(),
      new FinnhubSentimentSignal(),
      new OwlracleGasSignal(),
    ];
  }

  async fetchAll(enabledSignals: string[]): Promise<SignalResult[]> {
    const enabled = this.signals.filter((s) =>
      enabledSignals.includes(s.name)
    );

    const results = await Promise.allSettled(
      enabled.map((s) => s.fetch())
    );

    const fulfilled: SignalResult[] = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        fulfilled.push(result.value);
      } else {
        console.warn(
          `Signal "${enabled[i].name}" failed:`,
          result.reason
        );
      }
    }

    return fulfilled;
  }

  getSignalNames(): string[] {
    return this.signals.map((s) => s.name);
  }
}

export const signalRegistry = new SignalRegistry();

/**
 * Convenience function for dynamic imports.
 * Used by engine-runner: `const { fetchAllSignals } = await import('@/lib/signals/registry')`
 */
export async function fetchAllSignals(
  enabledSignals: string[]
): Promise<SignalResult[]> {
  return signalRegistry.fetchAll(enabledSignals);
}
