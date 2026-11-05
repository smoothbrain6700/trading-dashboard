import { el } from '../ui/el.js';
import { renderPosition } from '../renderers/positions/index.js';

export function render(d) {
if (!d.accounts.length) return el('p', { class: 'muted' }, 'No accounts in this data.');
return el('div', null, d.accounts.map((a) => el('section', { 'aria-label': a.label },
el('h2', null, a.label),
a.status === 'no_data' ? el('p', { class: 'muted' }, 'No ledger yet')
: a.status === 'error' ? el('p', { class: 'neg' }, "Ledger couldn't be read this run.")
: a.positions.length ? a.positions.map(renderPosition) : el('p', { class: 'muted' }, 'No open positions.'))));
}
