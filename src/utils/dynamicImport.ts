import path from "path";

export function getFeaturedImage(fileName: string) {
  const filename = path.parse(fileName);
  const name = filename.name;
  const ext = filename.ext;
  switch (ext) {
    case ".webp":
      return import(`../assets/featured/${name}.webp`);
    case ".jpg":
      return import(`../assets/featured/${name}.jpg`);
    case ".png":
      return import(`../assets/featured/${name}.png`);
    case ".svg":
      return import(`../assets/featured/${name}.svg`);
    case ".gif":
      return import(`../assets/featured/${name}.gif`);
    case ".avif":
      return import(`../assets/featured/${name}.avif`);
    case ".jpeg":
      return import(`../assets/featured/${name}.jpeg`);
    default:
      return import(`../assets/featured/${name}.jpg`);
  }
}
