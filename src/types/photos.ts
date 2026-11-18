import type { ImageMetadata } from 'astro';

/** Local Astro asset or remote URL (R2 / CDN). */
export type PhotoSource = ImageMetadata | string;

export interface Photo {
  src: PhotoSource;
  alt: string;
  href?: string;
}

export interface CmsPhoto {
  image: string;
  alt?: string;
}

export function isRemoteSrc(src: PhotoSource): src is string {
  return typeof src === 'string';
}
