import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/inicio"], disallow: ["/admin", "/asesor", "/api", "/ticket", "/tickets"] },
    ],
    sitemap: "https://www.brillara.gold/sitemap.xml",
  };
}
