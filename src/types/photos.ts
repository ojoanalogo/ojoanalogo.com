import type { ImageMetadata } from 'astro';

/** Local Astro asset or URL string (R2 / path). */
export type PhotoSource = ImageMetadata | string;

export interface Photo {
  src: PhotoSource;
  alt: string;
}

/** Absolute http(s) URL — R2/CDN; needs CORS for canvas sampling (loupe). */
export function isRemoteUrl(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

/** True when the source is a URL string (remote or site path), not an Astro asset. */
export function isStringSrc(src: PhotoSource): src is string {
  return typeof src === 'string';
}

/** Set before assigning src so drawImage + getImageData stay untainted. */
export function allowCanvasCors(img: HTMLImageElement, src: string) {
  if (isRemoteUrl(src)) img.crossOrigin = 'anonymous';
  else img.removeAttribute('crossorigin');
}
