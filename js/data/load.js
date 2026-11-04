import { CONFIG } from '../config.js';
import { normalize } from './normalize.js';

function readCache(key, norm) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const n = norm(JSON.parse(raw));
    return n.ok ? n.data : null;
  } catch { return null; }
}
function writeCache(text, key) {
  try { localStorage.setItem(key, text); } catch { /* storage full or disabled */ }
}
export const isSample = () => new URLSearchParams(location.search).get('sample') === '1';

export function cached() {
  return isSample() ? null : readCache(CONFIG.cacheKey, normalize);
}

export async function load({ url: liveUrl = CONFIG.dataUrl, sampleUrl = CONFIG.sampleUrl, key = CONFIG.cacheKey, norm = normalize, what = 'Data' } = {}) {
  const sample = isSample();
  const url = (sample ? sampleUrl : liveUrl) + '?t=' + Date.now();
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
      const n = raw === undefined ? { ok: false, error: `${what} format not recognized (invalid JSON). Update the site.` } : norm(raw);
      if (n.ok) {
        if (!sample) writeCache(text, key);
        return { data: n.data, source: 'fresh', problem: null };
      }
      problem = { kind: 'format', message: n.error };
    }
  } catch (e) {
    problem = { kind: 'missing', message: e && e.name === 'AbortError' ? 'timed out' : 'network error' };
  } finally {
    clearTimeout(timer);
  }
  const c = sample ? null : readCache(key, norm);
  return { data: c, source: c ? 'cached' : null, problem };
}
