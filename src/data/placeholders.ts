import type { CmsPhoto } from '../types/photos';

/**
 * Concept-demo only (redesign/sienna).
 *
 * Unsplash frames used to preview layouts when the CMS has no photo for a
 * slot (or an album is too sparse to show the photo sequence). They are never
 * written to CMS data — set DEMO_PLACEHOLDERS to `false`, or add real photos
 * through /admin, and they disappear.
 */
export const DEMO_PLACEHOLDERS = true;

/** Albums with fewer real photos than this are padded with sample frames. */
export const DEMO_MIN_ALBUM_FRAMES = 6;

const unsplash = (id: string, w = 1800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format`;

const sample = (id: string, alt: string): CmsPhoto => ({
  image: unsplash(id),
  alt: `${alt} (foto de muestra, Unsplash)`,
});

const SETS: Record<string, CmsPhoto[]> = {
  japan: [
    sample('1493976040374-85c8e12f0c0e', 'Calle de Kioto con pagoda al fondo'),
    sample('1478436127897-769e1b3f0f36', 'Túnel de toriis'),
    sample('1513407030348-c983a97b98d8', 'Tokio al atardecer'),
    sample('1528360983277-13d401cdc186', 'Callejón con linternas'),
    sample('1490806843957-31f4c9a91c65', 'Monte Fuji'),
    sample('1524413840807-0c3cb6fa808d', 'Cerezos de noche'),
  ],
  default: [
    sample('1418065460487-3e41a6c84dc5', 'Bosque entre niebla'),
    sample('1500534314209-a25ddb2bd429', 'Montañas en capas'),
    sample('1441974231531-c6227db76b6e', 'Luz entre los árboles'),
    sample('1447752875215-b2761acb3c5d', 'Puente en el bosque'),
    sample('1439853949127-fa647821eba0', 'Lago de montaña'),
    sample('1469474968028-56623f02e42e', 'Colinas al amanecer'),
  ],
};

export const DEMO_PORTRAIT = sample(
  '1495745966610-2a67f2297e5e',
  'Fotógrafo detrás de la cámara',
);

export function placeholderSet(slug?: string): CmsPhoto[] {
  return (slug && SETS[slug]) || SETS.default;
}

/**
 * Return real photos, padded with sample frames when demo mode is on.
 * `sample` counts how many placeholders were appended.
 */
export function withPlaceholders(
  photos: CmsPhoto[],
  slug?: string,
  min = DEMO_MIN_ALBUM_FRAMES,
): { photos: Array<CmsPhoto & { sample?: boolean }>; sample: number } {
  if (!DEMO_PLACEHOLDERS || photos.length >= min) {
    return { photos, sample: 0 };
  }
  const fill = placeholderSet(slug)
    .filter((p) => !photos.some((real) => real.image === p.image))
    .slice(0, min - photos.length)
    .map((p) => ({ ...p, sample: true }));
  return { photos: [...photos, ...fill], sample: fill.length };
}
