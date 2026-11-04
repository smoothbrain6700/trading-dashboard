// Hash router: #overview #positions #trades #thinking #strategies
export const ROUTES = ['overview', 'positions', 'trades', 'thinking', 'strategies'];

export function current() {
  const h = (location.hash || '').replace(/^#/, '');
  return ROUTES.includes(h) ? h : ROUTES[0];
}
export function start(onChange) {
  window.addEventListener('hashchange', () => onChange(current()));
  onChange(current());
}
