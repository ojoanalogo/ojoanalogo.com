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

/** Absolute http(s) URL — needs CORS for canvas sampling (loupe). */
export function isRemoteUrl(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

/** Set before assigning src so drawImage + getImageData stay untainted. */
export function allowCanvasCors(img: HTMLImageElement, src: string) {
  if (isRemoteUrl(src)) img.crossOrigin = 'anonymous';
  else img.removeAttribute('crossorigin');
}
