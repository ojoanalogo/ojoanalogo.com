import type { CmsPhoto } from '../content.config';
import type { Photo } from '../types/photos';
import featuredData from './featured.json';

export function getFeaturedPhotos(): Photo[] {
  return (featuredData.photos ?? [])
    .filter((p: CmsPhoto) => typeof p.image === 'string' && p.image.length > 0)
    .map((p: CmsPhoto) => ({
      src: p.image,
      alt: p.alt?.trim() || 'Foto destacada',
    }));
}
