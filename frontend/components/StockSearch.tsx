'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';

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
  if (fields.some((f) => f === n)) return 1000;
  let best = 0;
  for (const f of fields) {
    if (f.startsWith(n)) best = Math.max(best, 300 - (f.length - n.length));
    if (f.includes(n)) best = Math.max(best, 200 - (f.indexOf(n) * 2));
  }
  if (norm(item.symbol) === n) best = Math.max(best, 600);
  return best;
}

export default function StockSearch({ onPick }: { onPick: (ticker: string) => void }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<StockItem[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('./data/stocks.json', { cache: 'no-store' });
        const data = await res.json();
        setItems(data.items || []);
      } catch { }
    })();
  }, []);

  const results = useMemo(() => {
    const qq = q.trim();
    if (!qq) return [] as StockItem[];
    return items
      .map((it: StockItem) => ({ it, s: score(it, qq) }))
      .filter((x: { it: StockItem; s: number }) => x.s > 0)
      .sort((a: { s: number }, b: { s: number }) => b.s - a.s)
      .slice(0, 8)
      .map((x: { it: StockItem }) => x.it);
  }, [items, q]);

  return (
    <div style={{ position: 'relative' }} ref={wrapperRef}>
      <input
        className="input"
        value={q}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter' && results.length > 0) {
            onPick(results[0].ticker);
            setQ('');
            setOpen(false);
          }
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="台積 / 2330 / TSMC / AAPL / Apple..."
      />

      {open && results.length > 0 && (
        <div className="search-dropdown">
          {results.map((it: StockItem) => (
            <button
              key={it.ticker}
              className="search-item"
              onClick={() => { onPick(it.ticker); setQ(''); setOpen(false); }}
            >
              <div>
                <div className="search-item-name">{it.name}</div>
                <div className="search-item-ticker">{it.ticker}</div>
              </div>
              <span className={`search-item-market ${it.market}`}>{it.market}</span>
            </button>
          ))}
        </div>
      )}

      {open && q.trim() && results.length === 0 && (
        <div className="search-dropdown" style={{ padding: 16 }}>
          <div className="muted" style={{ fontSize: 13 }}>
            找不到「{q}」— 試試代號或英文名
          </div>
        </div>
      )}
    </div>
  );
}
