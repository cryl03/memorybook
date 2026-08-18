/**
 * Sandbox sometimes returns unique_id without dashes
 * (`55daf6ab41d5...`) while Django URL converters expect UUID form.
 */
export function normalizeAlbumId(id: string): string {
  const raw = id.trim();
  if (!raw) return raw;

  const hex = raw.replace(/-/g, '').toLowerCase();
  if (/^[0-9a-f]{32}$/.test(hex)) {
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join('-');
  }

  return raw;
}

/** Compare album IDs ignoring dashes / casing. */
export function albumIdsEqual(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return a.replace(/-/g, '').toLowerCase() === b.replace(/-/g, '').toLowerCase();
}
