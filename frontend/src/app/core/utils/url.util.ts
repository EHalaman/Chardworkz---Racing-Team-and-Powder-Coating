/** Strips query string and hash from a Router.url so an exact-path comparison isn't broken
 *  by a tracking param, marketing query string, or a device-preview tool's own appended
 *  state - e.g. `/?utm_source=fb` still matches `/`. */
export function normalizedPath(url: string): string {
  return url.split('?')[0].split('#')[0];
}
