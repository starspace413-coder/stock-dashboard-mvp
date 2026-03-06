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

  // TAIEX (TWSE OpenAPI JSON)
  const twseUrl = 'https://openapi.twse.com.tw/v1/exchangeReport/MI_INDEX';
  const rows = await fetchJson(twseUrl);
  const row = Array.isArray(rows)
    ? rows.find((r) => String(r?.['指數'] || '').includes('發行量加權股價指數'))
    : null;
  if (!row) throw new Error('Unable to find TAIEX row from TWSE OpenAPI');
  const price = Number(String(row['收盤指數']).replaceAll(',', ''));
  const changePoints = Number(String(row['漲跌點數']).replaceAll(',', ''));
  const changeSign = String(row['漲跌']).trim();
  const signedChange = Number.isFinite(changePoints)
    ? (changeSign === '-' ? -changePoints : changePoints)
    : null;
  const changePct = Number(String(row['漲跌百分比']).replaceAll(',', ''));

  const taiex = {
    code: 'TAIEX',
    name: '加權指數',
    ts,
    price,
    change: signedChange,
    change_pct: Number.isFinite(changePct) ? changePct : null,
    currency: 'TWD',
    source: 'twse-openapi',
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
