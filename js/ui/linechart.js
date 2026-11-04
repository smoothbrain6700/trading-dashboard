import { svg } from './el.js';
import * as f from '../format.js';
const L = 58, R = 8, T = 20, B = 18;
let active;
document.addEventListener('pointerdown', e => { if (active && !active.contains(e.target)) active = active.hide(); });
export function bucket(p, max) {
if (p.length <= max) return p;
const n = (max - 2) >> 1, size = (p.length - 2) / n, out = [p[0]];
for (let b = 0; b < n; b++) {
const seg = p.slice(1 + Math.floor(b * size), 1 + Math.floor((b + 1) * size));
const pick = k => seg.reduce((a, q) => (k * q[1] > k * a[1] ? q : a)), lo = pick(-1), hi = pick(1);
out.push(...(lo == hi ? [lo] : lo[0] < hi[0] ? [lo, hi] : [hi, lo]));
}
return [...out, p[p.length - 1]];
}
function ticks(lo, hi) {
if (lo == hi) { const d = Math.abs(lo) / 100 || 1; lo -= d; hi += d; }
const m = 10 ** Math.floor(Math.log10((hi - lo) / 4)), s = [1, 2, 2.5, 5, 10].map(k => k * m).find(k => (hi - lo) / k <= 4);
const a = Math.floor(lo / s) * s, b = Math.ceil(hi / s) * s, out = [];
for (let v = a; v <= b + s / 2; v += s) out.push(+v.toPrecision(12));
return { a, b, out };
}
let d;
export function lineChart({ series, yFormat = f.money, xFormat, height, width, maxPoints, label }) {
if (!(series = series.filter(s => s.points.length)).length) return null;
const main = series[0].points, all = series.flatMap(s => s.points), z = main[main.length - 1], tone = s => 'tone-' + s.tone;
const root = svg('svg', { class: 'chart', viewBox: `0 0 ${width} ${height}`, width, height, role: 'img',
'aria-label': `${label}: ${yFormat(main[0][1])} to ${yFormat(z[1])}, change ${(d = yFormat(z[1] - main[0][1])) && z[1] > main[0][1] && d[0] != '+' ? '+' : ''}${d}` });
const xs = all.map(p => p[0]), ys = all.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y = ticks(Math.min(...ys), Math.max(...ys));
const w = width - L - R, X = t => L + (x1 > x0 ? ((t - x0) / (x1 - x0)) * w : w / 2), Y = v => T + ((y.b - v) / (y.b - y.a)) * (height - T - B);
const txt = (x, yy, s, end) => svg('text', { x, y: yy, 'text-anchor': end && 'end' }, s);
for (const v of y.out) root.append(svg('line', { class: v ? 'grid' : 'zero', x1: L, x2: width - R, y1: Y(v), y2: Y(v) }), txt(L - 4, Y(v) + 4, yFormat(v), 1));
root.append(txt(L, height - 4, xFormat(x0)), txt(width - R, height - 4, xFormat(x1), 1));
for (const s of series) {
const p = bucket(s.points, maxPoints);
root.append(p.length == 1 ? svg('circle', { class: tone(s), cx: X(p[0][0]), cy: Y(p[0][1]), r: 4 })
: svg('path', { class: `ln ${tone(s)}${s.c}`, 'data-n': p.length, d: p.map((q, i) => `${i ? 'L' : 'M'}${X(q[0]) | 0},${Y(q[1]) | 0}`).join('') }));
}
const guide = svg('line', { class: 'guide', y1: T, y2: height - B }), dot = svg('circle', { class: tone(series[0]), r: 4 }), out = svg('text', { class: 'readout', x: L, y: 13 });
const hl = svg('g', null, guide, dot), vis = v => hl.setAttribute('visibility', v);
(root.hide = () => { vis('hidden'); out.textContent = ''; return null; })();
root.append(hl, out);
const show = e => {
if (e.type == 'pointermove' && e.pointerType !== 'mouse' && !e.buttons) return;
const r = root.getBoundingClientRect(), t = x0 + ((((e.clientX - r.left) / r.width) * width - L) / w) * (x1 - x0);
const [px, pv] = main.reduce((b, q) => (Math.abs(q[0] - t) < Math.abs(b[0] - t) ? q : b));
vis('visible');
[['x1', guide], ['x2', guide], ['cx', dot]].forEach(([k, n]) => n.setAttribute(k, X(px))); dot.setAttribute('cy', Y(pv));
out.textContent = `${xFormat(px)} · ${yFormat(pv)}`;
active = root;
};
root.onpointerdown = root.onpointermove = show;
return root;
}
