import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

import image from "@astrojs/image";

// https://astro.build/config
export default defineConfig({
  integrations: [mdx(), sitemap(), tailwind(), image()],
  site: "https://ojoanalogo.com",
  compressHTML: true,
});
