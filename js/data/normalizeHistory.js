import { CONFIG } from '../config.js';
const num = v => (Number.isFinite(v) ? v : null);
const str = v => (typeof v === 'string' && v ? v : typeof v === 'number' ? String(v) : '—');
const day = v => typeof v === 'string' && /^\d{4}-\d\d-\d\d$/.test(v);
const obj = v => v?.constructor == Object;
const arr = v => (Array.isArray(v) ? v : []);
const point = g => day(g('date')) && num(g('equity')) !== null && { date: g('date'), equity: g('equity') };
const trade = g => day(g('exit_date')) && num(g('pnl')) !== null && { exit_date: g('exit_date'), pnl: g('pnl'),
account: str(g('account')), symbol: str(g('symbol')), strategy: str(g('strategy')), exit_kind: str(g('exit_kind')) };
export function normalizeHistory(raw) {
const bad = why => ({ ok: false, error: `History format not recognized${why}. Update the site.` });
if (!obj(raw)) return bad('');
if (raw.schema_version !== CONFIG.historySchemaVersion) return bad(` (schema ${str(raw.schema_version)})`);
const { series: s, trades: t } = raw, issues = arr(raw.issues).map(str), byAccount = {};
if (!obj(s) || !obj(t)) return bad(' (no series or trades)');
const rows = (fields, list, make, what) => {
const f = arr(fields), l = arr(list), out = l.map(r => Array.isArray(r) && make(k => (f.includes(k) ? r[f.indexOf(k)] : null))).filter(Boolean);
if (l.length > out.length) issues.push(`${l.length - out.length} bad ${what} row(s) skipped`);
return out;
};
for (const [id, list] of Object.entries(obj(s.by_account) ? s.by_account : {})) byAccount[id] = rows(s.fields, list, point, id);
return { ok: true, data: {
accounts: arr(raw.accounts).filter(a => obj(a) && typeof a.id === 'string').map(a => ({ id: a.id, label: str(a.label || a.id), starting_cash: num(a.starting_cash) })),
series: { byAccount },
trades: rows(t.fields, t.rows, trade, 'trade').sort((a, b) => a.exit_date.localeCompare(b.exit_date)),
issues, generated_at: raw.generated_at + '' === raw.generated_at ? raw.generated_at : null } };
}
