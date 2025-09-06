import { defineCollection, z } from "astro:content";

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
});

export type CollectionsSchema = z.infer<typeof blogSchema>;
export type GallerySchema = z.infer<typeof gallerySchema>;

const blogCollection = defineCollection({ schema: blogSchema });
const galleryCollection = defineCollection({
  schema: gallerySchema,
  type: 'content'
});

export const collections = {
  blog: blogCollection,
  gallery: galleryCollection,
};
