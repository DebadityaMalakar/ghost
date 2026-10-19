const PLACEHOLDER = /{{(.*?)}}/g;

/** Text shown for a value that is missing or not set yet. */
export const toDisplay = (value: unknown) => (value == null ? "null" : String(value));

/** True if `text` contains at least one {{placeholder}}. */
export const hasPlaceholders = (text: string) =>
  text.includes("{{") && text.includes("}}");

/**
 * Replaces every {{key}} in `text` with the result of `resolve`.
 * `resolve` gets the trimmed key and the full original placeholder.
 */
export const fillPlaceholders = (
  text: string,
  resolve: (key: string, placeholder: string) => string
) => text.replace(PLACEHOLDER, (placeholder, key: string) => resolve(key.trim(), placeholder));
