import { getFeaturedPhotos } from '../data/featured';
import { isRemoteUrl, isStringSrc, type PhotoSource } from '../types/photos';
import type { WallPhoto } from '../types/wall';
import type { Album } from './albums';
import { optimizeDisplayPhoto, optimizeLightboxPhoto } from './optimizePhoto';

/** R2 scans are 35 mm frames; assume 3:2 until the browser measures them. */
const ASSUMED_W = 3;
const ASSUMED_H = 2;

export async function toWallPhoto(
  src: PhotoSource,
  alt: string,
  album?: WallPhoto['album'],
): Promise<WallPhoto> {
  if (isStringSrc(src) && isRemoteUrl(src)) {
    return { id: src, src, full: src, w: ASSUMED_W, h: ASSUMED_H, sized: false, alt, album };
  }

  const display = await optimizeDisplayPhoto(src, '(max-width: 768px) 60vw, 520px');
  const full = await optimizeLightboxPhoto(src);
  return {
    id: isStringSrc(src) ? src : src.src,
    src: display.webpSrc,
    srcset: display.webpSrcSet,
    full,
    w: display.width,
    h: display.height,
    sized: true,
    alt,
    album,
  };
}

export async function albumWallPhotos(album: Album): Promise<WallPhoto[]> {
  const link = { title: album.title, href: album.href };
  return Promise.all(
    album.photos.map((photo, i) =>
      toWallPhoto(photo.src, photo.alt?.trim() || `${album.title} — cuadro ${i + 1}`, link),
    ),
  );
}

/**
 * Everything on the landing wall: featured frames first, then every album
 * frame, de-duplicated by URL. Featured frames inherit the album link when the
 * same file also lives in an album.
 */
export async function homeWallPhotos(albums: Album[]): Promise<WallPhoto[]> {
  const albumPhotos = (await Promise.all(albums.map(albumWallPhotos))).flat();
  const byId = new Map(albumPhotos.map((p) => [p.id, p]));

  const featured = await Promise.all(
    getFeaturedPhotos().map(async (photo) => {
      const wall = await toWallPhoto(photo.src, photo.alt);
      const twin = byId.get(wall.id);
      return twin
        ? { ...wall, album: twin.album, alt: photo.alt === 'Foto destacada' ? twin.alt : wall.alt }
        : wall;
    }),
  );

  const seen = new Set<string>();
  return [...featured, ...albumPhotos].filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}
