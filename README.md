# Paper Bot dashboard

Static site (vanilla HTML/CSS/ES modules, no build step) showing what the paper-trading bot did and why.
Served by GitHub Pages from `main` at the repo root, under `/trading-dashboard/`. All paths are relative.

- `data.json` is written by `/workspace/trading` (`run.py`, via `papertrade/export`) and pushed by `papertrade/publish.py`. Don't hand-edit it.
- `sample-data.json` is a fixture covering every badge, both position kinds, an unknown kind and a no-ledger account. Open `?sample=1` to view it (never cached).
- Tunables (stale thresholds, run schedule, holidays, sort order, number formats) live in `js/config.js` only.
- New position kind: add `js/renderers/positions/<kind>.js` and one line in `js/renderers/positions/index.js`. Unknown kinds use `generic.js`.

Run locally: `python3 -m http.server 8000` in this folder, then open http://localhost:8000/ (or `/?sample=1`).
- `history.json` (Trends tab, `#trends`) is written by the same export from `logs/snapshots.jsonl` + `trades.csv`, and is fetched only when you open Trends. `sample-history.json` is synthetic (`?sample=1`).
