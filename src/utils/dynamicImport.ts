import path from "path";

export function getAsset(route: string, fileName: string) {
  const filename = path.parse(fileName);
  const name = filename.name;
  const ext = filename.ext;
  switch (ext) {
    case ".webp":
      return import(`../content/collections/${route}/assets/${name}.webp`);
    case ".jpg":
      return import(`../content/collections/${route}/assets/${name}.jpg`);
    case ".png":
      return import(`../content/collections/${route}/assets/${name}.png`);
    case ".jpeg":
      return import(`../content/collections/${route}/assets/${name}.jpeg`);
    default:
      return import(`../content/collections/${route}/assets/${name}.jpg`);
  }
}
