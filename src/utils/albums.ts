import { getCollection, type CollectionEntry } from 'astro:content';
import { gallerySlug } from './gallery';
import { resolveGalleryPhotos, type GalleryPhotoItem } from './galleryPhotos';

export interface Album {
  entry: CollectionEntry<'gallery'>;
  slug: string;
  href: string;
  title: string;
  description?: string;
  date?: Date;
  year?: string;
  /** Chronological roll number, oldest album = "01". */
  number: string;
  photos: GalleryPhotoItem[];
}

const dateValue = (entry: CollectionEntry<'gallery'>) => entry.data.date?.valueOf() ?? 0;

/** All albums, newest first, with a stable chronological roll number. */
export async function getAlbums(): Promise<Album[]> {
  const entries = await getCollection('gallery');
  const chronological = [...entries].sort((a, b) => dateValue(a) - dateValue(b));
  const numbers = new Map(
    chronological.map((entry, i) => [entry.id, String(i + 1).padStart(2, '0')]),
  );

  return [...entries]
    .sort((a, b) => dateValue(b) - dateValue(a))
    .map((entry) => {
      const slug = gallerySlug(entry);
      const date = entry.data.date;
      return {
        entry,
        slug,
        href: `/${slug}`,
        title: entry.data.title || slug,
        description: entry.data.description || undefined,
        date,
        year: date ? String(date.getUTCFullYear()) : undefined,
        number: numbers.get(entry.id) ?? '00',
        photos: resolveGalleryPhotos(entry.data.photos),
      };
    });
}

/** dd.mm.yyyy — the way a lab envelope would print it. */
export function formatRollDate(date?: Date): string | undefined {
  if (!date) return undefined;
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${date.getUTCFullYear()}`;
}
