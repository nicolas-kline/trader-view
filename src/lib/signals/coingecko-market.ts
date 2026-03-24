import { BaseSignal } from './base-signal';
import { SignalResult, SIGNAL_NAMES } from './types';

interface CoingeckoMarketData {
  price_change_percentage_24h_in_currency: Record<string, number>;
  price_change_percentage_7d_in_currency: Record<string, number>;
  current_price: Record<string, number>;
}

interface CoingeckoResponse {
  market_data: CoingeckoMarketData;
}

export class CoingeckoMomentumSignal extends BaseSignal {
  readonly name = SIGNAL_NAMES.COINGECKO_MOMENTUM;
  source = 'coingecko';

  async fetch(): Promise<SignalResult> {
    const url =
      'https://api.coingecko.com/api/v3/coins/ethereum?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false';

    const data = (await this.fetchJson(url)) as CoingeckoResponse;

    const pct24h =
      data.market_data.price_change_percentage_24h_in_currency?.usd ?? 0;
    const pct7d =
      data.market_data.price_change_percentage_7d_in_currency?.usd ?? 0;
    const currentPrice = data.market_data.current_price?.usd ?? 0;

    // Weighted blend: 60% short-term (24h), 40% medium-term (7d)
    const normalized24h = this.clamp(pct24h / 10, -1, 1);
    const normalized7d = this.clamp(pct7d / 20, -1, 1);
    const normalizedValue = normalized24h * 0.6 + normalized7d * 0.4;

    return {
      name: this.name,
      rawValue: pct24h,
      normalizedValue: this.clamp(normalizedValue, -1, 1),
      confidence: 0.7,
      source: this.source,
      metadata: {
        pct24h,
        pct7d,
        currentPrice,
        normalized24h,
        normalized7d,
      },
      fetchedAt: new Date(),
    };
  }
}
