'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { apiGet, API_BASE_URL } from './api';
import type { HistoryResponse, IndicatorsResponse, MarketIndex, Quote } from './types';
import StockChart from './StockChart';
import StockSearch from './StockSearch';
import { fetchStooqDailyHistory, mapTickerToStooqSymbol } from './publicApis';

const DEFAULT_TICKERS = ['TW:2330', 'US:AAPL', 'US:NVDA', 'US:TSLA'];

function formatPrice(n: number, decimals = 2): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

function formatVolume(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function ChangeTag({ change, pct }: { change?: number | null; pct?: number | null }) {
  if (change == null && pct == null) return <span className="index-change">—</span>;
  const isUp = (change ?? 0) >= 0;
  const arrow = isUp ? '▲' : '▼';
  const cls = isUp ? 'up' : 'down';
  return (
    <span className={`index-change ${cls}`}>
      {arrow} {change != null ? formatPrice(Math.abs(change)) : ''}
      {pct != null ? ` (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)` : ''}
    </span>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={`skeleton ${className}`} />;
}

function IndexCard({ data, label }: { data: MarketIndex | null; label: string; key?: string }) {
  const isUp = (data?.change ?? 0) >= 0;
  return (
    <div className={`card index-card ${data ? (isUp ? 'up' : 'down') : ''}`}>
      <div className="index-name">{label}</div>
      {data ? (
        <>
          <div className={`index-value ${isUp ? 'up-text' : 'down-text'}`}>
            {formatPrice(data.price)}
          </div>
          <ChangeTag change={data.change} pct={data.change_pct} />
          <div className="index-meta">
            {data.source} · {new Date(data.ts).toLocaleTimeString()}
          </div>
        </>
      ) : (
        <>
          <Skeleton className="skeleton-value" />
          <Skeleton className="skeleton-text" />
        </>
      )}
    </div>
  );
}

export default function DashboardClient() {
  const [twIndex, setTwIndex] = useState<MarketIndex | null>(null);
  const [usIndices, setUsIndices] = useState<MarketIndex[]>([]);
  const [ticker, setTicker] = useState<string>(DEFAULT_TICKERS[0]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [ind, setInd] = useState<IndicatorsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stockMsg, setStockMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['ma']);

  const normalizedTicker = useMemo(() => {
    const raw = ticker.trim().toUpperCase();
    if (!raw) return raw;
    if (raw.includes(':')) return raw;
    if (/^\d{3,6}$/.test(raw)) return `TW:${raw}`;
    if (/^[A-Z.]{1,10}$/.test(raw)) return `US:${raw}`;
    return raw;
  }, [ticker]);

  // Load market indices
  useEffect(() => {
    (async () => {
      if (API_BASE_URL) {
        try {
          const tw = await apiGet<MarketIndex>('/api/market/tw/index');
          setTwIndex(tw);
        } catch { }
        try {
          const us = await apiGet<{ items: MarketIndex[] }>('/api/market/us/indices');
          setUsIndices(us.items || []);
        } catch { }
      } else {
        try {
          const res = await fetch('./data/taiex.json', { cache: 'no-store' });
          if (res.ok) setTwIndex(await res.json());
        } catch { }
        try {
          const res = await fetch('./data/us-indices.json', { cache: 'no-store' });
          if (res.ok) {
            const us = await res.json();
            setUsIndices(us.items || []);
          }
        } catch { }
      }
    })();
  }, []);

  const loadTicker = useCallback(async (t: string) => {
    setLoading(true);
    setStockMsg(null);
    setError(null);

    if (API_BASE_URL) {
      try {
        const q = await apiGet<Quote>(`/api/stock/${encodeURIComponent(t)}/quote`);
        setQuote(q);
      } catch (e: any) {
        setQuote(null);
        setError(e?.message || String(e));
      }
      try {
        const h = await apiGet<HistoryResponse>(
          `/api/stock/${encodeURIComponent(t)}/history?interval=1d&period=1y`
        );
        setHistory(h);
      } catch {
        setHistory(null);
      }
      try {
        const r = await apiGet<IndicatorsResponse>(
          `/api/stock/${encodeURIComponent(t)}/indicators?interval=1d&period=1y&types=ma,rsi,macd`
        );
        setInd(r);
      } catch {
        setInd(null);
      }
    } else {
      try {
        const stooq = mapTickerToStooqSymbol(t);
        const candles = await fetchStooqDailyHistory(stooq);
        setHistory({ ticker: t, interval: '1d', candles });
        const last = candles[candles.length - 1];
        if (last) {
          const prev = candles.length > 1 ? candles[candles.length - 2] : null;
          const chg = prev ? last.close - prev.close : null;
          const chgPct = prev && prev.close ? (chg! / prev.close * 100) : null;
          setQuote({
            ticker: t, ts: last.time, price: last.close,
            currency: t.startsWith('TW:') ? 'TWD' : 'USD',
            source: 'stooq', is_delayed: true,
            open: last.open, high: last.high, low: last.low,
            volume: last.volume ?? null,
            change: chg ? Math.round(chg * 100) / 100 : null,
            change_pct: chgPct ? Math.round(chgPct * 100) / 100 : null,
          });
        } else {
          setQuote(null);
        }
        setInd(null);
      } catch {
        setQuote(null);
        setHistory(null);
        setInd(null);
        setStockMsg(`無法載入 ${t}。請嘗試其他股票或部署後端。`);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTicker(normalizedTicker);
  }, []);

  const isUp = (quote?.change ?? 0) >= 0;

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-title">總覽儀表板</div>
          <div className="page-subtitle">
            {new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </div>
        <div className="header-actions">
          <span className="status-badge delayed">
            <span className="pulse-dot" /> 延遲資料
          </span>
        </div>
      </div>

      {/* Market indices */}
      <div className="section">
        <div className="section-title">大盤指數</div>
        <div className="grid grid-4">
          <IndexCard data={twIndex} label="加權指數" />
          {usIndices.length > 0 ? (
            usIndices.map((idx: MarketIndex) => (
              <IndexCard key={idx.code} data={idx} label={idx.name} />
            ))
          ) : (
            <>
              <IndexCard data={null} label="S&P 500" />
              <IndexCard data={null} label="Nasdaq" />
              <IndexCard data={null} label="Dow Jones" />
            </>
          )}
        </div>
      </div>

      {/* Ticker selection + Quick switch */}
      <div className="section">
        <div className="card">
          <div className="card-header">
            <div className="card-title">個股查詢</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {DEFAULT_TICKERS.map((t) => (
                <button
                  key={t}
                  className={`btn-chip btn ${normalizedTicker === t ? 'active' : ''}`}
                  onClick={() => { setTicker(t); loadTicker(t); }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="ticker-input-group">
            <input
              className="input mono"
              value={ticker}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTicker(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') { setTicker(normalizedTicker); loadTicker(normalizedTicker); }
              }}
              placeholder="輸入股票代號：2330 / TW:2330 / AAPL / US:AAPL"
            />
            <button
              className="btn btn-primary"
              onClick={() => { setTicker(normalizedTicker); loadTicker(normalizedTicker); }}
              disabled={loading}
            >
              {loading ? '⏳ 載入中...' : '🔍 查詢'}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="section">
          <div className="banner banner-error">⚠️ {error}</div>
        </div>
      )}
      {stockMsg && (
        <div className="section">
          <div className="banner banner-warning">💡 {stockMsg}</div>
        </div>
      )}

      {/* Quote panel */}
      {quote && (
        <div className="section">
          <div className="card">
            <div className="card-header">
              <div>
                <span style={{ fontSize: 18, fontWeight: 800 }}>{quote.ticker}</span>
                <span className="muted" style={{ marginLeft: 12, fontSize: 12 }}>
                  {quote.source} · {new Date(quote.ts).toLocaleString()}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={`mono ${isUp ? 'up-text' : 'down-text'}`} style={{ fontSize: 28, fontWeight: 800 }}>
                  {formatPrice(quote.price)} <span style={{ fontSize: 14 }}>{quote.currency}</span>
                </div>
                <ChangeTag change={quote.change} pct={quote.change_pct} />
              </div>
            </div>

            <div className="quote-grid">
              <div className="quote-item">
                <div className="quote-label">開盤</div>
                <div className="quote-value">{quote.open != null ? formatPrice(quote.open) : '—'}</div>
              </div>
              <div className="quote-item">
                <div className="quote-label">最高</div>
                <div className="quote-value up-text">{quote.high != null ? formatPrice(quote.high) : '—'}</div>
              </div>
              <div className="quote-item">
                <div className="quote-label">最低</div>
                <div className="quote-value down-text">{quote.low != null ? formatPrice(quote.low) : '—'}</div>
              </div>
              <div className="quote-item">
                <div className="quote-label">成交量</div>
                <div className="quote-value">{quote.volume ? formatVolume(quote.volume) : '—'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="section">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              K 線圖 {history?.candles?.length ? `· ${history.candles.length} 根` : ''}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['ma', 'rsi', 'macd'].map((type: string) => (
                <button
                  key={type}
                  className={`btn-chip btn ${activeIndicators.includes(type) ? 'active' : ''}`}
                  onClick={() => {
                    setActiveIndicators((prev: string[]) =>
                      prev.includes(type) ? prev.filter((t: string) => t !== type) : [...prev, type]
                    );
                  }}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {loading && !history ? (
            <Skeleton className="skeleton-chart" />
          ) : history?.candles?.length ? (
            <StockChart candles={history.candles} />
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="muted">選擇股票以顯示 K 線圖</span>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="section">
        <div className="card">
          <div className="card-header">
            <div className="card-title">搜尋股票</div>
            <div className="card-label">輸入中文名稱、代號或英文名</div>
          </div>
          <StockSearch onPick={(t) => { setTicker(t); loadTicker(t); }} />
        </div>
      </div>
    </>
  );
}
