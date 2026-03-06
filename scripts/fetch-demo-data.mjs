import fs from 'node:fs/promises';
import path from 'node:path';

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'stock-dashboard-mvp' } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return await res.text();
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'stock-dashboard-mvp' } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return await res.json();
}

function parseTaiex(data) {
  let price = null;
  for (const key of ['data1', 'data9', 'data8', 'data']) {
    const rows = data?.[key];
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      if (!Array.isArray(row)) continue;
      const rowStr = row.join(' ');
      if (rowStr.includes('加權') || rowStr.includes('發行量加權') || rowStr.includes('TAIEX')) {
        const nums = [];
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
  if (price === null) throw new Error('Unable to parse TAIEX');
  return price;
}

function parseStooqLast(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) throw new Error('stooq empty');
  const cols = lines[1].split(',');
  const close = Number(cols[6]);
  if (!Number.isFinite(close)) throw new Error('stooq bad close');
  return close;
}

async function main() {
  const outDir = path.resolve('frontend/public/data');
  await fs.mkdir(outDir, { recursive: true });
  const ts = new Date().toISOString();

  // TAIEX
  const twseUrl = 'https://www.twse.com.tw/exchangeReport/MI_INDEX?response=json&type=IND';
  const twse = await fetchJson(twseUrl);
  const taiex = {
    code: 'TAIEX',
    name: '加權指數',
    ts,
    price: parseTaiex(twse),
    currency: 'TWD',
    source: 'twse',
    is_delayed: true
  };
  await fs.writeFile(path.join(outDir, 'taiex.json'), JSON.stringify(taiex, null, 2));

  // US indices via stooq
  const mapping = [
    ['^spx', '^GSPC', 'S&P 500'],
    ['^ndq', '^IXIC', 'Nasdaq'],
    ['^dji', '^DJI', 'Dow Jones']
  ];

  const items = [];
  for (const [stooqSym, code, name] of mapping) {
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSym)}&f=sd2t2ohlcv&h&e=csv`;
    const csv = await fetchText(url);
    items.push({
      code,
      name,
      ts,
      price: parseStooqLast(csv),
      currency: 'USD',
      source: 'stooq',
      is_delayed: true
    });
  }
  await fs.writeFile(path.join(outDir, 'us-indices.json'), JSON.stringify({ ts, items }, null, 2));

  console.log('Wrote demo data to', outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
