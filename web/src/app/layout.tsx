import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PawfectPair",
  description: "Platforma completă pentru animalele de companie",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-dark">
        <header className="bg-dark">
          <div className="mx-auto flex max-w-5xl items-center px-4 py-2">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="PawfectPair" width={40} height={20} className="rounded" />
              <span className="text-white font-bold text-lg">PawfectPair</span>
            </Link>
          </div>
        </header>
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
