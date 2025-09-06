import type { Photo } from "../types/photos";

// Dynamically import all images from the featured folder
const featuredImages = import.meta.glob("../assets/featured/*.{png,jpg,jpeg,gif,webp}", {
  eager: true,
  import: "default",
}) as Record<string, any>;

export function getFeaturedPhotos(): Photo[] {
  return Object.entries(featuredImages).map(([path, image]) => {
    // Extract filename from path for alt text
    const filename = path.split("/").pop()?.replace(/\.(png|jpg|jpeg|gif|webp)$/i, "") || "";

    return {
      src: image,
      alt: `Featured photo: ${filename}`,
      href: "/", // You can customize this or make it dynamic if needed
    };
  });
}
