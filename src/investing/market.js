const originalInstruments = [
  { symbol: '510300', name: '沪深300ETF', secid: '1.510300', kind: '宽基ETF', risk: '覆盖沪深大盘股，仍有较大权益回撤。' },
  { symbol: '510500', name: '中证500ETF', secid: '1.510500', kind: '宽基ETF', risk: '中盘股波动较大，适合观察风格差异。' },
  { symbol: '510880', name: '红利ETF', secid: '1.510880', kind: '红利ETF', risk: '高股息不等于保本，存在行业集中风险。' },
  { symbol: '511010', name: '国债ETF', secid: '1.511010', kind: '债券ETF', risk: '价格受利率影响，债券基金也可能亏损。' },
  { symbol: '600519', name: '贵州茅台', secid: '1.600519', kind: '股票样本', risk: '仅作个股教学样本，企业和估值风险集中。' },
];

const cn = (symbol, name, kind = '股票样本', risk = '个股存在经营、估值和集中风险。') => ({ symbol, name, secid: `${symbol.startsWith('6') || symbol.startsWith('5') ? 1 : 0}.${symbol}`, kind, risk });
const overseas = (symbol, name, market, secid, lotSize, kind = '股票样本') => ({ symbol, name, market, secid, lotSize, kind, currency: market === 'US' ? 'USD' : 'HKD', risk: '海外资产有企业、估值、汇率及当地市场制度风险。跨境ETF另有跟踪与溢价风险。' });
export const instruments = [
  ...originalInstruments,
  cn('159915', '创业板ETF', '宽基ETF'), cn('588000', '科创50ETF', '宽基ETF'),
  cn('512800', '银行ETF', '行业ETF'), cn('512660', '军工ETF', '行业ETF'),
  cn('513100', '纳指ETF', '跨境ETF'), cn('518880', '黄金ETF', '黄金ETF'),
  cn('000001', '平安银行'), cn('000333', '美的集团'), cn('000651', '格力电器'),
  cn('002594', '比亚迪'), cn('600036', '招商银行'), cn('601318', '中国平安'),
  cn('600900', '长江电力'), cn('601088', '中国神华'), cn('600030', '中信证券'),
  overseas('00700', '腾讯控股', 'HK', '116.00700', 100),
  overseas('09988', '阿里巴巴', 'HK', '116.09988', 100),
  overseas('01810', '小米集团', 'HK', '116.01810', 200),
  overseas('03690', '美团', 'HK', '116.03690', 100),
  overseas('02800', '盈富基金', 'HK', '116.02800', 500, '宽基ETF'),
  overseas('03033', '南方恒生科技', 'HK', '116.03033', 200, '行业ETF'),
  overseas('AAPL', '苹果', 'US', '105.AAPL', 1), overseas('MSFT', '微软', 'US', '105.MSFT', 1),
  overseas('NVDA', '英伟达', 'US', '105.NVDA', 1), overseas('GOOGL', '谷歌', 'US', '105.GOOGL', 1),
  overseas('AMZN', '亚马逊', 'US', '105.AMZN', 1), overseas('TSLA', '特斯拉', 'US', '105.TSLA', 1),
  overseas('SPY', '标普500ETF', 'US', '107.SPY', 1, '宽基ETF'),
  overseas('QQQ', '纳斯达克100ETF', 'US', '105.QQQ', 1, '宽基ETF'),
  overseas('VT', '全球股票ETF', 'US', '107.VT', 1, '宽基ETF'),
  overseas('BND', '美国综合债券ETF', 'US', '105.BND', 1, '债券ETF'),
  overseas('TLT', '美国长期国债ETF', 'US', '105.TLT', 1, '债券ETF'),
  overseas('SCHD', '美国红利ETF', 'US', '107.SCHD', 1, '红利ETF'),
].map(item => ({ market: 'CN', currency: 'CNY', lotSize: 100, ...item, tPlusOne: !item.market && !['513100', '518880', '511010'].includes(item.symbol), priceLimit: item.market ? null : item.symbol.startsWith('588') || item.symbol.startsWith('159915') ? 0.2 : ['513100', '518880', '511010'].includes(item.symbol) ? null : 0.1 }));

export const marketLabels = { CN: 'A股', HK: '港股', US: '美股' };
export const instrumentBySymbol = symbol => instruments.find(item => item.symbol === symbol);
export const marketDate = (symbol, now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: instrumentBySymbol(symbol)?.market === 'US' ? 'America/New_York' : 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));

export const shanghaiDate = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
export function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
export function validBars(bars, today = shanghaiDate()) {
  if (!Array.isArray(bars)) return [];
  const seen = new Set();
  return bars.filter(bar => {
    if (!validDate(bar.date) || bar.date >= today || seen.has(bar.date) || !Number.isFinite(bar.close) || bar.close <= 0) return false;
    if ([bar.open, bar.high, bar.low].some(value => value !== undefined) && (![bar.open, bar.high, bar.low].every(value => Number.isFinite(value) && value > 0) || bar.high < Math.max(bar.open, bar.close) || bar.low > Math.min(bar.open, bar.close) || bar.high < bar.low)) return false;
    seen.add(bar.date); return true;
  }).sort((a, b) => a.date.localeCompare(b.date));
}
export function getQuote(market, symbol) {
  return market?.instruments?.find(item => item.symbol === symbol);
}
export function validateMarket(data) {
  if (data?.schemaVersion !== 1 || !Array.isArray(data.instruments)) throw new Error('行情文件格式异常');
  return { ...data, instruments: data.instruments.filter(item => instrumentBySymbol(item.symbol)).map(item => ({ ...instrumentBySymbol(item.symbol), bars: validBars(item.bars, marketDate(item.symbol)), fetchedAt: item.fetchedAt || null, error: item.error || null })) };
}
