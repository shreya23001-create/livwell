export function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function toProjectSlug(title: string, id: number): string {
  return `${toSlug(title)}-${id}`;
}

export function toPropertySlug(title: string, id: number): string {
  return `${toSlug(title)}-${id}`;
}

export function idFromSlug(slug: string): number | null {
  const parts = slug.split('-');
  const id = Number(parts[parts.length - 1]);
  return isNaN(id) ? null : id;
}

// Keep old name as alias for backwards compat
export const projectIdFromSlug = idFromSlug;
