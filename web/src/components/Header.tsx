"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MenuIcon, CloseIcon } from "@/components/icons";
import { useTheme } from "@/components/ThemeProvider";
import { useCart } from "@/components/CartContext";
import type { Locale } from "@/lib/i18n";

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  );
}

const LOCALES: { code: Locale; label: string }[] = [
  { code: "ro", label: "RO" },
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "de", label: "DE" },
  { code: "it", label: "IT" },
];

function LanguageSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function getCurrent(): Locale {
    if (typeof document === "undefined") return "ro";
    const match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
    return (match?.[1] as Locale) ?? "ro";
  }

  function setLocale(code: Locale) {
    document.cookie = `locale=${code}; path=/; max-age=31536000; SameSite=Lax`;
    setOpen(false);
    router.refresh();
  }

  const current = getCurrent();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-1 rounded-full border px-3 text-xs font-bold transition-colors hover:border-primary/40 hover:text-primary"
        style={{ borderColor: "var(--card-border)", color: "var(--header-text)" }}
      >
        {current.toUpperCase()}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 7 1 3h8z"/></svg>
      </button>
      {open && (
        <div
          className="absolute right-0 top-11 z-50 rounded-xl border py-1 shadow-lg"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", minWidth: 72 }}
        >
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLocale(l.code)}
              className="flex w-full items-center justify-center py-2 text-xs font-semibold transition-colors hover:text-primary"
              style={{ color: l.code === current ? "var(--primary)" : "var(--header-text)" }}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const { count } = useCart();

  if (pathname === "/login") return null;

  const accountHref = isLoggedIn ? "/profil" : "/login";
  const accountLabel = isLoggedIn ? "Profilul meu" : "Cont";

  return (
    <header className="sticky top-0 z-20" style={{ background: "var(--header-bg)" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Image
            src={theme === "dark" ? "/logo.png" : "/logo-white.png"}
            alt="Pet Care Services"
            width={280}
            height={90}
            className="object-contain h-14 sm:h-16 md:h-20"
            style={{ width: "auto" }}
            priority
          />
        </Link>

        <nav className="hidden md:flex md:items-center md:gap-5">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium hover:text-primary transition-colors ${l.danger ? "text-red-500 font-bold" : ""}`}
              style={!l.danger ? { color: "var(--header-text)", opacity: 0.75 } : undefined}
            >
              {l.label}
            </Link>
          ))}

          <LanguageSwitcher />

          <button
            type="button"
            aria-label={theme === "dark" ? "Activează modul luminos" : "Activează modul întunecat"}
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-full border hover:text-primary hover:border-primary/40 transition-colors"
            style={{ borderColor: "var(--card-border)", color: "var(--header-text)" }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          <Link
            href="/magazin/cos"
            aria-label="Coș de cumpărături"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border hover:text-primary hover:border-primary/40 transition-colors"
            style={{ borderColor: "var(--card-border)", color: "var(--header-text)" }}
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {count > 99 ? "99" : count}
              </span>
            )}
          </Link>
          <Link
            href={accountHref}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            {accountLabel}
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/magazin/cos"
            aria-label="Coș de cumpărături"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
            style={{ borderColor: "var(--card-border)", color: "var(--header-text)" }}
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {count > 99 ? "99" : count}
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label={theme === "dark" ? "Activează modul luminos" : "Activează modul întunecat"}
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
            style={{ borderColor: "var(--card-border)", color: "var(--header-text)" }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            type="button"
            aria-label={open ? "Închide meniul" : "Deschide meniul"}
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center"
            style={{ color: "var(--header-text)" }}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t px-4 pb-4 md:hidden" style={{ background: "var(--header-bg)", borderColor: "var(--card-border)" }}>
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`flex min-h-11 items-center rounded-lg px-2 text-sm font-medium ${l.danger ? "text-red-500 font-bold" : ""}`}
              style={!l.danger ? { color: "var(--header-text)" } : undefined}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-2">
            {LOCALES.map((l) => {
              function setLocale(code: Locale) {
                document.cookie = `locale=${code}; path=/; max-age=31536000; SameSite=Lax`;
                setOpen(false);
                window.location.reload();
              }
              const current = typeof document !== "undefined"
                ? ((document.cookie.match(/(?:^|;\s*)locale=([^;]+)/)?.[1] as Locale) ?? "ro")
                : "ro";
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLocale(l.code)}
                  className="flex-1 rounded-lg py-2 text-xs font-bold transition-colors border"
                  style={{
                    background: l.code === current ? "var(--primary)" : "transparent",
                    color: l.code === current ? "#fff" : "var(--header-text)",
                    borderColor: l.code === current ? "var(--primary)" : "var(--card-border)",
                  }}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
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
