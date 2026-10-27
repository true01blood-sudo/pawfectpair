"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, CloseIcon } from "@/components/icons";
import { useTheme } from "@/components/ThemeProvider";

const navLinks = [
  { href: "/adoptii", label: "Adopții" },
  { href: "/veterinari", label: "Veterinari" },
  { href: "/magazin", label: "Magazin" },
  { href: "/comunitate", label: "Comunitate" },
  { href: "/forum", label: "Forum" },
  { href: "/resq", label: "PetResQ" },
  { href: "/sos", label: "SOS", danger: true },
];

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function Header({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  if (pathname === "/login") return null;

  const accountHref = isLoggedIn ? "/profil" : "/login";
  const accountLabel = isLoggedIn ? "Profilul meu" : "Cont";

  return (
    <header className="sticky top-0 z-20" style={{ background: "var(--header-bg)" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Image src="/logo.png" alt="Pet Care Services" width={40} height={20} className="rounded" priority />
          <span className="text-lg font-bold" style={{ color: "var(--header-text)" }}>Pet Care Services</span>
        </Link>

        <nav className="hidden md:flex md:items-center md:gap-5">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium hover:text-primary ${l.danger ? "text-red-400 font-bold" : "text-zinc-300"}`}
            >
              {l.label}
            </Link>
          ))}

          <button
            type="button"
            aria-label={theme === "dark" ? "Activează modul luminos" : "Activează modul întunecat"}
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-zinc-300 hover:text-primary hover:border-primary/40 transition-colors"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          <Link
            href={accountHref}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            {accountLabel}
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            aria-label={theme === "dark" ? "Activează modul luminos" : "Activează modul întunecat"}
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-zinc-300"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            type="button"
            aria-label={open ? "Închide meniul" : "Deschide meniul"}
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center text-white"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-4 pb-4 md:hidden" style={{ background: "var(--header-bg)" }}>
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`flex min-h-11 items-center rounded-lg px-2 text-sm font-medium ${l.danger ? "text-red-400 font-bold" : "text-zinc-200"}`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={accountHref}
            onClick={() => setOpen(false)}
            className="mt-2 flex min-h-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
          >
            {accountLabel}
          </Link>
        </nav>
      )}
    </header>
  );
}
