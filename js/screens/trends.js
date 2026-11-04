import {CONFIG as C} from '../config.js';
import {load} from '../data/load.js';
import {normalizeHistory as norm} from '../data/normalizeHistory.js';
import * as A from '../trends/aggregate.js';
import {lineChart} from '../ui/linechart.js';
import {barChart} from '../ui/barchart.js';
import {table} from '../ui/table.js';
import {banner,staleBanner} from '../ui/banner.js';
import {el,clear} from '../ui/el.js';
import * as f from '../format.js';
const TN = C.trendsTones;
let state,root,raf = 0,P;
const none = (m = 'No closed trades yet.') => el('p',{class: 'muted'},m),card = (a,...k) => el('section',{class: 'card',...a},...k);
const pl = (n,w) => `${n} ${w}${n == 1 ? '' : 's'}`,wp = v => f.pct(v,0,false),sp = v => el('span',{class: f.tone(v)},f.signedMoney(v));
function prefs(p) {
try {p = JSON.parse(localStorage.getItem(C.trendsPrefsKey));} catch {}
return {acct: String(p?.acct ?? 'all'),range: C.trendsRanges.includes(p?.range) ? p.range : C.trendsDefaultRange};
}
function setPref(k,v) {
try {localStorage.setItem(C.trendsPrefsKey,JSON.stringify({...prefs(),[k]: v}));} catch {}
draw();
}
const chips = (k,it,cur) => el('div',{class: 'chips',role: 'group','aria-label': k},it.map(([id,t]) =>
el('button',{class: 'chip','aria-pressed': String(id == cur),onclick: () => setPref(k,id)},t)));
const chart = (c,o) => lineChart({height: C.trendsChartHeight,width: c.width,maxPoints: C.trendsMaxPoints,xFormat: t => A.iso(t,10),...o}) || none('Not enough data yet.');
const line = (points,tone = TN[0],c = '') => ({points,tone,c}),T = 'Win rate & avg win/loss';
const bars = (key,title,topN) => c => [title,c.trades.length ? barChart({rows: A.pnlBy(c.trades,key,topN)
.map(r => ({label: r.label,value: r.value,note: `${pl(r.n, 'trade')} · ${wp(r.wins / r.n)} win`}))}) : none()];
const S = {
equity(c) {
const p = c.equity,a = p[0],z = p[p.length - 1],one = c.accounts.find(x => x.id == c.acct),s = [line(p)];
if (!z) return ['Equity',none('No history in this range.')];
if (!one && C.trendsShowAccountLines && c.accounts.length > 1) A.seeded(c.h.series,c.accounts).forEach((x,i) =>
s.push(line(c.cut(x),TN[(i + 1) % TN.length],' faint')));
if (one?.starting_cash) s.push(line([a[0],z[0]].map(t => [t,one.starting_cash]),'muted',' dash'));
const b = A.base(c.h.series,c.acct,c.accounts,p),dv = z[1] - b;
return ['Equity',el('div',{class: 'row'},el('span',{class: 'big'},f.money(z[1])),
el('span',{class: f.tone(dv)},b ? `${f.signedMoney(dv)} (${f.pct(dv / b)})` : f.signedMoney(dv))),
p.length == 1 ? none('1 day of history') : null,chart(c,{series: s,label: 'Equity'})];
},
cumPnl(c) {
const p = A.cumulativePnl(c.trades),label = 'Cumulative realized P&L';
return [label,...(p.length < 2 ? [none(p[0] && 'Not enough data yet.')] : [sp(p[p.length - 1][1]),chart(c,{series: [line(p)],yFormat: f.signedMoney,label})])];
},
winRate(c) {
const t = c.trades,s = A.summary(t),min = C.trendsMinTradesForRolling,w = C.trendsRollingWindow;
const head = el('div',{class: 'kv'},[['Win rate',wp(s.winRate)],['Avg win',f.money(s.avgWin)],['Avg loss',f.money(s.avgLoss)],
['Profit factor',f.fixed(s.profitFactor ?? NaN)],['Trades',s.n]].map(kv => el('div',null,kv.map(x => el('span',null,x)))));
if (s.n < min) return [T,head,none(`Need ${min}+ closed trades for the trend line`)];
const xFormat = i => t[i - 1].exit_date + ' #' + i,wl = A.rollingAvgWinLoss(t,w);
return [T,head,
chart(c,{series: [line(A.rollingWinRate(t,w).slice(min - 1))],yFormat: wp,xFormat,label: `Rolling ${w}-trade win rate`}),
chart(c,{series: [line(wl.win,'green'),line(wl.loss,'red')],xFormat,label: 'Avg win vs avg loss'})];
},
byStrategy: bars('strategy','P&L by strategy'),
bySymbol: bars('symbol','P&L by symbol',C.trendsTopSymbols),
monthly(c) {
const r = A.monthly(c.trades,c.equity);
return ['Monthly',r.length ? table('Month,Trades,Win %,Realized P&L,Equity change'.split(',').map(label => ({label})),
r.map(m => ({cells: [m.label,m.n + '',wp(m.winRate),sp(m.pnl),sp(m.eqChange)]}))) : none()];
},
};
function draw() {
const h = state.data,p = prefs(),today = new Date().toLocaleDateString('en-CA',{timeZone: C.timeZone});
clear(root);
if (!h) return root.append(el('p',{class: 'full'},state.problem?.kind == 'format' ? state.problem.message : 'No history yet. It starts with the next daily run.'));
if (state.source == 'cached') root.append(banner(`Couldn't load fresh history, showing cached from ${f.time(h.generated_at)}.`,'err'));
root.append(staleBanner(h.generated_at,'History').node || '');
const accounts = h.accounts.filter(a => (h.series.byAccount[a.id] || []).length);
const acct = accounts.some(a => a.id == p.acct) ? p.acct : 'all',cut = r => A.filterRange(r,p.range,today);
const c = {h,accounts,acct,cut,width: Math.max(260,document.getElementById('app').clientWidth - 50),
trades: cut(A.forAccount(h.trades,acct)),equity: cut(A.equitySeries(h.series,acct,accounts))};
root.append(card(null,chips('acct',[['all','All'],...accounts.map(a => [a.id,a.label])],acct),chips('range',C.trendsRanges.map(r => [r,r]),p.range)));
for (const name of C.trendsSections.filter(n => S[n])) {
const [title,...body] = S[name](c);
root.append(card({'data-section': name},el('h3',null,title),body));
}
}
addEventListener('resize',() => {raf = raf || requestAnimationFrame(() => {raf = 0; state && root.isConnected && draw();});});
export function render() {
root = el('div',{class: 'trends'},none('Loading history…'));
if (state) draw(); else (P ||= load({url: C.historyUrl,sampleUrl: C.sampleHistoryUrl,key: C.historyCacheKey,norm,what: 'History'})).then(r => {state = r; draw();});
return root;
}
