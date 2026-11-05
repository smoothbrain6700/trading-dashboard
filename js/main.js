import { CONFIG } from './config.js';
import { load, cached } from './data/load.js';
import { start, current } from './router.js';
import { el, clear } from './ui/el.js';
import { banner, staleBanner } from './ui/banner.js';
import * as f from './format.js';
import * as overview from './screens/overview.js';
import * as positions from './screens/positions.js';
import * as trades from './screens/trades.js';
import * as thinking from './screens/thinking.js';
import * as strategies from './screens/strategies.js';
import * as trends from './screens/trends.js';

const SCREENS = { overview, positions, trades, thinking, strategies, trends };
const $ = (id) => document.getElementById(id);
const view = { data: null, source: null, problem: null, loading: false };

function header(d, stale, bannerLevel = null) {
const dot = $('hdr-dot');
const run = $('hdr-run');
clear(run);
if (!d) { dot.className = 'dot'; dot.setAttribute('aria-label', 'No data'); return; }
run.append(f.time(d.generated_at));
if (view.source === 'cached') run.append(' ', el('span', { class: 'tag' }, 'cached'));
const level = d.run.status === 'error' || bannerLevel === 'err' ? 'err'
: d.run.status === 'partial' || bannerLevel === 'warn' ? 'warn' : 'ok';
const why = d.run.status === 'error' ? 'Last run had errors'
: view.problem && view.source === 'cached' ? "Couldn't load fresh data"
: stale ? (stale.level === 'err' ? 'Data is very stale' : 'Data is stale')
: 'Last run partial';
dot.className = `dot ${level}`;
dot.dataset.level = level;
dot.setAttribute('aria-label', level === 'ok' ? 'Status OK' : why);
}

function fullScreen(title, detail) {
return el('div', { class: 'full' },
el('p', null, title),
detail ? el('p', { class: 'muted' }, detail) : null,
el('button', { type: 'button', class: 'btn', onclick: refresh }, 'Retry'));
}

function render() {
const t0 = performance.now();
const route = current();
for (const a of document.querySelectorAll('.tabs a')) {
if (a.dataset.route === route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
}
const app = $('app');
const banners = clear($('banners'));
const d = view.data;
if (!d) {
header(null);
clear(app).append(view.loading ? el('p', { class: 'muted pad' }, 'Loading…')
: view.problem && view.problem.kind === 'format' ? fullScreen(view.problem.message)
: fullScreen("No data yet. The bot hasn't published a run."));
window.__renderMs = performance.now() - t0;
return;
}
let bannerLevel = null;
if (view.problem && view.source === 'cached') {
bannerLevel = 'err';
banners.append(view.problem.kind === 'format' ? banner(view.problem.message, 'err')
: banner(`Couldn't load fresh data, showing cached from ${f.time(d.generated_at)}.`, 'err'));
}
const { stale, node } = staleBanner(d.generated_at);
if (node) banners.append(node);
if (stale && bannerLevel !== 'err') bannerLevel = stale.level;
header(d, stale, bannerLevel);
let content;
try {
content = SCREENS[route].render(d, render);
} catch (e) {
content = el('p', { class: 'neg pad' }, "This screen couldn't render this data.");
console.warn(e);
}
clear(app).append(content);
window.__renderMs = performance.now() - t0;
}

async function refresh() {
if (view.loading) return;
view.loading = true;
$('refresh').setAttribute('aria-busy', 'true');
if (!view.data) render();
const r = await load();
view.loading = false;
$('refresh').removeAttribute('aria-busy');
if (r.data) { view.data = r.data; view.source = r.source; }
else if (view.data) view.source = 'cached';
view.problem = r.problem;
render();
}

const c = cached();
if (c) { view.data = c; view.source = 'cached'; }
$('refresh').addEventListener('click', refresh);
start(() => { render(); $('app').focus({ preventScroll: true }); window.scrollTo(0, 0); });
refresh();
