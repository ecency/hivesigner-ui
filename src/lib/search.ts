// TanStack Router's default search handling JSON-parses each query value, which
// is wrong for a signer: it turns weight=0 into the number 0 (then process-value
// treats it as empty and applies the 10000 default, so an unvote becomes a full
// upvote), parses a custom_json `json` string into an object, and strips the
// quotes from a quoted memo. Operation params are raw strings, so the router is
// configured with these parsers to keep every value a string.

export function parseSearch(searchStr: string): Record<string, string> {
  const params = new URLSearchParams(searchStr.replace(/^\?/, ''));
  const out: Record<string, string> = {};
  for (const [key, value] of params) out[key] = value;
  return out;
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null) continue;
    params.set(key, typeof value === 'string' ? value : String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
