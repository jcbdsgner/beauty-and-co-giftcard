/** Builds a "?a=1&b=2" query string from a params object, dropping empty/undefined values. */
export function buildQuery(params: Record<string, string | undefined>) {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string] => !!entry[1],
  );
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries).toString()}`;
}
