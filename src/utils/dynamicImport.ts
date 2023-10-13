import path from "path";

export function getAsset(route: string, fileName: string) {
  const filename = path.parse(fileName);
  const name = filename.name;
  const ext = filename.ext;
  switch (ext) {
    case ".webp":
      return import(`../assets/${route}/${name}.webp`);
    case ".jpg":
      return import(`../assets/${route}/${name}.jpg`);
    case ".png":
      return import(`../assets/${route}/${name}.png`);
    case ".jpeg":
      return import(`../assets/${route}/${name}.jpeg`);
    default:
      return import(`../assets/${route}/${name}.jpg`);
  }
}
