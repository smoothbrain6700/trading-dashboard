import { el } from '../ui/el.js';
import { badge } from '../ui/badge.js';
import * as f from '../format.js';
import { CONFIG } from '../config.js';

const state = { account: 'all', side: 'all', shown: CONFIG.tradesPageSize };
const SIDE = { buy: 'buy', open: 'buy', cover: 'buy', sell: 'sell', close: 'sell', short: 'sell' };

function chips(options, value, onPick, label) {
return el('div', { class: 'chips', role: 'group', 'aria-label': label },
options.map(([v, text]) => el('button', { type: 'button', class: 'chip', 'aria-pressed': String(v === value), onclick: () => onPick(v) }, text)));
}
function row(t, labels) {
const sell = SIDE[t.side] === 'sell';
return el('li', { class: 'item' },
el('div', { class: 'row' },
el('span', null, `${t.date} `, el('b', null, t.side.toUpperCase()), ` ${t.symbol}`),
el('span', { class: 'muted' }, `${f.qty(t.qty)} @ ${f.price(t.price)} · ${t.strategy || '—'}`)),
sell ? el('div', { class: 'row' },
el('span', { class: f.tone(t.pnl) }, `${f.signedMoney(t.pnl)} (${f.pct(t.pnl_pct)})`),
t.exit_kind ? badge(CONFIG.exitKindLabels[t.exit_kind] || t.exit_kind, t.exit_kind === 'signal' ? 'green' : t.exit_kind === 'max_hold' ? 'muted' : 'red') : null) : null,
el('div', { class: 'reason' }, labels[t.account] ? `${labels[t.account]} · ` : '', t.reason));
}

export function render(d, rerender) {
const labels = Object.fromEntries(d.accounts.map((a) => [a.id, a.label]));
const accts = [...new Set([...d.accounts.map((a) => a.id), ...d.trades.map((t) => t.account)])];
const list = d.trades.filter((t) => (state.account === 'all' || t.account === state.account)
&& (state.side === 'all' || SIDE[t.side] === state.side));
const set = (k) => (v) => { state[k] = v; state.shown = CONFIG.tradesPageSize; rerender(); };
return el('div', null,
chips([['all', 'All accounts'], ...accts.map((a) => [a, labels[a] || a])], state.account, set('account'), 'Account'),
chips([['all', 'Buys & sells'], ['buy', 'Buys'], ['sell', 'Sells']], state.side, set('side'), 'Side'),
!d.trades.length ? el('p', { class: 'muted' }, 'No trades yet.')
: !list.length ? el('p', { class: 'muted' }, 'No trades match these filters.')
: el('section', { class: 'card' }, el('ul', { class: 'list' }, list.slice(0, state.shown).map((t) => row(t, labels)))),
list.length > state.shown ? el('button', { type: 'button', class: 'btn', onclick: () => { state.shown += CONFIG.tradesPageSize; rerender(); } },
`Show more (${list.length - state.shown} left)`) : null);
}
