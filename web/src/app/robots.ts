import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/profil", "/adoptii/adauga", "/magazin/produsele-mele", "/auth"],
      },
    ],
    sitemap: "https://pawfectpair.app/sitemap.xml",
  };
}
