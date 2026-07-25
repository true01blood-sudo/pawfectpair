import type { MetadataRoute } from "next";

const routes = ["", "/adoptii", "/veterinari", "/magazin", "/login", "/legal/termeni", "/legal/confidentialitate", "/legal/gdpr"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://pawfectpair.app";
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
  }));
}
