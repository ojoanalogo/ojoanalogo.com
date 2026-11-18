import { getCollection, type CollectionEntry } from 'astro:content';
import {
  DEMO_FILL,
  DEMO_MIN_ALBUM,
  DEMO_MIN_FRAMES,
  demoAlbumPhotos,
  demoFrames,
} from '../components/demo/placeholders';
import { getFeaturedPhotos } from '../data/featured';
import { isRemoteSrc, type PhotoSource } from '../types/photos';
import { gallerySlug } from './gallery';
import { resolveGalleryPhotos } from './galleryPhotos';

export type AlbumEntry = CollectionEntry<'gallery'>;

export type AlbumPhoto = {
  src: string;
  thumb: string;
  alt: string;
  /** Known only for placeholders; CMS photos are sized client-side. */
  width?: number;
  height?: number;
  demo?: boolean;
};

export type Album = {
  entry: AlbumEntry;
  slug: string;
  title: string;
  description?: string;
  date?: Date;
  year?: number;
  /** Real CMS photos only. */
  photoCount: number;
  /** CMS photos, padded with concept placeholders when DEMO_FILL is on. */
  photos: AlbumPhoto[];
  cover?: AlbumPhoto;
};

export type Frame = {
  src: string;
  thumb: string;
  alt: string;
  title: string;
  meta: string;
  href?: string;
  demo?: boolean;
};

const urlOf = (src: PhotoSource) => (isRemoteSrc(src) ? src : src.src);

const monthYear = new Intl.DateTimeFormat('es-MX', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatAlbumDate(date?: Date) {
  return date ? monthYear.format(date) : undefined;
}

/** All albums, newest first. */
export async function getAlbums(): Promise<Album[]> {
  const entries = await getCollection('gallery');

  return entries
    .map((entry) => {
      const slug = gallerySlug(entry);
      const real: AlbumPhoto[] = resolveGalleryPhotos(entry.data.photos).map((p) => {
        const url = urlOf(p.default);
        return { src: url, thumb: url, alt: p.alt?.trim() || entry.data.title };
      });

      const padding =
        DEMO_FILL && real.length < DEMO_MIN_ALBUM
          ? demoAlbumPhotos(DEMO_MIN_ALBUM - real.length, slug, real.length).map((p) => ({
              ...p,
              demo: true,
            }))
          : [];

      const photos = [...real, ...padding];
      const date = entry.data.date;

      return {
        entry,
        slug,
        title: entry.data.title,
        description: entry.data.description?.trim() || undefined,
        date,
        year: date?.getUTCFullYear(),
        photoCount: real.length,
        photos,
        cover: photos[0],
      } satisfies Album;
    })
    .sort((a, b) => (b.date?.valueOf() ?? 0) - (a.date?.valueOf() ?? 0));
}

/**
 * Landing filmstrip: featured CMS photos, captioned with the album they
 * belong to (matched by image URL) so each frame reads like an index entry.
 */
export async function getLandingFrames(): Promise<Frame[]> {
  const albums = await getAlbums();
  const albumByUrl = new Map<string, Album>();
  for (const album of albums) {
    for (const photo of album.photos) {
      if (!photo.demo && !albumByUrl.has(photo.src)) albumByUrl.set(photo.src, album);
    }
  }

  const real: Frame[] = getFeaturedPhotos().map((photo, i) => {
    const src = urlOf(photo.src);
    const album = albumByUrl.get(src);
    const alt = photo.alt === 'Featured photo' ? '' : photo.alt;

    if (album) {
      return {
        src,
        thumb: src,
        alt: alt || album.title,
        title: album.title,
        meta: [album.description, album.year].filter(Boolean).join(', '),
        href: `/${album.slug}`,
      };
    }

    return {
      src,
      thumb: src,
      alt: alt || `Fotograma ${String(i + 1).padStart(2, '0')}`,
      title: alt || 'Sin título',
      meta: 'Archivo',
    };
  });

  if (!DEMO_FILL || real.length >= DEMO_MIN_FRAMES) return real;

  const padding: Frame[] = demoFrames(DEMO_MIN_FRAMES - real.length).map((p, i) => ({
    ...p,
    title: `Muestra ${String(real.length + i + 1).padStart(2, '0')}`,
    meta: 'Placeholder, Unsplash',
    demo: true,
  }));

  return [...real, ...padding];
}
