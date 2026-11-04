const sum = a=>a.reduce((s,x)=>s + x,0);
const W = p=>p > 0;
const split = p=>[p.filter(W),p.filter(x=>!W(x))];
export const ms = d=>Date.parse(d + 'T00:00:00Z'),iso = (t,n)=>new Date(t).toISOString().slice(0,n);
export function filterRange(rows,range,today) {
const [y,m,d] = today.split('-').map(Number),back = {'1M': 1,'3M': 3,'1Y': 12}[range];
const start = range == 'YTD' ? Date.UTC(y,0,1) : back ? Date.UTC(y,m - 1 - back,d) : -Infinity;
return rows.filter(r=>(r.length ? r[0] : ms(r.date || r.exit_date)) >= start);
}
export const forAccount = (rows,id)=>(id == 'all' ? rows : rows.filter(r=>r.account == id));
export const seed = (s,a)=>a.starting_cash || s.byAccount[a.id]?.[0]?.equity || 0;
export const base = (s,id,accts,p)=>p[0] && p[0][0] == equitySeries(s,id,accts)[0][0] ? sum(accts.filter(a=>id == 'all' || a.id == id).map(a=>seed(s,a))) : p[0]?.[1];
export const seeded = (s,accts)=>{
const L = accts.map(a=>({p: s.byAccount[a.id] || [],i: 0,v: seed(s,a)})),D = [...new Set(L.flatMap(a=>a.p.map(p=>p.date)))].sort();
return L.map(a=>(D.map(d=>{while (a.p[a.i]?.date <= d) a.v = a.p[a.i++].equity; return [ms(d),a.v];})));
};
export const equitySeries = (s,id,accts)=>{
if (id != 'all') return (s.byAccount[id] || []).map(p=>[ms(p.date),p.equity]);
const S = seeded(s,accts);
return (S[0] || []).map((q,j)=>[q[0],sum(S.map(x=>x[j][1]))]);
};
export const cumulativePnl = (trades,c = 0)=>trades.map(t=>[ms(t.exit_date),(c += t.pnl)]);
const roll = (t,w,fn)=>t.map((_,i)=>[i + 1,fn(split(t.slice(Math.max(0,i + 1 - w),i + 1).map(x=>x.pnl)))]);
export const rollingWinRate = (t,w)=>roll(t,w,([a,b])=>a.length / (a.length + b.length));
const avg = (a,k = 1)=>(a.length ? (k * sum(a)) / a.length : null),ok = p=>p[1] != null;
export const rollingAvgWinLoss = (t,w)=>({win: roll(t,w,([a])=>avg(a)).filter(ok),loss: roll(t,w,([,b])=>avg(b,-1)).filter(ok)});
export function summary(trades) {
const p = trades.map(t=>t.pnl),[a,b] = split(p),sl = -sum(b);
return {n: p.length,winRate: p.length ? a.length / p.length : null,avgWin: avg(a),avgLoss: avg(b,-1),profitFactor: sl > 0 ? sum(a) / sl : null};
}
const get = (g,k)=>g.get(k) || g.set(k,{label: String(k),value: 0,n: 0,wins: 0,end: null}).get(k);
const group = (trades,key,g = new Map())=>{
for (const t of trades) {const r = get(g,key(t)); r.value += t.pnl; r.n++; r.wins += W(t.pnl);}
return g;
};
export function pnlBy(trades,key,topN) {
const rows = [...group(trades,t=>t[key]).values()].sort((a,b)=>Math.abs(b.value) - Math.abs(a.value));
const rest = topN ? rows.splice(topN) : [];
rows.sort((a,b)=>b.value - a.value);
if (rest.length) rows.push({label: `Other (${rest.length})`,...Object.fromEntries(['value','n','wins'].map(k=>[k,sum(rest.map(r=>r[k]))]))});
return rows;
}
export function monthly(trades,series) {
const g = group(trades,t=>t.exit_date.slice(0,7)),mk = t=>iso(t,7);
for (const [t,v] of series) get(g,mk(t)).end = v;
let prev = series.length ? series[0][1] : null;
return [...g.values()].sort((a,b)=>a.label.localeCompare(b.label)).map(r=>{
const eqChange = r.end != null && prev != null ? r.end - prev : null;
if (r.end != null) prev = r.end;
return {label: new Date(ms(r.label + '-01')).toLocaleString('en-US',{month: 'short',year: 'numeric',timeZone: 'UTC'}),
n: r.n,winRate: r.n ? r.wins / r.n : null,pnl: r.value,eqChange};
}).reverse();
}
