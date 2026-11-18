export function gallerySlug(entry: { id: string; data: { slug?: string } }) {
  return entry.data.slug ?? entry.id.replace(/\/index$/, '');
}
