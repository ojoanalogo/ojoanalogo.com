import type { ImageMetadata } from 'astro';
import type { CmsPhoto, PhotoSource } from '../types/photos';

export type GalleryPhotoItem = {
  default: PhotoSource;
  alt?: string;
};

/** Prefer CMS/R2 photo list; fall back to local files next to the album. */
export function resolveGalleryPhotos(
  cmsPhotos: CmsPhoto[] | undefined,
  localImages: Record<string, { default: ImageMetadata }>,
  slug: string,
): GalleryPhotoItem[] {
  if (cmsPhotos && cmsPhotos.length > 0) {
    return cmsPhotos
      .filter((p) => typeof p.image === 'string' && p.image.length > 0)
      .map((p) => ({
        default: p.image,
        alt: p.alt,
      }));
  }

  return Object.entries(localImages)
    .filter(([path]) => path.includes(`/gallery/${slug}/`))
    .map(([, image]) => ({
      default: image.default,
    }))
    .sort((a, b) => {
      const aSrc = typeof a.default === 'string' ? a.default : a.default.src;
      const bSrc = typeof b.default === 'string' ? b.default : b.default.src;
      return aSrc.localeCompare(bSrc);
    });
}
