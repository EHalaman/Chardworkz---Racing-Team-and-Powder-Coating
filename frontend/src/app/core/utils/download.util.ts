/**
 * Triggers a browser download for an in-memory blob (an .xlsx export response,
 * not a real URL). Appends the anchor to the document and defers revoking the
 * object URL rather than doing both synchronously right after `.click()` -
 * a known Chromium timing hazard where the download can otherwise fire twice
 * for a single call (observed live: one network request, two saved files a
 * few dozen ms apart). Shared by every export button (Sales Reports,
 * Inventory) so a fix here fixes all of them at once.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  // Deferred, not synchronous - removing the anchor or revoking the object
  // URL immediately after click() raced with the download actually starting
  // in this environment (verified live: no file at all was saved).
  setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}
