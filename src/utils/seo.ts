import site from '../data/site.json';

/** Browser / OG title: brand alone on home, `Page · Brand` elsewhere. */
export function formatTitle(pageTitle?: string): string {
  const brand = site.title.trim() || 'ojoanalogo';
  const page = pageTitle?.trim();
  if (!page || page === brand) return brand;
  return `${page} · ${brand}`;
}

export function absoluteUrl(pathOrUrl: string, base: URL | string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, base).href;
}
