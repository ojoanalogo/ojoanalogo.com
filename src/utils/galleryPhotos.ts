import type { CmsPhoto } from '../content.config';
import type { PhotoSource } from '../types/photos';

export type GalleryPhotoItem = {
  src: PhotoSource;
  alt?: string;
};

/** Resolve album photos from CMS frontmatter (R2 URLs). */
export function resolveGalleryPhotos(cmsPhotos: CmsPhoto[] | undefined): GalleryPhotoItem[] {
  if (!cmsPhotos?.length) return [];

  return cmsPhotos
    .filter((p) => typeof p.image === 'string' && p.image.length > 0)
    .map((p) => ({
      src: p.image,
      alt: p.alt,
    }));
}
