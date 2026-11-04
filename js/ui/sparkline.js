import { svg } from './el.js';
/** Inline SVG line of numeric values; a single value draws a dot. */
export function sparkline(values, { width = 300, height = 36, label = 'trend' } = {}) {
  const v = values.filter((x) => typeof x === 'number' && Number.isFinite(x));
  const root = svg('svg', { class: 'spark', viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: 'none', role: 'img', 'aria-label': label });
  if (!v.length) return root;
  const min = Math.min(...v), max = Math.max(...v), span = max - min || 1, pad = 3;
  const y = (x) => (height - pad - ((x - min) / span) * (height - 2 * pad)).toFixed(1);
  const stroke = v[v.length - 1] >= v[0] ? '#3fb950' : '#f85149';
  if (v.length === 1) {
    root.appendChild(svg('circle', { cx: width / 2, cy: height / 2, r: 3, fill: stroke }));
    return root;
  }
  const step = width / (v.length - 1);
  const d = v.map((x, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(1)},${y(x)}`).join('');
  root.appendChild(svg('path', { d, fill: 'none', stroke, 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke' }));
  return root;
}
