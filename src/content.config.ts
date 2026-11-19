import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const cmsPhotoSchema = z.object({
  image: z.string(),
  alt: z.string().optional(),
});

const gallerySchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  slug: z.string().optional(),
  date: z.coerce.date().optional(),
  photos: z.array(cmsPhotoSchema).optional(),
});

export type CmsPhoto = z.infer<typeof cmsPhotoSchema>;

const galleryCollection = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/gallery' }),
  schema: gallerySchema,
});

export const collections = {
  gallery: galleryCollection,
};
