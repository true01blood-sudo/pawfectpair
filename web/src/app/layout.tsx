import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

// Plus Jakarta Sans — fontul exact din design system PetCare
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = "https://pawfectpair.app";
const description =
  "PawfectPair — platforma completă pentru animalele de companie: adopții, programări veterinare, marketplace și o comunitate de stăpâni pasionați. Adoptă, ai grijă, conectează-te.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pet Care Services — Platforma pentru animalele tale de companie",
    template: "%s · Pet Care Services",
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
    siteName: "Pet Care Services",
    title: "Pet Care Services — Platforma pentru animalele tale de companie",
    description,
    images: [{ url: "/logo.png", width: 1030, height: 530 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pet Care Services",
    description,
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="ro"
      className={`${plusJakarta.variable} h-full antialiased`}
    >
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
