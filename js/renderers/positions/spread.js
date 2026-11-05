import { el } from '../../ui/el.js';
import { badge } from '../../ui/badge.js';
import * as f from '../../format.js';

const TYPES = { bull_put: 'bull put' };

export function renderSpread(p) {
const strikes = `${f.price(p.short_strike)}/${f.price(p.long_strike)}`;
return el('div', { class: 'card' },
el('div', { class: 'row' },
el('h3', null, `${p.symbol} ${strikes} `, badge(TYPES[p.spread_type] || p.spread_type || 'spread', 'blue')),
el('span', { class: f.tone(p.unrealized) }, f.signedMoney(p.unrealized), ' (', f.pct(p.unrealized_pct_of_max), ' of max)')),
el('div', { class: 'kv' },
el('div', null, el('span', null, 'Expiry'), el('span', null, `${f.date(p.expiry)} · ${p.dte ?? '—'} DTE`)),
el('div', null, el('span', null, 'Contracts'), el('span', null, f.qty(p.contracts))),
el('div', null, el('span', null, 'Credit'), el('span', null, f.money(p.credit))),
el('div', null, el('span', null, 'Max loss'), el('span', null, f.money(p.max_loss))),
el('div', null, el('span', null, 'Value now'), el('span', null, f.money(p.current_value))),
el('div', null, el('span', null, 'Underlying'), el('span', null, `${f.price(p.underlying_price)} (${f.pct(p.pct_above_short, 1)} vs short)`))),
el('div', { class: 'reason' }, 'Strategy: ', p.strategy || '—'),
p.exit_watch ? el('div', { class: 'reason' }, p.exit_watch) : null,
p.entry_reason ? el('div', { class: 'reason' }, 'Entry: ', p.entry_reason) : null);
}
