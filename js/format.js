import { CONFIG } from './config.js';

const DASH = '—';
const MINUS = '\u2212'; // typographic minus, as in the exporter's reasons ('−5.0%')
const neg = (txt) => txt.replace(/^-/, MINUS);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const intl = (opts) => new Intl.NumberFormat('en-US', opts);
const usd = intl({ minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function money(v) {
  if (!isNum(v)) return DASH;
  return (v < 0 ? MINUS + '$' : '$') + usd.format(Math.abs(v));
}
export function signedMoney(v) {
  if (!isNum(v)) return DASH;
  return (v > 0 ? '+' : v < 0 ? MINUS : '') + '$' + usd.format(Math.abs(v));
}
export function pct(v, dp = CONFIG.pctDecimals, signed = true) {
  if (!isNum(v)) return DASH;
  const s = (Math.abs(v) * 100).toFixed(dp);
  const zero = Number(s) === 0; // no '−0.0%'
  return (v > 0 && signed && !zero ? '+' : v < 0 && !zero ? MINUS : '') + s + '%';
}
export function price(v) {
  if (!isNum(v)) return DASH;
  const dp = Math.abs(v) < 1 ? CONFIG.priceSmallDecimals : CONFIG.priceDecimals;
  return neg(intl({ minimumFractionDigits: dp, maximumFractionDigits: dp }).format(v));
}
export function qty(v) {
  if (!isNum(v)) return DASH;
  return Number.isInteger(v) ? String(v) : intl({ maximumFractionDigits: 6 }).format(v);
}
export function fixed(v, dp = 2) {
  if (!isNum(v)) return DASH;
  const s = v.toFixed(dp);
  return Number(s) === 0 ? s.replace(/^-/, '') : neg(s);
}
export function num(v, dp = 2, sig = CONFIG.smallSigFigs || 4) {
  if (!isNum(v)) return DASH;
  if (v === 0 || Math.abs(v) >= 1) return fixed(v, dp);
  let dec = Math.min(Math.max(sig - 1 - Math.floor(Math.log10(Math.abs(v))), 0), 20);
  const r = Number(Math.abs(v).toFixed(dec));
  if (r >= 1) return fixed(v, dp);
  if (r > 0) dec = Math.min(Math.max(sig - 1 - Math.floor(Math.log10(r)), 0), 20);
  return fixed(v, dec);
}
export function tone(v) {
  return !isNum(v) || v === 0 ? '' : v > 0 ? 'pos' : 'neg';
}
function parts(ms) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: CONFIG.timeZone, hourCycle: 'h23', weekday: 'short', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const o = {};
  for (const p of f.formatToParts(new Date(ms))) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, min: +o.minute, s: +o.second, wd: o.weekday };
}
export const ptParts = parts;
export function ptInstant(y, m, d, h = 0, min = 0) {
  const guess = Date.UTC(y, m - 1, d, h, min);
  const p = parts(guess);
  const offset = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min) - guess;
  return guess - offset;
}
export function parseTime(iso) {
  const t = typeof iso === 'string' ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : null;
}
export function time(iso) {
  const t = parseTime(iso);
  if (t === null) return DASH;
  return new Intl.DateTimeFormat('en-US', { timeZone: CONFIG.timeZone, weekday: 'short', hour: 'numeric', minute: '2-digit' })
    .format(new Date(t)).replace(',', '') + ' ' + CONFIG.tzLabel;
}
export function dateTime(iso) {
  const t = parseTime(iso);
  if (t === null) return DASH;
  return new Intl.DateTimeFormat('en-US', { timeZone: CONFIG.timeZone, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    .format(new Date(t)) + ' ' + CONFIG.tzLabel;
}
export function date(s) {
  return typeof s === 'string' && s ? s : DASH;
}
export { DASH, MINUS, isNum };
