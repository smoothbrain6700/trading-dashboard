import { el } from './el.js';
/** tone: 'warn' | 'err' */
export function banner(text, tone = 'warn') {
  return el('div', { class: `banner ${tone}`, role: tone === 'err' ? 'alert' : 'status' }, text);
}
