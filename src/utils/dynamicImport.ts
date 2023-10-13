import path from "path";

export function getAsset(route: string, fileName: string) {
  const filename = path.parse(fileName);
  const name = filename.name;
  const ext = filename.ext;
  switch (ext) {
    case ".webp":
      return import(`${route}/${name}.webp`);
    case ".jpg":
      return import(`${route}/${name}.jpg`);
    case ".png":
      return import(`${route}/${name}.png`);
    case ".svg":
      return import(`${route}/${name}.svg`);
    case ".gif":
      return import(`${route}/${name}.gif`);
    case ".avif":
      return import(`${route}/${name}.avif`);
    case ".jpeg":
      return import(`${route}/${name}.jpeg`);
    default:
      return import(`${route}/${name}.jpg`);
  }
}
