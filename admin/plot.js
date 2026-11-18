const svgNamespace = 'http://www.w3.org/2000/svg';

export function svg(tag, attributes, text) {
  const element = document.createElementNS(svgNamespace, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (text !== undefined) element.textContent = text;
  return element;
}

export function canvas(width, height, title, scale) {
  const plot = svg('svg', {viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': `${title}. ${scale}`, focusable: 'false'});
  plot.append(svg('title', {}, title), svg('desc', {}, scale));
  return plot;
}

export function text(x, y, value, attributes = {}) {
  return svg('text', {x, y, ...attributes}, value);
}
