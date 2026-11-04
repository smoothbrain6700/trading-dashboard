// The only module that touches the network or storage. Never throws to callers.
import { CONFIG } from '../config.js';
import { normalize } from './normalize.js';

function readCache() {
  try {
    const raw = localStorage.getItem(CONFIG.cacheKey);
    if (!raw) return null;
    const n = normalize(JSON.parse(raw));
    return n.ok ? n.data : null;
  } catch { return null; }
}
function writeCache(text) {
  try { localStorage.setItem(CONFIG.cacheKey, text); } catch { /* storage full or disabled */ }
}
export const isSample = () => new URLSearchParams(location.search).get('sample') === '1';

/** Last good copy (null in sample mode, which never reads or writes the cache). */
export function cached() {
  return isSample() ? null : readCache();
}

/**
 * Resolves to {data, source: 'fresh'|'cached'|null, problem: null|{kind: 'missing'|'format', message}}.
 */
export async function load() {
  const sample = isSample();
  const url = (sample ? CONFIG.sampleUrl : CONFIG.dataUrl) + '?t=' + Date.now();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), CONFIG.fetchTimeoutMs);
  let problem;
  try {
    const res = await fetch(url, { cache: 'no-store', signal: ctl.signal });
    if (!res.ok) {
      problem = { kind: 'missing', message: `HTTP ${res.status}` };
    } else {
      const text = await res.text();
      let raw;
      try { raw = JSON.parse(text); } catch { raw = undefined; }
      const n = raw === undefined ? { ok: false, error: 'Data format not recognized (invalid JSON). Update the site.' } : normalize(raw);
      if (n.ok) {
        if (!sample) writeCache(text);
        return { data: n.data, source: 'fresh', problem: null };
      }
      problem = { kind: 'format', message: n.error };
    }
  } catch (e) {
    problem = { kind: 'missing', message: e && e.name === 'AbortError' ? 'timed out' : 'network error' };
  } finally {
    clearTimeout(timer);
  }
  const c = sample ? null : readCache();
  return { data: c, source: c ? 'cached' : null, problem };
}
