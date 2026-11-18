import { getCollection, type CollectionEntry } from 'astro:content';
import type { CmsPhoto } from '../types/photos';
import { gallerySlug } from './gallery';

export type Album = {
  slug: string;
  title: string;
  description?: string;
  date?: Date;
  year?: string;
  /** Real CMS photos only (non-empty image URLs). */
  photos: CmsPhoto[];
  entry: CollectionEntry<'gallery'>;
};

export function toAlbum(entry: CollectionEntry<'gallery'>): Album {
  const { title, description, date, photos } = entry.data;
  return {
    slug: gallerySlug(entry),
    title,
    description: description?.trim() || undefined,
    date,
    year: date ? String(date.getUTCFullYear()) : undefined,
    photos: (photos ?? []).filter(
      (p) => typeof p.image === 'string' && p.image.length > 0,
    ),
    entry,
  };
}

/** All albums, newest first (same order the old header menu used). */
export async function getAlbums(): Promise<Album[]> {
  const entries = await getCollection('gallery');
  return entries
    .map(toAlbum)
    .sort((a, b) => (b.date?.valueOf() ?? 0) - (a.date?.valueOf() ?? 0));
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
