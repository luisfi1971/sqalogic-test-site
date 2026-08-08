/**
 * Input masking for the payment form.
 *
 * This is the target for the canon's `fill.readBack: formatted | masked` rule:
 * a masked field gives back something different from what was typed, so a naive
 * read-back check fails every time. Without a field like this the rule is never
 * exercised — and it is the rule that makes fill provable in native contexts.
 *
 * The raw digits are always what the form validates and submits. Only the
 * display is transformed.
 */

export function digitsOf(value: string): string {
  return value.replace(/\D/g, "");
}

/** `4242424242424242` -> `4242 4242 4242 4242`. What read-back sees while typing. */
export function formatCard(value: string): string {
  const digits = digitsOf(value).slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * `4242424242424242` -> `•••• •••• •••• 4242`. What read-back sees once the
 * field has been left, which is a different string again.
 */
export function maskCard(value: string): string {
  const digits = digitsOf(value).slice(0, 19);
  if (digits.length <= 4) return formatCard(digits);
  const hidden = "•".repeat(digits.length - 4) + digits.slice(-4);
  return hidden.replace(/(.{4})/g, "$1 ").trim();
}

/** `1228` -> `12/28`, and a month above 12 is clamped rather than accepted. */
export function formatExpiry(value: string): string {
  const digits = digitsOf(value).slice(0, 4);
  if (digits.length === 0) return "";
  let month = digits.slice(0, 2);
  if (month.length === 2) {
    const n = Number(month);
    if (n === 0) month = "01";
    else if (n > 12) month = "12";
  }
  const year = digits.slice(2);
  return year ? `${month}/${year}` : month;
}

/** The last four digits, which is all a receipt is allowed to show. */
export function lastFour(value: string): string {
  return digitsOf(value).slice(-4);
}
