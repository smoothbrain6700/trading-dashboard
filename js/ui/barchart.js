import { el } from './el.js';
import * as f from '../format.js';
export function barChart({ rows }) {
const max = Math.max(...rows.map(r => Math.abs(r.value)), 0) || 1;
return el('div', { class: 'bars' }, rows.map(r => el('div', { class: 'brow' },
el('div', { class: 'row' }, el('span', { class: 'blabel' }, r.label), el('span', { class: f.tone(r.value) }, f.signedMoney(r.value))),
el('div', { class: 'btrack' }, el('i', { class: r.value < 0 ? 'neg' : 'pos', style: { width: `${((Math.abs(r.value) / max) * 100).toFixed(1)}%` } })),
el('div', { class: 'reason' }, r.note))));
}
