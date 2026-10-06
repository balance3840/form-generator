/** DOM helpers shared by the components (no other dependencies, so small components stay small). */
/**
 * Whether a click happened inside `element`. Works when the form sits inside a shadow root (the form builder draws
 * itself in one): there `event.target` seen from the document is the shadow host, not the clicked element.
 */
export function clickedInside(event: Event, element: Element | null | undefined): boolean {
  if (!element) return false;
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  return path.length ? path.includes(element) : element.contains(event.target as Node);
}

/** Whether a click happened inside an element matching `selector` (shadow roots included, see clickedInside). */
export function clickedInsideSelector(event: Event, selector: string): boolean {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [event.target];
  return path.some(node => node instanceof Element && node.matches(selector));
}
