import { el } from './el.js';
export function badge(text, tone = 'muted') {
  return el('span', { class: `badge tone-${tone}` }, text);
}
