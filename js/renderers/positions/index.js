// Position renderers, registered by `kind`. A new instrument = one renderer file + one line here.
import { renderEquity } from './equity.js';
import { renderSpread } from './spread.js';
import { renderGeneric } from './generic.js';

export const RENDERERS = { equity: renderEquity, spread: renderSpread };

export function renderPosition(p) {
  const r = Object.prototype.hasOwnProperty.call(RENDERERS, p.kind) ? RENDERERS[p.kind] : renderGeneric;
  try { return r(p); } catch { return renderGeneric(p); }
}
