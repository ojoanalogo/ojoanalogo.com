import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";

export type OptimizedSources = {
  webpSrc: string;
  webpSrcSet: string;
  avifSrcSet: string;
  width: number;
  height: number;
  sizes: string;
};

const DISPLAY_WIDTHS = [480, 800, 1200] as const;
const LIGHTBOX_MAX_WIDTH = 1800;
const THUMB_MAX_WIDTH = 800;

function clampWidths(originalWidth: number, candidates: number[]) {
  const capped = candidates
    .map((w) => Math.min(w, originalWidth))
    .filter((w) => w > 0);
  return [...new Set(capped)].sort((a, b) => a - b);
}

/**
 * Build responsive sources with explicit per-width transforms.
 * Avoids Astro's `widths` helper, which can still emit a near-original `src`.
 */
async function buildResponsiveSources(
  src: ImageMetadata,
  widths: number[],
  quality: { webp: number; avif: number },
  sizes: string,
): Promise<OptimizedSources> {
  const safeWidths = clampWidths(src.width, widths);
  const maxWidth = safeWidths[safeWidths.length - 1];

  const [webpVariants, avifVariants] = await Promise.all([
    Promise.all(
      safeWidths.map((width) =>
        getImage({ src, width, format: "webp", quality: quality.webp }),
      ),
    ),
    Promise.all(
      safeWidths.map((width) =>
        getImage({ src, width, format: "avif", quality: quality.avif }),
      ),
    ),
  ]);

  const webpSrcSet = webpVariants
    .map((img, i) => `${img.src} ${safeWidths[i]}w`)
    .join(", ");
  const avifSrcSet = avifVariants
    .map((img, i) => `${img.src} ${safeWidths[i]}w`)
    .join(", ");

  const primary = webpVariants[webpVariants.length - 1];
  const height = Math.max(
    1,
    Math.round((src.height / src.width) * maxWidth),
  );

  return {
    webpSrc: primary.src,
    webpSrcSet,
    avifSrcSet,
    width: maxWidth,
    height,
    sizes,
  };
}

/** Featured carousel / large display photos */
export async function optimizeDisplayPhoto(
  src: ImageMetadata,
  sizes = "(max-width: 768px) 92vw, (max-width: 1280px) 80vw, 1200px",
): Promise<OptimizedSources> {
  return buildResponsiveSources(
    src,
    [...DISPLAY_WIDTHS],
    { webp: 70, avif: 62 },
    sizes,
  );
}

/** Masonry grid thumbnails */
export async function optimizeThumbPhoto(
  src: ImageMetadata,
  bigger = false,
): Promise<OptimizedSources> {
  const maxW = bigger ? 1100 : THUMB_MAX_WIDTH;
  const target = Math.min(Math.round(src.width / 2), maxW);
  const sizes = bigger
    ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw";

  return buildResponsiveSources(
    src,
    [Math.min(400, target), target],
    { webp: 62, avif: 55 },
    sizes,
  );
}

/** Lightbox / full-view — still far smaller than multi‑MB film scans */
export async function optimizeLightboxPhoto(src: ImageMetadata): Promise<string> {
  const width = Math.min(src.width, LIGHTBOX_MAX_WIDTH);
  const image = await getImage({
    src,
    width,
    format: "webp",
    quality: 75,
  });
  return image.src;
}
