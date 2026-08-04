import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://www.brillara.gold/", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://www.brillara.gold/inicio", lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  ];
}
