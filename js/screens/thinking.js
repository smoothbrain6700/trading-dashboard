import { el } from '../ui/el.js';
import { badge } from '../ui/badge.js';
import * as f from '../format.js';
import { CONFIG } from '../config.js';

const state = { view: 'all', account: 'all', open: new Set() };
const OPS = { '<=': '≤', '>=': '≥', '<': '<', '>': '>' };

function sorted(rows) {
if (CONFIG.thinkingSort === 'symbol') return [...rows].sort((a, b) => a.symbol.localeCompare(b.symbol));
return [...rows].sort((a, b) => (a.z === null) - (b.z === null) || Math.abs(b.z ?? 0) - Math.abs(a.z ?? 0));
}
function chips(options, value, onPick, label) {
return el('div', { class: 'chips', role: 'group', 'aria-label': label },
options.map(([v, text]) => el('button', { type: 'button', class: 'chip', 'aria-pressed': String(v === value), onclick: () => onPick(v) }, text)));
}
function conditions(t) {
const names = Object.keys(t.conditions);
if (!names.length) return el('div', { class: 'conds muted' }, 'No conditions recorded.');
return el('div', { class: 'conds' }, names.map((s) => [
el('p', null, el('b', null, s)),
t.conditions[s].map((c) => el('p', { class: c.pass ? 'pos' : 'neg' },
`${c.pass ? '✓ pass' : '✗ fail'}  ${c.name}: ${f.num(c.value)} ${OPS[c.op] || c.op} ${f.num(c.threshold)}`))]));
}
function row(t, key, labels, rerender) {
const open = state.open.has(key);
const trend = t.above_trend === null ? '–' : t.above_trend ? '▲ above' : '▼ below';
return el('li', { class: 'item' },
el('button', { type: 'button', class: 'th-row', 'aria-expanded': String(open),
onclick: () => { open ? state.open.delete(key) : state.open.add(key); rerender(); } },
el('div', { class: 'row' },
el('span', { class: 'sym' }, t.symbol),
el('span', { class: 'stats' },
el('span', null, `z ${f.fixed(t.z)}`), el('span', null, `RSI2 ${f.fixed(t.rsi2, 0)}`),
el('span', null, `SMA20 ${f.pct(t.pct_from_sma20, 1)}`),
el('span', { title: t.trend_sma, class: t.above_trend ? 'pos' : t.above_trend === false ? 'neg' : '' }, trend)),
t.badge ? badge(t.badge, CONFIG.badgeTones[t.badge] || 'muted') : null),
el('div', { class: 'reason' }, labels[t.account] ? `${labels[t.account]} · ` : '', t.reason)),
open ? conditions(t) : null);
}

export function render(d, rerender) {
const labels = Object.fromEntries(d.accounts.map((a) => [a.id, a.label]));
const accts = [...new Set(d.thinking.map((t) => t.account))];
const rows = sorted(d.thinking.filter((t) => (state.account === 'all' || t.account === state.account)
&& (state.view === 'all' || (state.view === 'signals' ? CONFIG.signalBadges.includes(t.badge) : t.badge === 'HOLDING'))));
const set = (k) => (v) => { state[k] = v; rerender(); };
return el('div', null,
chips([['all', 'All'], ['signals', 'Signals'], ['holding', 'Holding']], state.view, set('view'), 'Show'),
accts.length > 1 ? chips([['all', 'All accounts'], ...accts.map((a) => [a, labels[a] || a])], state.account, set('account'), 'Account') : null,
!d.thinking.length ? el('p', { class: 'muted' }, 'No watchlist rows in this run.')
: !rows.length ? el('p', { class: 'muted' }, 'Nothing matches these filters.')
: el('section', { class: 'card' }, el('ul', { class: 'list' }, rows.map((t) => row(t, `${t.account}:${t.symbol}`, labels, rerender)))));
}
