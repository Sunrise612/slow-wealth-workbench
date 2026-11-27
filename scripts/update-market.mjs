import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { instruments, shanghaiDate, validBars } from '../src/investing/market.js';

const destination = process.env.MARKET_OUTPUT || fileURLToPath(new URL('../data/market.json', import.meta.url));
let previous;
try { previous = JSON.parse(await readFile(destination, 'utf8')); } catch { previous = { instruments: [] }; }
const today = shanghaiDate();
const results = await Promise.all(instruments.map(async item => {
  try {
    const url = new URL('https://push2his.eastmoney.com/api/qt/stock/kline/get');
    url.search = new URLSearchParams({ secid: item.secid, klt: '101', fqt: '0', lmt: '160', end: '20500101', fields1: 'f1,f2,f3,f4,f5,f6', fields2: 'f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61' });
    const response = await fetch(url, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'SlowWealth/1.0', Referer: 'https://quote.eastmoney.com/' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const raw = await response.json();
    if (raw.data?.code !== item.symbol || !Array.isArray(raw.data.klines)) throw new Error('Unexpected market response');
    const bars = validBars(raw.data.klines.map(line => {
      const [date, open, close, high, low, volume] = line.split(',');
      return { date, open: Number(open), close: Number(close), high: Number(high), low: Number(low), volume: Number(volume) };
    }), today).filter(bar => [bar.open,bar.high,bar.low].every(value => Number.isFinite(value) && value > 0) && bar.high >= Math.max(bar.open,bar.close) && bar.low <= Math.min(bar.open,bar.close));
    if (!bars.length) throw new Error('No completed daily bars');
    console.log(`${item.symbol} ${bars.at(-1).date} (${bars.length} bars)`);
    return { ...item, bars, fetchedAt: new Date().toISOString() };
  } catch (error) {
    console.warn(`${item.symbol}: ${error.message}; retaining old data`);
    return { ...item, bars: previous.instruments.find(old => old.symbol === item.symbol)?.bars || [], fetchedAt: previous.instruments.find(old => old.symbol === item.symbol)?.fetchedAt || null, error: '最近更新失败，保留原行情' };
  }
}));
if (!results.some(item => item.bars.length)) throw new Error('All market updates failed; file was not replaced.');
await mkdir(fileURLToPath(new URL('../data/', import.meta.url)), { recursive: true });
await writeFile(destination, JSON.stringify({ schemaVersion: 1, source: '东方财富公开日线', updatedAt: new Date().toISOString(), delay: 'D-1', instruments: results }, null, 2));
if (results.every(item => item.error)) process.exitCode = 1;
