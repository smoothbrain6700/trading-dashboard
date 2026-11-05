export const ROUTES = ['overview', 'positions', 'trades', 'thinking', 'strategies', 'trends'];

export function current() {
const h = (location.hash || '').replace(/^#/, '');
return ROUTES.includes(h) ? h : ROUTES[0];
}
export function start(onChange) {
window.addEventListener('hashchange', () => onChange(current()));
onChange(current());
}
