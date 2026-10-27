import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/profil",
          "/animale",
          "/adoptii/adauga",
          "/magazin/produsele-mele",
          "/auth",
          "/api/",
          "/_next/",
        ],
      },
      // Permite explicit crawlere mari pentru imagini
      {
        userAgent: ["Googlebot-Image", "Bingbot"],
        allow: "/",
      },
    ],
    sitemap: "https://pawfectpair.app/sitemap.xml",
    host: "https://pawfectpair.app",
  };
}
