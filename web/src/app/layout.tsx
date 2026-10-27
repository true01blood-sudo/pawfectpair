import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = "https://pawfectpair.app";
const siteName = "Pet Care Services";
const titleDefault = "Pet Care Services — Platforma nr. 1 pentru animale de companie";
const description =
  "Pet Care Services (PawfectPair) — platforma completă pentru animalele tale de companie. Adopții, programări veterinare, GPS & siguranță, comunitate, marketplace și mai mult. Gratuit, în română.";

const ogImage = {
  url: `${siteUrl}/og-image.png`,
  width: 1200,
  height: 630,
  alt: "Pet Care Services — platforma pentru animale de companie",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  // ── Titlu & descriere ──────────────────────────────────────────
  title: {
    default: titleDefault,
    template: `%s · ${siteName}`,
  },
  description,

  // ── Keywords (long-tail RO) ────────────────────────────────────
  keywords: [
    "adopții câini",
    "adopții pisici",
    "adopții animale companie Romania",
    "veterinar online Romania",
    "programare veterinar",
    "magazin animale companie",
    "GPS pisica câine",
    "comunitate proprietari animale",
    "fișă medicală animale",
    "pedigree câini",
    "reproducere animale",
    "pașaport animal companie",
    "îngrijire câine",
    "îngrijire pisică",
    "PawfectPair",
    "pet care Romania",
    "animale de companie aplicație",
  ],

  // ── Canonical & alternates ─────────────────────────────────────
  alternates: {
    canonical: siteUrl,
    languages: {
      "ro": `${siteUrl}`,
      "en": `${siteUrl}?lang=en`,
      "fr": `${siteUrl}?lang=fr`,
      "de": `${siteUrl}?lang=de`,
    },
  },

  // ── Open Graph ─────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "ro_RO",
    alternateLocale: ["en_US", "fr_FR", "de_DE"],
    url: siteUrl,
    siteName,
    title: titleDefault,
    description,
    images: [ogImage],
  },

  // ── Twitter / X Card ──────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    site: "@PawfectPair",
    creator: "@PawfectPair",
    title: titleDefault,
    description,
    images: [ogImage.url],
  },

  // ── Robots ────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── App links ─────────────────────────────────────────────────
  appLinks: {
    android: {
      package: "app.pawfectpair.mobile",
      app_name: siteName,
    },
  },

  // ── Verificări webmaster ───────────────────────────────────────
  verification: {
    google: "google-site-verification-placeholder",
  },

  // ── App manifest & icons ───────────────────────────────────────
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },

  // ── Categoria & clasificare ────────────────────────────────────
  category: "pets",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffaf4" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

// JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      description,
      inLanguage: ["ro", "en", "fr", "de"],
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/adoptii?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: siteName,
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
        width: 512,
        height: 512,
      },
      sameAs: [
        "https://play.google.com/store/apps/details?id=app.pawfectpair.mobile",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        availableLanguage: ["Romanian", "English", "French", "German"],
      },
    },
    {
      "@type": "MobileApplication",
      "@id": `${siteUrl}/#app`,
      name: siteName,
      operatingSystem: "Android",
      applicationCategory: "LifestyleApplication",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "RON",
      },
      url: "https://play.google.com/store/apps/details?id=app.pawfectpair.mobile",
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="ro" className={`${plusJakarta.variable} h-full antialiased`}>
      <head>
        {/* Geo tags */}
        <meta name="geo.region" content="RO" />
        <meta name="geo.country" content="Romania" />
        <meta name="language" content="Romanian" />
        <meta name="revisit-after" content="7 days" />
        <meta name="rating" content="general" />
        {/* JSON-LD */}
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: "var(--background)", color: "var(--foreground)", fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
        <ThemeProvider>
          <Header isLoggedIn={!!user} />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
