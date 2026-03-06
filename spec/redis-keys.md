# Redis keys (MVP)

Canonical key input: `ticker = "{market}:{symbol}"` e.g. `TW:2330`, `US:AAPL`.

## Quotes
- Key: `quote:{ticker}`
- TTL: 60s (free sources); later switch to 10-30s with Fugle/Finnhub.

## Daily candles (history)
- Key: `daily:{ticker}:{yyyy-mm}` (bucket by month to limit payload size)
- TTL: 1h

## Indicators
- Key: `ind:{ticker}:{interval}:{period}:{types}`
  - example: `ind:TW:2330:1d:1y:ma,rsi,macd`
- TTL: 5m

## Market indices
- TW index snapshot: `index:TW:TAIEX` TTL 60s
- US indices snapshot: `indices:US:major` TTL 60s
