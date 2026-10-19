/** Parses a duration like "1s", "500ms" or "0s" into milliseconds. */
export const parseDuration = (value: string | null, fallback: number): number => {
  if (!value) return fallback;
  if (value.endsWith("ms")) return parseFloat(value) || fallback;
  if (value.endsWith("s")) return (parseFloat(value) || 0) * 1000;
  return fallback;
};
