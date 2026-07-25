"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MenuIcon, CloseIcon } from "@/components/icons";

const navLinks = [
  { href: "/adoptii", label: "Adopții" },
  { href: "/veterinari", label: "Veterinari" },
  { href: "/magazin", label: "Magazin" },
  { href: "/comunitate", label: "Comunitate" },
  { href: "/sos", label: "SOS", danger: true },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-dark">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Image src="/logo.png" alt="PawfectPair" width={40} height={20} className="rounded" priority />
          <span className="text-lg font-bold text-white">PawfectPair</span>
        </Link>

        <nav className="hidden md:flex md:items-center md:gap-6">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium hover:text-primary ${l.danger ? "text-red-400 font-bold" : "text-zinc-200"}`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Cont
          </Link>
        </nav>

        <button
          type="button"
          aria-label={open ? "Închide meniul" : "Deschide meniul"}
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center text-white md:hidden"
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-4 pb-4 md:hidden">
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
            href="/login"
            onClick={() => setOpen(false)}
            className="mt-2 flex min-h-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
          >
            Cont
          </Link>
        </nav>
      )}
    </header>
  );
}
