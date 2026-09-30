/**
 * Strips the "| N pcs | ₱price" suffix that Register's `combinedRemarks`
 * bakes into every excluded-component line (see register.ts's
 * `formattedExclusionsBlock`), leaving just the component name under each
 * "Excluded:" header. Used only for the printable Customer Receipt tab -
 * the Sales Audit Breakdown tab renders the raw stored remarks unchanged.
 *
 * Applied at render time rather than stored separately, so it also cleans
 * up every already-recorded sale's remarks with no backfill/migration
 * needed - the format has been consistent since DEC-084.
 */
export function formatRemarksForCustomer(remarks: string | null): string | null {
  if (!remarks) {
    return remarks;
  }
  return remarks
    .split('\n')
    .map((line) => line.replace(/^(\s*)(.+?)\s*\|\s*\d+\s*pcs\s*\|\s*₱[\d,.]+\s*$/, '$1$2'))
    .join('\n');
}
