import path from "path";

export function getAsset(route: string, fileName: string) {
  const filename = path.parse(fileName);
  const name = filename.name;
  const ext = filename.ext;
  switch (ext) {
    case ".webp":
      return import(`../content/blog/${route}/assets/${name}.webp`);
    case ".jpg":
      return import(`../content/blog/${route}/assets/${name}.jpg`);
    case ".png":
      return import(`../content/blog/${route}/assets/${name}.png`);
    case ".jpeg":
      return import(`../content/blog/${route}/assets/${name}.jpeg`);
    default:
      return import(`../content/blog/${route}/assets/${name}.jpg`);
  }
}
