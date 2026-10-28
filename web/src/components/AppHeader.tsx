"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";

type Props = {
  userName?: string;
  avatarUrl?: string | null;
};

export default function AppHeader({ userName, avatarUrl }: Props) {
  const { theme } = useTheme();
  const initials = userName ? userName.charAt(0).toUpperCase() : "U";
  const displayName = userName?.split(" ")[0] ?? "Cont";

  return (
    <header
      className="shrink-0 flex items-center gap-3 px-4 border-b"
      style={{
        background: "var(--background)",
        borderColor: "var(--card-border)",
        height: 60,
        zIndex: 20,
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center shrink-0 mr-2">
        <Image
          src={theme === "dark" ? "/logo.png" : "/logo-white.png"}
          alt="PetCare"
          width={140}
          height={44}
          style={{ width: "auto", height: 34 }}
          priority
        />
      </Link>

      {/* Search */}
      <div className="flex-1 hidden md:block max-w-lg">
        <div
          className="flex items-center gap-2 rounded-full px-4 py-2"
          style={{ background: "var(--surface)", border: "1px solid var(--card-border)" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Caută persoane, animale, servicii sau produse..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--foreground)" }}
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Location */}
        <button
          type="button"
          className="hidden lg:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary/5"
          style={{ color: "var(--foreground)" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          Locația mea
          <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><path d="M5 7 1 3h8z"/></svg>
        </button>

        {/* Messages */}
        <Link
          href="/comunitate/mesaje"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:border-primary/40 hover:text-primary"
          style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">2</span>
        </Link>

        {/* Notifications */}
        <Link
          href="/notificari"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:border-primary/40 hover:text-primary"
          style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">3</span>
        </Link>

        {/* Avatar + name */}
        <Link
          href="/profil"
          className="flex items-center gap-1.5 rounded-full border pl-1 pr-2.5 py-1 transition-colors hover:border-primary/40"
          style={{ borderColor: "var(--card-border)" }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "var(--primary)" }}
            >
              {initials}
            </div>
          )}
          <span className="text-sm font-medium hidden lg:block" style={{ color: "var(--foreground)" }}>
            {displayName}
          </span>
          <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor" style={{ color: "var(--muted)" }}>
            <path d="M5 7 1 3h8z"/>
          </svg>
        </Link>
      </div>
    </header>
  );
}
