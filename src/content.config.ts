import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const cmsPhotoSchema = z.object({
  image: z.string(),
  alt: z.string().optional(),
});

const blogSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  publishDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  coverImage: z.string().optional(),
  published: z.boolean(),
  tags: z.array(z.string()).optional(),
});

const gallerySchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  slug: z.string().optional(),
  date: z.coerce.date().optional(),
  photos: z.array(cmsPhotoSchema).optional(),
});

export type CollectionsSchema = z.infer<typeof blogSchema>;
export type GallerySchema = z.infer<typeof gallerySchema>;

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: blogSchema,
});

const galleryCollection = defineCollection({
  loader: glob({ pattern: '**/index.{md,mdx}', base: './src/content/gallery' }),
  schema: gallerySchema,
});

export const collections = {
  blog: blogCollection,
  gallery: galleryCollection,
};
