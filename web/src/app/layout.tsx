import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Baloo_2 } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baloo = Baloo_2({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const siteUrl = "https://pawfectpair.app";
const description =
  "PawfectPair — platforma completă pentru animalele de companie: adopții, programări veterinare, marketplace și o comunitate de stăpâni pasionați. Adoptă, ai grijă, conectează-te.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PawfectPair — Platforma pentru animalele tale de companie",
    template: "%s · PawfectPair",
  },
  description,
  keywords: [
    "adoptii caini",
    "adoptii pisici",
    "veterinar online",
    "programare veterinar",
    "magazin animale companie",
    "comunitate proprietari animale",
    "PawfectPair",
  ],
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: siteUrl,
    siteName: "PawfectPair",
    title: "PawfectPair — Platforma pentru animalele tale de companie",
    description,
    images: [{ url: "/logo.png", width: 1030, height: 530 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PawfectPair",
    description,
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${geistSans.variable} ${geistMono.variable} ${baloo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-dark">
        <Header />
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
