// Public (no-key) APIs for GitHub Pages demo.
// Note: these endpoints may change; this is best-effort demo.

export async function fetchTaiexSnapshot(): Promise<{ price: number; ts: string; source: string; is_delayed: boolean }> {
  const url = 'https://www.twse.com.tw/exchangeReport/MI_INDEX?response=json&type=IND';
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`TWSE ${res.status}`);
  const data: any = await res.json();

  let price: number | null = null;

  for (const key of ['data1', 'data9', 'data8', 'data']) {
    const rows = data?.[key];
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      if (!Array.isArray(row)) continue;
      const rowStr = row.join(' ');
      if (rowStr.includes('加權') || rowStr.includes('發行量加權') || rowStr.includes('TAIEX')) {
        const nums: number[] = [];
        for (const cell of row) {
          const s = String(cell).replaceAll(',', '');
          const v = Number(s);
          if (Number.isFinite(v)) nums.push(v);
        }
        if (nums.length) {
          price = nums[0];
          break;
        }
      }
    }
    if (price !== null) break;
  }

  if (price === null) throw new Error('Unable to parse TAIEX from TWSE');
  return { price, ts: new Date().toISOString(), source: 'twse', is_delayed: true };
}

// Stooq provides free CSV for US indices. It's delayed but good enough for demo.
async function fetchStooqLast(symbol: string): Promise<number> {
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`stooq ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('stooq empty');
  const cols = lines[1].split(',');
  const close = Number(cols[6]);
  if (!Number.isFinite(close)) throw new Error('stooq bad close');
  return close;
}

export async function fetchUsIndices(): Promise<Array<{ code: string; name: string; price: number }>> {
  const items = await Promise.all([
    fetchStooqLast('^spx').then((p) => ({ code: '^GSPC', name: 'S&P 500', price: p })),
    fetchStooqLast('^ndq').then((p) => ({ code: '^IXIC', name: 'Nasdaq', price: p })),
    fetchStooqLast('^dji').then((p) => ({ code: '^DJI', name: 'Dow Jones', price: p }))
  ]);
  return items;
}
