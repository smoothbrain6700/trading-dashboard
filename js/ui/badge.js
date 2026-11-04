import { el } from './el.js';
/** A text label with a color tone (green, red, yellow, blue, muted). Text always carries the meaning. */
export function badge(text, tone = 'muted') {
  return el('span', { class: `badge tone-${tone}` }, text);
}
