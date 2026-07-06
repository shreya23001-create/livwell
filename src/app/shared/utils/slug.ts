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

export function projectIdFromSlug(slug: string): number | null {
  const parts = slug.split('-');
  const id = Number(parts[parts.length - 1]);
  return isNaN(id) ? null : id;
}
