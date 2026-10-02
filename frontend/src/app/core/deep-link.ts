import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type HighlightKind = 'blink' | 'pulse';

const HIGHLIGHT_CLASS: Record<HighlightKind, string> = {
  blink: 'deep-link-blink',
  pulse: 'deep-link-pulse',
};

const HIGHLIGHT_MS = 2500;

const removalTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

/**
 * Scrolls an element to the top of the viewport and flags it for ~2.5s with a temporary
 * highlight class (styles.css), then removes it. Used by notification clicks and the catalog
 * Restock link so the user lands on, and notices, the exact row or panel they were sent to.
 */
export function highlightElement(
  el: HTMLElement,
  kind: HighlightKind,
  durationMs = HIGHLIGHT_MS,
): void {
  const cls = HIGHLIGHT_CLASS[kind];
  el.classList.add('deep-link-target');
  el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  // Re-adding the class restarts the animation if the same target is highlighted twice in a row.
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  // One removal timer per element: a second highlight inside the window must not be cut short by the first one's timer.
  clearTimeout(removalTimers.get(el));
  removalTimers.set(
    el,
    setTimeout(() => {
      el.classList.remove(cls);
      removalTimers.delete(el);
    }, durationMs),
  );
}

/** Waits for the next paint(s) so a just-rendered target exists, then runs fn. Gives up quietly if the element never appears. */
export function whenElementReady(id: string, fn: (el: HTMLElement) => void, tries = 20): void {
  const el = document.getElementById(id);
  if (el) {
    fn(el);
    return;
  }
  if (tries > 0) {
    setTimeout(() => whenElementReady(id, fn, tries - 1), 50);
  }
}

/**
 * Angular ignores a navigation to the URL you are already on, so clicking the same bell alert twice would not re-highlight
 * anything. The layout fires replay$ in that case and Inventory re-applies its last deep-link highlight.
 */
@Injectable({ providedIn: 'root' })
export class DeepLinkReplay {
  readonly replay$ = new Subject<void>();
}
