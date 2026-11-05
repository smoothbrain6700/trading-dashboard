const SVG_NS = 'http://www.w3.org/2000/svg';

function apply(node, attrs) {
for (const [k, v] of Object.entries(attrs || {})) {
if (v === undefined || v === null || v === false) continue;
if (k === 'class') node.setAttribute('class', v);
else if (k === 'text') node.textContent = String(v);
else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
else node.setAttribute(k, v === true ? '' : String(v));
}
}
function append(node, children) {
for (const c of children.flat(Infinity)) {
if (c === null || c === undefined || c === false) continue;
node.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
}
}
export function el(tag, attrs, ...children) {
const node = document.createElement(tag);
apply(node, attrs);
append(node, children);
return node;
}
export function svg(tag, attrs, ...children) {
const node = document.createElementNS(SVG_NS, tag);
for (const [k, v] of Object.entries(attrs || {})) if (v !== undefined && v !== null) node.setAttribute(k, String(v));
append(node, children);
return node;
}
export function clear(node) {
while (node.firstChild) node.removeChild(node.firstChild);
return node;
}
