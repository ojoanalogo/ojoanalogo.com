import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { isRemoteUrl, isStringSrc, type PhotoSource } from '../types/photos';

export type OptimizedSources = {
  webpSrc: string;
  webpSrcSet: string;
  width: number;
  height: number;
  sizes: string;
};

const DISPLAY_WIDTHS = [480, 800, 1200] as const;
const LIGHTBOX_MAX_WIDTH = 1800;

function clampWidths(originalWidth: number, candidates: number[]) {
  const capped = candidates.map((w) => Math.min(w, originalWidth)).filter((w) => w > 0);
  return [...new Set(capped)].sort((a, b) => a - b);
}

/** Remote R2/CDN — served as-is (enable Cloudflare Image Resizing later for thumbs). */
function remotePassthrough(url: string, sizes: string): OptimizedSources {
  return {
    webpSrc: url,
    webpSrcSet: url,
    width: 1600,
    height: 1200,
    sizes,
  };
}

async function buildResponsiveSources(
  src: ImageMetadata,
  widths: number[],
  quality: number,
  sizes: string,
): Promise<OptimizedSources> {
  const safeWidths = clampWidths(src.width, widths);
  const maxWidth = safeWidths[safeWidths.length - 1];

  const webpVariants = await Promise.all(
    safeWidths.map((width) => getImage({ src, width, format: 'webp', quality })),
  );

  const webpSrcSet = webpVariants.map((img, i) => `${img.src} ${safeWidths[i]}w`).join(', ');
  const primary = webpVariants[webpVariants.length - 1];
  const height = Math.max(1, Math.round((src.height / src.width) * maxWidth));

  return {
    webpSrc: primary.src,
    webpSrcSet,
    width: maxWidth,
    height,
    sizes,
  };
}

/** Wall / sequence display photos */
export async function optimizeDisplayPhoto(
  src: PhotoSource,
  sizes = '(max-width: 768px) 92vw, (max-width: 1280px) 80vw, 1200px',
): Promise<OptimizedSources> {
  if (isStringSrc(src)) {
    // Paths and absolute URLs — no local transform pipeline for R2 yet.
    if (isRemoteUrl(src) || src.startsWith('/')) return remotePassthrough(src, sizes);
  }
  return buildResponsiveSources(src as ImageMetadata, [...DISPLAY_WIDTHS], 70, sizes);
}

/** Lightbox / full-view */
export async function optimizeLightboxPhoto(src: PhotoSource): Promise<string> {
  if (isStringSrc(src)) return src;

  const width = Math.min(src.width, LIGHTBOX_MAX_WIDTH);
  const image = await getImage({
    src,
    width,
    format: 'webp',
    quality: 75,
  });
  return image.src;
}
