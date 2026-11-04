// Pure: raw data.json payload -> view model with safe defaults. No DOM, no network.
import { CONFIG } from '../config.js';

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const arr = (v) => (Array.isArray(v) ? v : []);
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v) => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v));
const strOrNull = (v) => (typeof v === 'string' && v ? v : null);

function account(a) {
  a = obj(a);
  return {
    ...a,
    id: str(a.id) || 'unknown',
    label: str(a.label) || str(a.id) || 'Account',
    market: str(a.market),
    status: ['ok', 'no_data', 'error'].includes(a.status) ? a.status : 'ok',
    as_of: strOrNull(a.as_of),
    equity: num(a.equity), cash: num(a.cash), starting_cash: num(a.starting_cash),
    pnl: num(a.pnl), pnl_pct: num(a.pnl_pct), day_pnl: num(a.day_pnl),
    equity_history: arr(a.equity_history).map((h) => ({ date: str(obj(h).date), equity: num(obj(h).equity) })),
    positions: arr(a.positions).map((p) => ({ ...obj(p), kind: str(obj(p).kind) || 'unknown', symbol: str(obj(p).symbol) || '?' })),
  };
}
function trade(t) {
  t = obj(t);
  return { ...t, account: str(t.account), date: str(t.date), symbol: str(t.symbol), side: str(t.side), kind: str(t.kind),
    qty: num(t.qty), price: num(t.price), fee: num(t.fee), strategy: str(t.strategy), reason: str(t.reason),
    exit_kind: strOrNull(t.exit_kind), pnl: num(t.pnl), pnl_pct: num(t.pnl_pct) };
}
function thinking(t) {
  t = obj(t);
  const conds = {};
  for (const [k, v] of Object.entries(obj(t.conditions))) {
    conds[k] = arr(v).map((c) => ({ name: str(obj(c).name), value: num(obj(c).value), threshold: num(obj(c).threshold),
      op: str(obj(c).op), pass: obj(c).pass === true }));
  }
  return { ...t, account: str(t.account), symbol: str(t.symbol), z: num(t.z), rsi2: num(t.rsi2),
    pct_from_sma20: num(t.pct_from_sma20), above_trend: typeof t.above_trend === 'boolean' ? t.above_trend : null,
    trend_sma: str(t.trend_sma), badge: strOrNull(t.badge), reason: str(t.reason), action: str(t.action), conditions: conds };
}
function strategy(s) {
  s = obj(s);
  const ex = obj(s.exits);
  return { ...s, account: str(s.account), strategy: str(s.strategy), closed: num(s.closed) ?? 0, win_rate: num(s.win_rate),
    avg_pnl_pct: num(s.avg_pnl_pct), realized: num(s.realized), open: num(s.open) ?? 0, unrealized: num(s.unrealized),
    exits: { signal: num(ex.signal) ?? 0, stop: num(ex.stop) ?? 0, gap_stop: num(ex.gap_stop) ?? 0, max_hold: num(ex.max_hold) ?? 0 } };
}
function backtest(b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return null;
  return { generated_at: strOrNull(b.generated_at), period: obj(b.period),
    rows: arr(b.rows).map((r) => ({ ...strategy({ ...obj(r) }), trades: num(obj(r).trades), avg_trade_pct: num(obj(r).avg_trade_pct),
      total_return: num(obj(r).total_return), max_drawdown: num(obj(r).max_drawdown) })),
    benchmarks: arr(b.benchmarks).map((x) => ({ account: str(obj(x).account), name: str(obj(x).name),
      total_return: num(obj(x).total_return), max_drawdown: num(obj(x).max_drawdown) })) };
}

/** Returns {ok: true, data} or {ok: false, error} for payloads the site can't use. */
export function normalize(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'Data format not recognized. Update the site.' };
  if (raw.schema_version !== CONFIG.schemaVersion) {
    const v = raw.schema_version === undefined ? 'no version' : `v${str(raw.schema_version)}`;
    return { ok: false, error: `Data format not recognized (${v}). Update the site.` };
  }
  const run = obj(raw.run);
  const totals = obj(raw.totals);
  return {
    ok: true,
    data: {
      generated_at: strOrNull(raw.generated_at),
      run: { status: ['ok', 'partial', 'error'].includes(run.status) ? run.status : 'ok', started_at: strOrNull(run.started_at),
        finished_at: strOrNull(run.finished_at), issues: arr(run.issues).map(str), new_bar: obj(run.new_bar),
        previous_publish: run.previous_publish && typeof run.previous_publish === 'object' ? run.previous_publish : null },
      totals: { equity: num(totals.equity), starting_cash: num(totals.starting_cash), pnl: num(totals.pnl), pnl_pct: num(totals.pnl_pct),
        day_pnl: num(totals.day_pnl), open_positions: num(totals.open_positions) },
      accounts: arr(raw.accounts).map(account),
      trades: arr(raw.trades).map(trade),
      strategies: arr(raw.strategies).map(strategy),
      backtest: backtest(raw.backtest),
      thinking: arr(raw.thinking).map(thinking),
    },
  };
}

/** Pure stale check. Returns null | {level: 'warn'|'err', since: ms, expected: ms}. Uses ptInstant/ptParts injected. */
export function staleness(generatedMs, nowMs, tz) {
  if (generatedMs === null) return null;
  if (nowMs - generatedMs > CONFIG.staleRedDays * 86400000) return { level: 'err', since: generatedMs };
  const expected = lastExpectedRun(nowMs, tz);
  if (expected !== null && generatedMs < expected - CONFIG.staleGraceHours * 3600000) {
    return { level: 'warn', since: generatedMs, expected, today: sameDay(tz.parts(expected), tz.parts(nowMs)) };
  }
  return null;
}
export function lastExpectedRun(nowMs, tz) {
  const p = tz.parts(nowMs);
  for (let back = 0; back < 14; back++) {
    const noon = tz.instant(p.y, p.m, p.d, 12) - back * 86400000;
    const q = tz.parts(noon);
    const wd = new Date(Date.UTC(q.y, q.m - 1, q.d)).getUTCDay();
    const ymd = `${q.y}-${String(q.m).padStart(2, '0')}-${String(q.d).padStart(2, '0')}`;
    if (!CONFIG.runDays.includes(wd) || CONFIG.holidays.includes(ymd)) continue;
    const at = tz.instant(q.y, q.m, q.d, CONFIG.runHourPT);
    if (at <= nowMs) return at;
  }
  return null;
}
const sameDay = (a, b) => a.y === b.y && a.m === b.m && a.d === b.d;
