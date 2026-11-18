# ojoanalogo.com

Analog photography site. Astro + Cloudflare Pages + Sveltia CMS + R2.

## Commands

```bash
pnpm install
pnpm dev      # http://localhost:4321
pnpm build
pnpm check
```

CMS (dev): [http://localhost:4321/admin/index.html](http://localhost:4321/admin/index.html)  
CMS (prod): [https://ojoanalogo.com/admin/](https://ojoanalogo.com/admin/)

## How content works

There is no separate “photo database.”

| What | Where |
| --- | --- |
| **Photo files** | Cloudflare **R2** (`media.ojoanalogo.com`) |
| **Catalog** (which photos, album titles, landing order) | **Git** — JSON / Markdown in this repo |

When you save in the CMS:

1. Images upload straight to **R2** (browser → R2; not git).
2. Metadata commits to **GitHub** (`featured.json`, `site.json`, `src/content/gallery/.../index.md` with image URLs).
3. Cloudflare Pages rebuilds the site from that commit.

So: **R2 = binaries**, **git = the registry** (URLs + text).

## Edit content

1. Open `/admin/`, sign in (GitHub PAT or OAuth).
2. **Landing** → carousel photos, about portrait, OG image.
3. **Albums** → create/edit galleries and their photo lists.
4. Publish → wait for Pages deploy.

R2 credentials live in `public/admin/config.yml` (Access Key ID is public by design; the Secret is entered once in the CMS UI and stays in the browser).

## Stack notes

- Node `24.16` / pnpm `11` (see `.nvmrc`)
- Deploy: Cloudflare Pages (`pnpm build` → `dist`, `NODE_VERSION=24.16.0`)
- CI: `.github/workflows/ci.yml` (check + build only)

## Concept branch: Sienna Yards redesign

Minimal index-style portfolio (grey "frame" panels, all-caps Instrument Sans + Fragment Mono, Framer-like appear motion). Albums and the about portrait that have no CMS photos yet are previewed with muted Unsplash sample frames. Set `DEMO_PLACEHOLDERS = false` in `src/data/placeholders.ts` (or upload real photos) to remove them; CMS data is never touched.
