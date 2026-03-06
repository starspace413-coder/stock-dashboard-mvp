'use client';

import { useEffect, useMemo, useState } from 'react';

type StockItem = {
  ticker: string;
  symbol: string;
  name: string;
  market: 'TW' | 'US';
  currency: string;
  aliases?: string[];
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

function score(item: StockItem, q: string): number {
  const n = norm(q);
  if (!n) return 0;

  const fields = [item.ticker, item.symbol, item.name, ...(item.aliases || [])].map(norm);

  // exact ticker match wins
  if (fields.some((f) => f === n)) return 1000;

  let best = 0;
  for (const f of fields) {
    if (f.startsWith(n)) best = Math.max(best, 300 - (f.length - n.length));
    if (f.includes(n)) best = Math.max(best, 200 - (f.indexOf(n) * 2));
  }

  // Special handling: user types '2330' or 'aapl'
  if (norm(item.symbol) === n) best = Math.max(best, 600);

  return best;
}

export default function StockSearch({ onPick }: { onPick: (ticker: string) => void }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<StockItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('./data/stocks.json', { cache: 'no-store' });
      const data = await res.json();
      setItems(data.items || []);
    })();
  }, []);

  const results = useMemo(() => {
    const qq = q.trim();
    if (!qq) return [] as StockItem[];
    const scored = items
      .map((it) => ({ it, s: score(it, qq) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((x) => x.it);
    return scored;
  }, [items, q]);

  return (
    <div style={{ position: 'relative' }}>
      <input
        className="input"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="搜尋：台積 / 2330 / TSMC / AAPL / Apple..."
      />

      {open && results.length > 0 && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            zIndex: 20,
            padding: 8
          }}
        >
          {results.map((it) => (
            <button
              key={it.ticker}
              className="btn"
              style={{ width: '100%', textAlign: 'left', marginBottom: 6 }}
              onClick={() => {
                onPick(it.ticker);
                setQ('');
                setOpen(false);
              }}
            >
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{it.name}</div>
                  <div className="small mono">{it.ticker}</div>
                </div>
                <div className="small">{it.market}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && q.trim() && results.length === 0 && (
        <div className="card" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 20 }}>
          <div className="small">找不到：{q}</div>
          <div className="small" style={{ opacity: 0.8 }}>目前 demo 內建少量清單，之後會擴充到熱門股/ETF。</div>
        </div>
      )}
    </div>
  );
}
