export const instruments = [
  { symbol: '510300', name: '沪深300ETF', secid: '1.510300', kind: '宽基ETF', risk: '覆盖沪深大盘股，仍有较大权益回撤。' },
  { symbol: '510500', name: '中证500ETF', secid: '1.510500', kind: '宽基ETF', risk: '中盘股波动较大，适合观察风格差异。' },
  { symbol: '510880', name: '红利ETF', secid: '1.510880', kind: '红利ETF', risk: '高股息不等于保本，存在行业集中风险。' },
  { symbol: '511010', name: '国债ETF', secid: '1.511010', kind: '债券ETF', risk: '价格受利率影响，债券基金也可能亏损。' },
  { symbol: '600519', name: '贵州茅台', secid: '1.600519', kind: '股票样本', risk: '仅作个股教学样本，企业和估值风险集中。' },
];

export const shanghaiDate = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
export function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
export function validBars(bars, today = shanghaiDate()) {
  if (!Array.isArray(bars)) return [];
  const seen = new Set();
  return bars.filter(bar => {
    if (!validDate(bar.date) || bar.date >= today || seen.has(bar.date) || !Number.isFinite(bar.close) || bar.close <= 0) return false;
    seen.add(bar.date); return true;
  }).sort((a, b) => a.date.localeCompare(b.date));
}
export function getQuote(market, symbol) {
  return market?.instruments?.find(item => item.symbol === symbol);
}
export function validateMarket(data) {
  if (data?.schemaVersion !== 1 || !Array.isArray(data.instruments)) throw new Error('行情文件格式异常');
  return { ...data, instruments: data.instruments.filter(item => instruments.some(known => known.symbol === item.symbol)).map(item => ({ ...instruments.find(known => known.symbol === item.symbol), bars: validBars(item.bars), fetchedAt: item.fetchedAt || null, error: item.error || null })) };
}
