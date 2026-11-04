import { el } from '../../ui/el.js';
import { badge } from '../../ui/badge.js';
import * as f from '../../format.js';

export function renderGeneric(p) {
  return el('div', { class: 'card' },
    el('div', { class: 'row' },
      el('h3', null, p.symbol, ' ', badge(p.kind || 'position', 'muted')),
      el('span', { class: f.tone(p.unrealized) }, f.signedMoney(p.unrealized))),
    el('div', { class: 'reason' }, p.entry_reason || p.reason || ''));
}
