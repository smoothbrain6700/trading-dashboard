import { el } from './el.js';
export function table(columns, rows, caption) {
  return el('table', null,
    caption ? el('caption', { class: 'muted', style: { textAlign: 'left' } }, caption) : null,
    el('thead', null, el('tr', null, columns.map((c) => el('th', { scope: 'col', class: c.cls }, c.label)))),
    el('tbody', null, rows.map((r) => el('tr', { class: r.cls },
      r.cells.map((cell, i) => el('td', { 'data-label': columns[i].label, class: columns[i].cls }, cell))))));
}
