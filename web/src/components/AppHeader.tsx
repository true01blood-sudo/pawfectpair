"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";
import { LanguageSwitcher } from "@/components/Header";
import InstallAppButton from "@/components/InstallAppButton";
import { signOut } from "@/app/profil/actions";

type Props = {
  userName?: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
  isVet?: boolean;
  clinicName?: string;
  unreadNotifications?: number;
  pendingConversations?: number;
};

const CITIES = ["București", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Brașov"];

export default function AppHeader({ userName, avatarUrl, isAdmin, isVet, clinicName, unreadNotifications = 0, pendingConversations = 0 }: Props) {
  const { theme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [clinicMenuOpen, setClinicMenuOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [city, setCity] = useState("Locația mea");
  const menuRef = useRef<HTMLDivElement>(null);
  const clinicMenuRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const initials = userName ? userName.charAt(0).toUpperCase() : "U";
  const displayName = userName?.split(" ")[0] ?? "Cont";

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)city=([^;]+)/);
    if (match?.[1]) setCity(decodeURIComponent(match[1]));
  }, []);

  function chooseCity(c: string) {
    document.cookie = `city=${encodeURIComponent(c)}; path=/; max-age=31536000; SameSite=Lax`;
    setCity(c);
    setLocationOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (clinicMenuRef.current && !clinicMenuRef.current.contains(e.target as Node)) {
        setClinicMenuOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationOpen(false);
      }
    }
    if (menuOpen || clinicMenuOpen || locationOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, clinicMenuOpen, locationOpen]);

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

      {/* Clinic context badge */}
      {clinicName && (
        <div className="relative hidden md:block" ref={clinicMenuRef}>
          <button
            type="button"
            onClick={() => setClinicMenuOpen((v) => !v)}
            className="flex items-center gap-2 border-l pl-3 py-1 rounded-r-lg transition-colors hover:bg-primary/5"
            style={{ borderColor: "var(--card-border)" }}
          >
            <div className="text-left">
              <p className="text-sm font-semibold leading-tight" style={{ color: "var(--foreground)" }}>{clinicName}</p>
              <p className="text-[10px] leading-tight" style={{ color: "var(--muted)" }}>Professional workspace</p>
            </div>
            <svg
              width="12" height="12" viewBox="0 0 10 10" fill="currentColor"
              style={{ color: "var(--muted)", transform: clinicMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
            >
              <path d="M5 7 1 3h8z"/>
            </svg>
          </button>
          {clinicMenuOpen && (
            <div
              className="absolute left-0 top-12 z-50 rounded-2xl border py-1.5 shadow-xl"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", minWidth: 200 }}
            >
              <Link
                href="/clinic"
                onClick={() => setClinicMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:text-primary"
                style={{ color: "var(--foreground)" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                Overview clinică
              </Link>
              <div style={{ borderTop: "1px solid var(--card-border)", margin: "4px 0" }} />
              <Link
                href="/"
                onClick={() => setClinicMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:text-primary"
                style={{ color: "var(--foreground)" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Ieși din workspace
              </Link>
            </div>
          )}
        </div>
      )}

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
        <div className="relative hidden lg:block" ref={locationRef}>
          <button
            type="button"
            onClick={() => setLocationOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary/5"
            style={{ color: "var(--foreground)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {city}
            <svg
              width="9" height="9" viewBox="0 0 10 10" fill="currentColor"
              style={{ transform: locationOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
            >
              <path d="M5 7 1 3h8z"/>
            </svg>
          </button>
          {locationOpen && (
            <div
              className="absolute left-0 top-11 z-50 rounded-2xl border py-1.5 shadow-xl"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", minWidth: 180 }}
            >
              {CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => chooseCity(c)}
                  className="flex w-full items-center px-4 py-2 text-sm transition-colors hover:text-primary"
                  style={{ color: c === city ? "var(--primary)" : "var(--foreground)", fontWeight: c === city ? 600 : 400 }}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <LanguageSwitcher />

        <InstallAppButton />

        {/* Messages */}
        <Link
          href="/comunitate/mesaje"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:border-primary/40 hover:text-primary"
          style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {pendingConversations > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
              {pendingConversations > 9 ? "9+" : pendingConversations}
            </span>
          )}
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
          {unreadNotifications > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </Link>

        {/* Avatar dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full border pl-1 pr-2.5 py-1 transition-colors hover:border-primary/40"
            style={{ borderColor: menuOpen ? "var(--primary)" : "var(--card-border)" }}
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
            <svg
              width="9" height="9" viewBox="0 0 10 10" fill="currentColor"
              style={{
                color: "var(--muted)",
                transform: menuOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.15s",
              }}
            >
              <path d="M5 7 1 3h8z"/>
            </svg>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-11 z-50 rounded-2xl border py-1.5 shadow-xl"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", minWidth: 180 }}
            >
              <Link
                href="/profil"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:text-primary"
                style={{ color: "var(--foreground)" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Profilul meu
              </Link>
              <Link
                href="/setari"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:text-primary"
                style={{ color: "var(--foreground)" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Setări
              </Link>
              {isVet && (
                <Link
                  href="/clinic"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:text-primary"
                  style={{ color: "var(--foreground)" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  Clinic workspace
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:text-primary"
                  style={{ color: "var(--foreground)" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  Admin
                </Link>
              )}
              <div style={{ borderTop: "1px solid var(--card-border)", margin: "4px 0" }} />
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:text-red-500"
                  style={{ color: "var(--foreground)" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Deconectare
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
