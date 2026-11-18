/**
 * Serializable photo record shared by the server-rendered wall, the album
 * sequence and the client-side lightbox. Keep it JSON-safe.
 */
export interface WallPhoto {
  /** Stable identity (source URL) used for de-duplication. */
  id: string;
  /** Display-size URL used on the wall and in the sequence. */
  src: string;
  srcset?: string;
  /** Large URL for the lightbox. */
  full: string;
  /** Intrinsic (or assumed) dimensions. */
  w: number;
  h: number;
  /** False when w/h are an assumption (remote R2 files); the client measures on load. */
  sized: boolean;
  alt: string;
  album?: { title: string; href: string };
  /** Attribution for concept placeholders. */
  credit?: { label: string; href: string };
}
