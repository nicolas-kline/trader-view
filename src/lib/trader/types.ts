export interface AlpacaAccount {
  id: string;
  buying_power: string;
  cash: string;
  portfolio_value: string;
  equity: string;
  status: string;
}

export interface AlpacaPosition {
  symbol: string;
  qty: string;
  market_value: string;
  avg_entry_price: string;
  current_price: string;
  unrealized_pl: string;
  unrealized_plpc: string;
}

export interface AlpacaOrder {
  id: string;
  status: string;
  symbol: string;
  qty?: string;
  notional?: string;
  filled_qty: string;
  filled_avg_price?: string;
  side: string;
  type: string;
  time_in_force: string;
  created_at: string;
}
