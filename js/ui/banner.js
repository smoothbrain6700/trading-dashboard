import { el } from './el.js';
import { CONFIG } from '../config.js';
import { staleness } from '../data/normalize.js';
import * as f from '../format.js';
export function banner(text, tone = 'warn') {
  return el('div', { class: `banner ${tone}`, role: tone === 'err' ? 'alert' : 'status' }, text);
}
export function staleBanner(iso, what = 'Data') {
  const s = staleness(f.parseTime(iso), Date.now(), { parts: f.ptParts, instant: f.ptInstant });
  if (!s) return { stale: null, node: null };
  const from = f.time(iso);
  if (s.level === 'err') return { stale: s, node: banner(`${what} is from ${from}, more than ${CONFIG.staleRedDays} days old.`, 'err') };
  const tail = s.today ? "Today's run hasn't landed yet." : "The latest run hasn't landed yet.";
  return { stale: s, node: banner(`${what} is from ${from}. ${tail}`, 'warn') };
}
