'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, API_BASE_URL } from './api';
import type { HistoryResponse, IndicatorsResponse, MarketIndex, Quote } from './types';
import StockChart from './StockChart';
import { fetchTaiexSnapshot, fetchUsIndices } from './publicApis';

const DEFAULT_TICKERS = ['TW:2330', 'US:AAPL'];

export default function DashboardClient() {
  const [twIndex, setTwIndex] = useState<MarketIndex | null>(null);
  const [usIndices, setUsIndices] = useState<MarketIndex[]>([]);

  const [ticker, setTicker] = useState<string>(DEFAULT_TICKERS[1]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [ind, setInd] = useState<IndicatorsResponse | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const candleCount = history?.candles?.length ?? 0;

  const normalizedTicker = useMemo(() => {
    const t = ticker.trim().toUpperCase();
    return t;
  }, [ticker]);

  useEffect(() => {
    (async () => {
      // If backend is configured, use it; otherwise fall back to public no-key APIs.
      if (API_BASE_URL) {
        try {
          setError(null);
          const tw = await apiGet<MarketIndex>('/api/market/tw/index');
          setTwIndex(tw);
        } catch (e: any) {
          setError(e?.message || String(e));
        }

        try {
          const us = await apiGet<{ items: MarketIndex[] }>('/api/market/us/indices');
          setUsIndices(us.items || []);
        } catch {
          // allow empty
        }
        return;
      }

      try {
        setError(null);
        const tw = await fetchTaiexSnapshot();
        setTwIndex({
          code: 'TAIEX',
          name: '加權指數',
          ts: tw.ts,
          price: tw.price,
          currency: 'TWD',
          source: tw.source,
          is_delayed: tw.is_delayed
        });
      } catch (e: any) {
        setError(e?.message || String(e));
      }

      try {
        const list = await fetchUsIndices();
        setUsIndices(
          list.map((x) => ({
            code: x.code,
            name: x.name,
            ts: new Date().toISOString(),
            price: x.price,
            currency: 'USD',
            source: 'stooq',
            is_delayed: true
          }))
        );
      } catch {
        // allow empty
      }
    })();
  }, []);

  async function loadTicker(t: string) {
    setLoading(true);
    setError(null);
    try {
      const q = await apiGet<Quote>(`/api/stock/${encodeURIComponent(t)}/quote`);
      setQuote(q);
    } catch (e: any) {
      setQuote(null);
      setError(e?.message || String(e));
    }

    try {
      const h = await apiGet<HistoryResponse>(`/api/stock/${encodeURIComponent(t)}/history?interval=1d&period=1y`);
      setHistory(h);
    } catch (e: any) {
      setHistory(null);
      setError((prev) => prev || (e?.message || String(e)));
    }

    try {
      const r = await apiGet<IndicatorsResponse>(
        `/api/stock/${encodeURIComponent(t)}/indicators?interval=1d&period=1y&types=ma,rsi,macd`
      );
      setInd(r);
    } catch {
      setInd(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadTicker(normalizedTicker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="grid grid-3">
        <div className="card">
          <div className="small">台股指數</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{twIndex?.price ?? '—'}</div>
          <div className="small mono">{twIndex ? `${twIndex.source} · delayed=${twIndex.is_delayed}` : ''}</div>
        </div>
        <div className="card">
          <div className="small">美股指數</div>
          {usIndices.length ? (
            <div style={{ marginTop: 6 }}>
              {usIndices.map((x) => (
                <div key={x.code} className="row" style={{ justifyContent: 'space-between' }}>
                  <div className="small">{x.name}</div>
                  <div className="mono small">{x.price.toFixed(2)}</div>
                </div>
              ))}
              <div className="small mono" style={{ marginTop: 6 }}>yahoo · delayed=true</div>
            </div>
          ) : (
            <div className="small" style={{ marginTop: 6, opacity: 0.85 }}>—</div>
          )}
        </div>
        <div className="card">
          <div className="small">快速切換</div>
          <div className="row" style={{ marginTop: 8 }}>
            {DEFAULT_TICKERS.map((t) => (
              <button key={t} className="btn" onClick={() => { setTicker(t); loadTicker(t); }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700 }}>個股</div>
            <div className="small">輸入 ticker：例如 TW:2330 / US:AAPL</div>
          </div>
          <div className="small mono">candles={candleCount}</div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <input
            className="input mono"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="TW:2330"
          />
          <button className="btn" onClick={() => loadTicker(normalizedTicker)} disabled={loading}>
            {loading ? '載入中' : '載入'}
          </button>
        </div>

        {error && (
          <div className="card" style={{ marginTop: 12, borderColor: 'rgba(220,38,38,0.5)' }}>
            <div style={{ fontWeight: 700 }}>錯誤</div>
            <div className="small mono" style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
          </div>
        )}

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 12 }}>
          <div className="card">
            <div className="small">Quote</div>
            <div className="mono small" style={{ whiteSpace: 'pre-wrap' }}>{quote ? JSON.stringify(quote, null, 2) : '—'}</div>
          </div>
          <div className="card">
            <div className="small">Indicators</div>
            <div className="mono small" style={{ whiteSpace: 'pre-wrap' }}>{ind ? JSON.stringify(ind.indicators, null, 2) : '—'}</div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <div className="small">K 線</div>
          {history?.candles?.length ? <StockChart candles={history.candles} /> : <div className="small">—</div>}
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 700 }}>搜尋（下一步接 DB）</div>
        <div className="small">MVP 先放 UI，等我們把 stocks table + search endpoint 接上就會出現結果。</div>
      </div>
    </div>
  );
}
