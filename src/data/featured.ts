import type { CmsPhoto, Photo } from '../types/photos';
import featuredData from './featured.json';

// Local fallback while migrating landing photos to R2 via the CMS.
const localFeatured = import.meta.glob('../assets/featured/*.{png,jpg,jpeg,gif,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, Photo['src']>;

function fromCms(photos: CmsPhoto[]): Photo[] {
  return photos
    .filter((p) => typeof p.image === 'string' && p.image.length > 0)
    .map((p) => ({
      src: p.image,
      alt: p.alt?.trim() || 'Featured photo',
      href: '/',
    }));
}

function fromLocalAssets(): Photo[] {
  return Object.entries(localFeatured).map(([path, image]) => {
    const filename =
      path.split('/').pop()?.replace(/\.(png|jpg|jpeg|gif|webp)$/i, '') || '';

    return {
      src: image,
      alt: `Featured photo: ${filename}`,
      href: '/',
    };
  });
}

export function getFeaturedPhotos(): Photo[] {
  const cmsPhotos = fromCms(featuredData.photos ?? []);
  if (cmsPhotos.length > 0) return cmsPhotos;
  return fromLocalAssets();
}
