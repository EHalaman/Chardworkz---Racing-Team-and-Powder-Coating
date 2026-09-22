/** Scrolls the given element id into view, retrying briefly if it isn't in the DOM yet -
 *  e.g. right after a route navigation, before the routed page's own view has painted. */
export function scrollToElement(id: string, attempt = 0): void {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (attempt < 20) {
    setTimeout(() => scrollToElement(id, attempt + 1), 50);
  }
}
