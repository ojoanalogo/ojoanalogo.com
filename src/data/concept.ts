import type { WallPhoto } from '../types/wall';

/**
 * CONCEPT PREVIEW ONLY — Infinite Folio redesign.
 *
 * The CMS catalog is still small (a couple of R2 frames), which makes an
 * infinite wall look repetitive. While this flag is on, the layout pads walls
 * with Unsplash film-look placeholders. Nothing here touches the CMS data
 * (featured.json / site.json / gallery markdown); flip the flag to `false`
 * once the real archive is uploaded and the site renders only R2 photos.
 */
export const CONCEPT_PLACEHOLDERS = true;

type Ratio = 'l32' | 'l43' | 'p23' | 'p34' | 'p45';

interface Placeholder {
  id: string;
  /** Unsplash page path, for attribution. */
  page: string;
  ratio: Ratio;
  alt: string;
  /** Album slug this frame suits best when padding album walls. */
  hint?: string;
}

const RATIOS: Record<Ratio, [number, number]> = {
  l32: [3, 2],
  l43: [4, 3],
  p23: [2, 3],
  p34: [3, 4],
  p45: [4, 5],
};

const POOL: Placeholder[] = [
  { id: 'photo-1597082467659-5f36982bb1b1', page: 'cars-on-road-between-buildings-during-daytime-wivosYFcJlw', ratio: 'l32', alt: 'Avenida con autos entre edificios bajos', hint: 'japan' },
  { id: 'photo-1587653263995-422546a7a569', page: 'man-in-black-jacket-riding-bicycle-on-road-during-daytime-Q3DaZ8vmBAA', ratio: 'p34', alt: 'Ciclista en una calle de barrio con cables', hint: 'japan' },
  { id: 'photo-1561503972-839d0c56de17', page: 'empty-road-between-buildings-grOTReWUHhU', ratio: 'p23', alt: 'Callejón vacío entre casas', hint: 'japan' },
  { id: 'photo-1531408638501-77322cd8a5ed', page: 'green-and-orange-temples-_7RtWTAXvms', ratio: 'p34', alt: 'Pagoda naranja contra un cielo rosado', hint: 'japan' },
  { id: 'photo-1765707886601-19be939f1c1f', page: 'a-person-walks-down-a-narrow-street-lined-with-shops-DucImXdll8E', ratio: 'p23', alt: 'Calle estrecha con tiendas al atardecer', hint: 'japan' },
  { id: 'photo-1591873381631-4104d6e7d105', page: 'a-road-with-a-mountain-in-the-background-O3oQg9CPy1k', ratio: 'p34', alt: 'Camino con una montaña nevada al fondo', hint: 'japan' },
  { id: 'photo-1774124917586-fd69e64d7baa', page: 'cyclist-crossing-street-in-front-of-parisian-buildings-jeBaKGuXovQ', ratio: 'p23', alt: 'Ciclista cruzando frente a fachadas antiguas' },
  { id: 'photo-1642553192634-16cbe8b47562', page: 'a-car-parked-in-front-of-a-closed-building-mSXqO4k6-ew', ratio: 'l32', alt: 'Auto estacionado frente a un local cerrado' },
  { id: 'photo-1682436461122-430ffe00f412', page: 'a-street-with-cars-parked-on-the-side-of-it-u46EOhESN74', ratio: 'p23', alt: 'Calle al atardecer con autos estacionados', hint: 'narnia' },
  { id: 'photo-1685962890164-20bc1c7b4ab6', page: 'a-cobblestone-street-lined-with-tall-buildings-a6Iq3QxMBxU', ratio: 'p23', alt: 'Callejón empedrado entre edificios altos', hint: 'narnia' },
  { id: 'photo-1700771146598-d9db2b79d4b8', page: 'a-narrow-alley-way-with-a-building-in-the-background-kz62VUtAktk', ratio: 'p23', alt: 'Callejón angosto con un edificio al fondo', hint: 'narnia' },
  { id: 'photo-1480997945751-3d54b83c7871', page: 'female-women-standing-near-black-pole-Y-ygHjgGP7k', ratio: 'l32', alt: 'Mujeres esperando junto a un poste' },
  { id: 'photo-1629032449275-706895bc04cd', page: 'grayscale-photo-of-people-walking-on-sidewalk-psxmcdc87Gs', ratio: 'l32', alt: 'Peatones en blanco y negro sobre la acera' },
  { id: 'photo-1621495413859-9ec4714d95fc', page: 'people-walking-on-street-during-daytime-3JtZRqNKNCI', ratio: 'p23', alt: 'Calle empedrada con una iglesia a contraluz', hint: 'narnia' },
  { id: 'photo-1636792555365-061b44bb4315', page: 'a-set-of-stone-steps-leading-up-to-a-building-Bp7CtB0gXUE', ratio: 'p23', alt: 'Escalinata de piedra hacia una casa naranja', hint: 'narnia' },
  { id: 'photo-1657038608903-a149544577e2', page: 'a-person-walking-down-a-sidewalk-rRlSMd5ohlk', ratio: 'l32', alt: 'Persona caminando por la banqueta' },
  { id: 'photo-1710047054138-0f59680b5705', page: 'a-city-street-with-people-crossing-the-street-wQNeHEQ7Skw', ratio: 'p23', alt: 'Cruce peatonal en una avenida arbolada' },
  { id: 'photo-1531166473306-c4c0827f3a89', page: 'photo-of-black-door-qXgbYjcBJHc', ratio: 'p34', alt: 'Puerta oscura en un muro rosa', hint: 'narnia' },
  { id: 'photo-1695385246289-2e7d2ab5e16b', page: 'a-street-lined-with-colorful-buildings-and-flags-9AFMVXjp5ik', ratio: 'l32', alt: 'Calle con papel picado y fachadas de colores' },
  { id: 'photo-1686448921760-342483ed478f', page: 'a-white-car-parked-on-the-side-of-a-street-CNJ20oUKGjE', ratio: 'l32', alt: 'Casa amarilla con un auto blanco estacionado' },
  { id: 'photo-1628618402733-88682d367d28', page: 'gray-concrete-road-between-brown-concrete-houses-during-daytime-QfBRBEKj76E', ratio: 'l32', alt: 'Calle empedrada entre muros rojos' },
  { id: 'photo-1680444017769-f859e6528b76', page: 'a-person-riding-a-bike-down-a-street-aUJXznD2o7M', ratio: 'p23', alt: 'Ciclista bajando por una calle con cables' },
  { id: 'photo-1673316651777-c48497010b7c', page: 'a-brown-building-with-a-clock-on-the-side-of-it-9OT7_KLi0i4', ratio: 'p23', alt: 'Esquina de un edificio colonial con reloj' },
  { id: 'photo-1604436467632-895049fa868b', page: 'a-brick-street-with-potted-plants-on-the-side-of-it-v1bLoFolUK4', ratio: 'p45', alt: 'Calle de ladrillo con macetas', hint: 'narnia' },
  { id: 'photo-1680444109809-800d3d6b4fb6', page: 'a-red-car-parked-on-the-side-of-a-road-ygFZJU0gIjs', ratio: 'l32', alt: 'Auto rojo estacionado en una calle de pueblo' },
  { id: 'photo-1700908609242-45ff4a0bddcb', page: 'a-sandy-beach-with-mountains-in-the-background-XRtYtax_VtM', ratio: 'p23', alt: 'Playa con montañas al fondo', hint: 'narnia' },
  { id: 'photo-1700908608013-e1e1da3f4739', page: 'a-group-of-people-sitting-on-top-of-a-bench-under-palm-trees-Q9fLiqV29ZU', ratio: 'p23', alt: 'Banca bajo palmeras frente al mar' },
  { id: 'photo-1700908607877-b48e549d3b7e', page: 'a-group-of-people-sitting-on-a-beach-next-to-the-ocean-_s-Pl3kkv8M', ratio: 'l32', alt: 'Bañistas en la orilla de una playa' },
  { id: 'photo-1637051611188-115e3add7d5a', page: 'a-picture-of-a-beach-with-trees-and-water-in-the-background-Uj_ji7AtU9A', ratio: 'l32', alt: 'Bahía con una fuga de luz naranja', hint: 'narnia' },
  { id: 'photo-1573959429734-9c1f57132f18', page: 'green-leaf-trees-at-daytime-UR208pB3T7k', ratio: 'l43', alt: 'Copas de árboles al atardecer', hint: 'narnia' },
];

function unsplash(id: string, w: number, h: number, q: number) {
  return `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&crop=entropy&q=${q}&auto=format`;
}

function size(ratio: Ratio, longEdge: number): [number, number] {
  const [rw, rh] = RATIOS[ratio];
  return rw >= rh
    ? [longEdge, Math.round((longEdge * rh) / rw)]
    : [Math.round((longEdge * rw) / rh), longEdge];
}

function toWallPhoto(p: Placeholder, album?: WallPhoto['album']): WallPhoto {
  const [w1, h1] = size(p.ratio, 480);
  const [w2, h2] = size(p.ratio, 900);
  const [wf, hf] = size(p.ratio, 1800);
  return {
    id: `unsplash:${p.id}`,
    src: unsplash(p.id, w2, h2, 70),
    srcset: `${unsplash(p.id, w1, h1, 70)} ${w1}w, ${unsplash(p.id, w2, h2, 70)} ${w2}w`,
    full: unsplash(p.id, wf, hf, 78),
    w: wf,
    h: hf,
    sized: true,
    alt: p.alt,
    album,
    credit: { label: 'Muestra · Unsplash', href: `https://unsplash.com/photos/${p.page}` },
  };
}

function hashSeed(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  let s = hashSeed(seed) || 1;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Pad a wall up to `min` frames with placeholders. Frames hinted for `prefer`
 * (an album slug) go first so each album keeps its own mood.
 */
export function padWithPlaceholders(
  photos: WallPhoto[],
  min: number,
  opts: { seed: string; prefer?: string; album?: WallPhoto['album'] },
): WallPhoto[] {
  if (!CONCEPT_PLACEHOLDERS || photos.length >= min) return photos;

  const preferred = opts.prefer ? POOL.filter((p) => p.hint === opts.prefer) : [];
  const rest = seededShuffle(
    POOL.filter((p) => !preferred.includes(p)),
    opts.seed,
  );
  const picks = [...seededShuffle(preferred, opts.seed), ...rest].slice(0, min - photos.length);

  return [...photos, ...picks.map((p) => toWallPhoto(p, opts.album))];
}
