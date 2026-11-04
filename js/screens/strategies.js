import { el } from '../ui/el.js';
import { table } from '../ui/table.js';
import * as f from '../format.js';

const COLS = [{ label: 'Strategy' }, { label: 'Closed' }, { label: 'Win rate' }, { label: 'Avg %' }, { label: 'Realized' },
  { label: 'Open' }, { label: 'Unrealized' }, { label: 'Exits sig/stop/max' }];

function years(period) {
  const s = Date.parse(period && period.start), e = Date.parse(period && period.end);
  return Number.isFinite(s) && Number.isFinite(e) ? `${Math.round((e - s) / (365.25 * 86400000))}y` : '';
}
function exits(x) {
  return `${x.signal}/${x.stop + x.gap_stop}/${x.max_hold}`;
}

export function render(d) {
  const ids = [...new Set([...d.accounts.map((a) => a.id), ...d.strategies.map((s) => s.account)])];
  const labels = Object.fromEntries(d.accounts.map((a) => [a.id, a.label]));
  const bt = d.backtest;
  const btLabel = `Backtest (${bt ? years(bt.period) : ''})`;
  if (!ids.length) return el('p', { class: 'muted' }, 'No closed trades yet.');
  return el('div', null, ids.map((id) => {
    const live = d.strategies.filter((s) => s.account === id);
    const rows = live.map((s) => ({ cells: [s.strategy, String(s.closed), f.pct(s.win_rate, 0, false), f.pct(s.avg_pnl_pct),
      el('span', { class: f.tone(s.realized) }, f.signedMoney(s.realized)), String(s.open),
      el('span', { class: f.tone(s.unrealized) }, f.signedMoney(s.unrealized)), exits(s.exits)] }));
    const btRows = bt ? bt.rows.filter((r) => r.account === id) : [];
    for (const r of btRows) {
      rows.push({ cls: 'sub', cells: [`${btLabel} ${r.strategy}`, f.qty(r.trades), f.pct(r.win_rate, 0, false), f.pct(r.avg_trade_pct),
        `${f.pct(r.total_return, 1)} total`, '—', `${f.pct(r.max_drawdown, 1)} max DD`, exits(r.exits)] });
    }
    for (const b of bt ? bt.benchmarks.filter((x) => x.account === id) : []) {
      rows.push({ cls: 'sub', cells: [`${btLabel} ${b.name}`, '—', '—', '—', `${f.pct(b.total_return, 1)} total`, '—', `${f.pct(b.max_drawdown, 1)} max DD`, '—'] });
    }
    const closed = live.reduce((n, s) => n + s.closed, 0);
    return el('section', { class: 'card', 'aria-label': labels[id] || id },
      el('h3', null, labels[id] || id),
      rows.length ? table(COLS, rows) : null,
      closed ? null : el('p', { class: 'muted' }, 'No closed trades yet.'),
      bt ? null : el('p', { class: 'muted' }, 'Run backtest.py to populate.'));
  }));
}
