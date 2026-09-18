/**
 * Normalizes a Philippine mobile number down to its bare 10-digit local form, starting with 9.
 * Strips a leading +63/63 country code or a leading 0 trunk prefix — needed because contact
 * apps and browser autofill usually save numbers with the country code, and pasting that into
 * a field that already shows a fixed "+63" badge would otherwise double up the prefix.
 * Examples:
 *  "+63 917 123 4567" -> "9171234567"
 *  "0917-123-4567"    -> "9171234567"
 *  "639171234567"     -> "9171234567"
 *  "9171234567"       -> "9171234567"
 */
export function sanitizePHMobileNumber(input: string): string {
  if (!input) return '';
  const digitsOnly = input.replace(/\D/g, '');
  return digitsOnly.replace(/^(?:63|0)?(9\d{0,9})$/, '$1');
}

/** Reformats a mobile-number input live as "9XX XXX XXXX", after normalizing away any leading
 *  +63/63/0 the user typed or pasted — the fixed +63 badge next to the input already covers
 *  that part. */
export function formatPHMobileAsTyped(raw: string): string {
  const digits = sanitizePHMobileNumber(raw).slice(0, 10);
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean).join(' ');
}

/** True once the local part is a complete, well-formed PH mobile number (10 digits, starting with 9). */
export function isValidPHMobileNumber(raw: string): boolean {
  return /^9\d{9}$/.test(sanitizePHMobileNumber(raw));
}
