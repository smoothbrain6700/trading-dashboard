import { el } from '../ui/el.js';
import { sparkline } from '../ui/sparkline.js';
import * as f from '../format.js';

const STATUS = { ok: 'OK', partial: 'Partial', error: 'Error' };

function accountCard(a) {
if (a.status === 'no_data') return el('div', { class: 'card' }, el('h3', null, a.label), el('p', { class: 'muted' }, 'No ledger yet'));
if (a.status === 'error') return el('div', { class: 'card' }, el('h3', null, a.label), el('p', { class: 'neg' }, "Ledger couldn't be read this run."));
return el('div', { class: 'card' },
el('div', { class: 'row' }, el('h3', null, a.label), el('span', { class: 'muted' }, `as of ${f.date(a.as_of)}`)),
el('div', { class: 'kv' },
el('div', null, el('span', null, 'Equity'), el('span', null, f.money(a.equity))),
el('div', null, el('span', null, 'P&L'), el('span', { class: f.tone(a.pnl) }, `${f.signedMoney(a.pnl)} (${f.pct(a.pnl_pct)})`)),
el('div', null, el('span', null, 'Day'), el('span', { class: f.tone(a.day_pnl) }, f.signedMoney(a.day_pnl))),
el('div', null, el('span', null, 'Open'), el('span', null, String(a.positions.length)))),
sparkline(a.equity_history.map((h) => h.equity), { label: `${a.label} equity history` }));
}

export function render(d) {
const t = d.totals, run = d.run;
const issues = run.issues.length
? el('details', { class: 'card' }, el('summary', null, `${run.issues.length} issue${run.issues.length > 1 ? 's' : ''} last run`),
el('ul', { class: 'reason' }, run.issues.map((i) => el('li', null, i))))
: null;
const pub = run.previous_publish && run.previous_publish.ok === false
? el('p', { class: 'reason' }, 'Previous publish failed: ', String(run.previous_publish.message || '')) : null;
return el('div', null,
el('section', { class: 'card', 'aria-label': 'Totals' },
el('div', { class: 'muted' }, 'Total equity'),
el('div', { class: 'big' }, f.money(t.equity)),
el('div', { class: 'kv' },
el('div', null, el('span', null, 'Total P&L'), el('span', { class: f.tone(t.pnl) }, `${f.signedMoney(t.pnl)} (${f.pct(t.pnl_pct)})`)),
el('div', null, el('span', null, 'Day P&L'), el('span', { class: f.tone(t.day_pnl) }, f.signedMoney(t.day_pnl))),
el('div', null, el('span', null, 'Last run'), el('span', null, `${f.dateTime(d.generated_at)} · ${STATUS[run.status]}`))),
pub),
issues,
d.accounts.length ? d.accounts.map(accountCard) : el('p', { class: 'muted' }, 'No accounts in this data.'));
}
