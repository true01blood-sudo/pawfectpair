import type { MetadataRoute } from "next";

const base = "https://pawfectpair.app";

type SitemapEntry = {
  url: string;
  lastModified?: Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
};

const staticRoutes: SitemapEntry[] = [
  { url: "",                          changeFrequency: "daily",   priority: 1.0 },
  { url: "/adoptii",                  changeFrequency: "daily",   priority: 0.9 },
  { url: "/veterinari",               changeFrequency: "weekly",  priority: 0.8 },
  { url: "/magazin",                  changeFrequency: "weekly",  priority: 0.8 },
  { url: "/comunitate",               changeFrequency: "daily",   priority: 0.7 },
  { url: "/forum",                    changeFrequency: "daily",   priority: 0.7 },
  { url: "/resq",                     changeFrequency: "weekly",  priority: 0.6 },
  { url: "/sos",                      changeFrequency: "monthly", priority: 0.6 },
  { url: "/login",                    changeFrequency: "monthly", priority: 0.5 },
  { url: "/legal/termeni",            changeFrequency: "yearly",  priority: 0.3 },
  { url: "/legal/confidentialitate",  changeFrequency: "yearly",  priority: 0.3 },
  { url: "/legal/gdpr",               changeFrequency: "yearly",  priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return staticRoutes.map(({ url, changeFrequency, priority }) => ({
    url: `${base}${url}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
