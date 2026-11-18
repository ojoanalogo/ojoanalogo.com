/**
 * Concept-preview placeholders (Detent redesign branch only).
 *
 * The CMS currently holds very few photos, which makes the filmstrip and
 * album grids hard to judge. When `DEMO_FILL` is on, layouts pad real CMS
 * photos with Unsplash frames up to a minimum count. CMS data is never
 * modified — flip this to `false` (or delete this file's usages) before
 * shipping.
 */
export const DEMO_FILL = true;

/** Minimum frames on the landing filmstrip before padding kicks in. */
export const DEMO_MIN_FRAMES = 14;
/** Minimum photos in an album grid before padding kicks in. */
export const DEMO_MIN_ALBUM = 7;

type DemoShot = { id: string; alt: string };

const POOL: DemoShot[] = [
  { id: '1493976040374-85c8e12f0c0e', alt: 'Calle de Kioto con pagoda al fondo' },
  { id: '1503023345310-bd7c1de61c7d', alt: 'Figura de espaldas en un campo abierto' },
  { id: '1470071459604-3b5ec3a7fe05', alt: 'Colinas con niebla al amanecer' },
  { id: '1480796927426-f609979314bd', alt: 'Fachada de una tienda tradicional japonesa' },
  { id: '1485230895905-ec40ba36b9bc', alt: 'Retrato frente a un muro blanco' },
  { id: '1500530855697-b586d89ba3ee', alt: 'Carretera entre montañas rojas' },
  { id: '1528360983277-13d401cdc186', alt: 'Linternas rojas en un callejón de noche' },
  { id: '1502082553048-f009c37129b9', alt: 'Árbol solitario en un prado' },
  { id: '1515886657613-9f3515b0c78f', alt: 'Pantalón amarillo contra el cielo' },
  { id: '1469474968028-56623f02e42e', alt: 'Cerros dorados al atardecer' },
  { id: '1484406566174-9da000fda645', alt: 'Venado entre la maleza' },
  { id: '1496747611176-843222e1e57c', alt: 'Vestido floral frente al mar' },
  { id: '1513407030348-c983a97b98d8', alt: 'Ciudad al anochecer desde lo alto' },
  { id: '1465146344425-f00d5f5c8f07', alt: 'Amapolas en un campo blanco' },
  { id: '1524504388940-b1c1722653e1', alt: 'Retrato en penumbra' },
  { id: '1534447677768-be436bb09401', alt: 'Bote sobre el mar bajo las estrellas' },
  { id: '1473448912268-2022ce9509d8', alt: 'Bosque reflejado en un lago' },
  { id: '1516483638261-f4dbaf036963', alt: 'Casas de colores sobre un acantilado' },
];

const unsplash = (id: string, params: string) =>
  `https://images.unsplash.com/photo-${id}?${params}&q=80&auto=format`;

export type DemoPhoto = {
  /** Large display URL. */
  src: string;
  /** Small filmstrip / preview URL. */
  thumb: string;
  alt: string;
  width?: number;
  height?: number;
};

/** Portrait 3:4 crops — mirror the reference's consistent frame shape. */
export function demoFrames(count: number, offset = 0): DemoPhoto[] {
  return Array.from({ length: Math.max(0, count) }, (_, i) => {
    const shot = POOL[(i + offset) % POOL.length];
    return {
      src: unsplash(shot.id, 'w=1200&h=1600&fit=crop&crop=entropy'),
      thumb: unsplash(shot.id, 'w=120&h=190&fit=crop&crop=entropy'),
      alt: shot.alt,
    };
  });
}

/**
 * Album grid placeholders. `startAt` is the position in the final album
 * list, so the rhythm (pairs of portraits, a full-width landscape every
 * fifth frame) holds after the real CMS photos.
 */
export function demoAlbumPhotos(count: number, seed = '', startAt = 0): DemoPhoto[] {
  const offset = [...seed].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return Array.from({ length: Math.max(0, count) }, (_, i) => {
    const shot = POOL[(i * 5 + offset) % POOL.length];
    const wide = (startAt + i) % 5 === 4;
    const [width, height] = wide ? [2000, 1250] : [1200, 1500];
    return {
      src: unsplash(shot.id, `w=${width}&h=${height}&fit=crop&crop=entropy`),
      thumb: unsplash(shot.id, 'w=640&h=800&fit=crop&crop=entropy'),
      alt: shot.alt,
      width,
      height,
    };
  });
}

/** Portrait used on /about when the CMS has no portrait yet. */
export const DEMO_PORTRAIT = unsplash(
  '1503023345310-bd7c1de61c7d',
  'w=1200&h=1600&fit=crop&crop=entropy',
);
