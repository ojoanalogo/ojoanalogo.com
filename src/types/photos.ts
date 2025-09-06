import type { ImageMetadata } from "astro";

export interface Photo {
  src: ImageMetadata;
  alt: string;
  href: string;
}