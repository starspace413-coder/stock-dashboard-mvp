-- Schema v0.1 (MVP)
-- Canonical ticker: '{market}:{symbol}' e.g. 'TW:2330', 'US:AAPL'

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS stocks (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR(32) UNIQUE NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  market VARCHAR(10) NOT NULL CHECK (market IN ('TW','US')),
  currency VARCHAR(8) NOT NULL,
  sector VARCHAR(50),
  industry VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeseries OHLCV
CREATE TABLE IF NOT EXISTS price_history (
  time TIMESTAMPTZ NOT NULL,
  stock_id INTEGER NOT NULL REFERENCES stocks(id),
  interval VARCHAR(8) NOT NULL DEFAULT '1d',
  open NUMERIC(12,4),
  high NUMERIC(12,4),
  low NUMERIC(12,4),
  close NUMERIC(12,4),
  volume BIGINT,
  turnover BIGINT,
  PRIMARY KEY (time, stock_id, interval)
);

-- If TimescaleDB is enabled:
-- SELECT create_hypertable('price_history', 'time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlist (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  stock_id INTEGER NOT NULL REFERENCES stocks(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, stock_id)
);
