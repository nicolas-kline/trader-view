import { env } from '@/lib/utils/env';
import { logger } from '@/lib/utils/logger';
import { AlpacaAccount, AlpacaOrder, AlpacaPosition } from './types';

type TradingMode = 'PAPER' | 'LIVE';

interface CryptoOrderParams {
  side: 'buy' | 'sell';
  notional?: number;
  qty?: number;
}

interface LatestTradeResponse {
  trades: Record<string, { p: number; s: number; t: string }>;
}

export class AlpacaClient {
  private readonly baseUrl: string;
  private readonly dataUrl: string;
  private readonly headers: Record<string, string>;

  constructor(mode: TradingMode) {
    if (mode === 'PAPER') {
      this.baseUrl = 'https://paper-api.alpaca.markets/v2';
      this.headers = {
        'APCA-API-KEY-ID': env('ALPACA_PAPER_KEY_ID'),
        'APCA-API-SECRET-KEY': env('ALPACA_PAPER_SECRET_KEY'),
        'Content-Type': 'application/json',
      };
    } else {
      this.baseUrl = 'https://api.alpaca.markets/v2';
      this.headers = {
        'APCA-API-KEY-ID': env('ALPACA_LIVE_KEY_ID'),
        'APCA-API-SECRET-KEY': env('ALPACA_LIVE_SECRET_KEY'),
        'Content-Type': 'application/json',
      };
    }

    this.dataUrl = 'https://data.alpaca.markets/v1beta3';
  }

  /** Fetch account details (buying power, equity, etc.) */
  async getAccount(): Promise<AlpacaAccount> {
    const res = await fetch(`${this.baseUrl}/account`, {
      headers: this.headers,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Alpaca getAccount failed (${res.status}): ${body}`);
    }

    return res.json() as Promise<AlpacaAccount>;
  }

  /** Fetch all open positions */
  async getPositions(): Promise<AlpacaPosition[]> {
    const res = await fetch(`${this.baseUrl}/positions`, {
      headers: this.headers,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Alpaca getPositions failed (${res.status}): ${body}`);
    }

    return res.json() as Promise<AlpacaPosition[]>;
  }

  /** Fetch the current ETH/USD position, or null if none exists */
  async getEthPosition(): Promise<AlpacaPosition | null> {
    const positions = await this.getPositions();
    return positions.find((p) => p.symbol === 'ETH/USD' || p.symbol === 'ETHUSD') ?? null;
  }

  /** Place a market order for ETH/USD */
  async placeCryptoOrder(params: CryptoOrderParams): Promise<AlpacaOrder> {
    const body: Record<string, unknown> = {
      symbol: 'ETH/USD',
      side: params.side,
      type: 'market',
      time_in_force: 'gtc',
    };

    if (params.notional !== undefined) {
      body.notional = params.notional.toString();
    } else if (params.qty !== undefined) {
      body.qty = params.qty.toString();
    } else {
      throw new Error('Either notional or qty must be specified for a crypto order');
    }

    logger.info('Placing crypto order', { params, body });

    const res = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Alpaca placeCryptoOrder failed (${res.status}): ${errBody}`);
    }

    return res.json() as Promise<AlpacaOrder>;
  }

  /** Get the latest ETH/USD trade price from the market data API */
  async getLatestEthPrice(): Promise<number> {
    const url = `${this.dataUrl}/crypto/us/latest/trades?symbols=ETH/USD`;

    const res = await fetch(url, {
      headers: this.headers,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Alpaca getLatestEthPrice failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as LatestTradeResponse;
    const trade = data.trades['ETH/USD'];

    if (!trade) {
      throw new Error('No ETH/USD trade data returned from Alpaca');
    }

    return trade.p;
  }
}
