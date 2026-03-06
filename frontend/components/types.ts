export type MarketIndex = {
  code: string;
  name: string;
  ts: string;
  price: number;
  change?: number | null;
  change_pct?: number | null;
  currency: string;
  source: string;
  is_delayed: boolean;
};

export type Quote = {
  ticker: string;
  ts: string;
  price: number;
  change?: number | null;
  change_pct?: number | null;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  volume?: number | null;
  currency: string;
  source: string;
  is_delayed: boolean;
};

export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
};

export type HistoryResponse = {
  ticker: string;
  interval: string;
  candles: Candle[];
};

export type IndicatorsResponse = {
  ticker: string;
  interval: string;
  period: string;
  indicators: Record<string, any>;
};
