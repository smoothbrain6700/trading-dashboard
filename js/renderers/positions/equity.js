import { el } from '../../ui/el.js';
import { badge } from '../../ui/badge.js';
import * as f from '../../format.js';
import { CONFIG } from '../../config.js';

export function renderEquity(p) {
  const left = typeof p.pct_to_stop === 'number' ? Math.abs(p.pct_to_stop) : null;
  const frac = left === null ? 0 : Math.max(0, Math.min(1, left / CONFIG.stopPct));
  const level = frac < 0.25 ? ' crit' : frac < 0.5 ? ' low' : '';
  return el('div', { class: 'card' },
    el('div', { class: 'row' },
      el('h3', null, p.symbol, ' ', badge(p.strategy || '—', 'blue')),
      el('span', { class: f.tone(p.unrealized) }, f.signedMoney(p.unrealized), ' (', f.pct(p.unrealized_pct), ')')),
    el('div', { class: 'kv' },
      el('div', null, el('span', null, 'Qty @ entry'), el('span', null, `${f.qty(p.qty)} @ ${f.price(p.entry_price)}`)),
      el('div', null, el('span', null, 'Last'), el('span', null, f.price(p.last_price))),
      el('div', null, el('span', null, 'Stop'), el('span', null, `${f.price(p.stop_price)} (${f.pct(left === null ? null : -left, 1)} away)`)),
      el('div', null, el('span', null, 'Held'), el('span', null, `Day ${p.bars_held ?? '—'} of ${p.max_hold_bars ?? '—'}`))),
    el('div', { class: 'bar' + level, role: 'img', 'aria-label': `Distance to stop ${f.pct(left, 1, false)}` },
      el('i', { style: { width: `${(frac * 100).toFixed(0)}%` } })),
    p.exit_watch ? el('div', { class: 'reason' }, p.exit_watch) : null,
    p.entry_reason ? el('div', { class: 'reason' }, 'Entry: ', p.entry_reason) : null);
}
