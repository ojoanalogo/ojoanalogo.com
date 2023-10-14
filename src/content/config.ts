import { defineCollection, z } from "astro:content";

const photoCollectionsSchema = z.object({
  title: z.string(),
  description: z.string(),
  publishDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  coverImage: z.string().optional(),
  published: z.boolean(),
  tags: z.array(z.string()).optional(),
});

export type CollectionsSchema = z.infer<typeof photoCollectionsSchema>;

const photoCollection = defineCollection({ schema: photoCollectionsSchema });

export const collections = {
  collections: photoCollection,
};
