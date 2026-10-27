"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function ExploreIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={active ? "white" : "currentColor"}/>
    </svg>
  );
}

function CareIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function CirclesIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function PetsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 50 50" fill="currentColor" stroke="none" opacity={active ? 1 : 0.7}>
      <ellipse cx="10" cy="16" rx="4" ry="6"/>
      <ellipse cx="40" cy="16" rx="4" ry="6"/>
      <ellipse cx="22" cy="8" rx="5" ry="7"/>
      <ellipse cx="34" cy="8" rx="5" ry="7"/>
      <path d="M25 20 C14 20 8 28 10 38 C12 46 18 48 25 48 C32 48 38 46 40 38 C42 28 36 20 25 20Z"/>
    </svg>
  );
}

function LearnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

function BreedingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
    </svg>
  );
}

function AdoptionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/", label: "Acasă", Icon: HomeIcon },
  { href: "/explorare", label: "Explorare", Icon: ExploreIcon },
  { href: "/ingrijire", label: "Îngrijire", Icon: CareIcon },
  { href: "/cercuri", label: "Cercuri", Icon: CirclesIcon },
  { href: "/animale", label: "Animalele mele", Icon: PetsIcon },
];

const SHORTCUTS = [
  { href: "/sanatate", label: "Sănătate", Icon: LearnIcon },
  { href: "/magazin", label: "Magazin", Icon: ShopIcon },
  { href: "/reproductie", label: "Reproducție", Icon: BreedingIcon },
  { href: "/asigurare", label: "Asigurare", Icon: AdoptionIcon },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { theme } = useTheme();

  return (
    <aside
      className="hidden md:flex flex-col w-56 shrink-0 h-full overflow-y-auto border-r"
      style={{ background: "var(--background)", borderColor: "var(--card-border)" }}
    >
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 shrink-0">
        <Link href="/">
          <Image
            src={theme === "dark" ? "/logo.png" : "/logo-white.png"}
            alt="PetCare Services"
            width={160}
            height={52}
            style={{ width: "auto", height: 38 }}
            priority
          />
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col px-2 gap-0.5 shrink-0">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
              style={{
                background: active
                  ? "color-mix(in srgb, var(--primary) 12%, transparent)"
                  : "transparent",
                color: active ? "var(--primary)" : "var(--foreground)",
                fontWeight: active ? 600 : 500,
              }}
            >
              <span className="shrink-0">
                <item.Icon active={active} />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Shortcuts */}
      <div className="mt-5 px-4 shrink-0">
        <p
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          Scurtături
        </p>
      </div>
      <nav className="mt-1 flex flex-col px-2 gap-0.5 shrink-0">
        {SHORTCUTS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:text-primary"
            style={{ color: "var(--muted)" }}
          >
            <span className="shrink-0">
              <item.Icon />
            </span>
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* SOS */}
      <div className="mt-4 px-3 shrink-0">
        <Link
          href="/sos"
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors"
          style={{
            background: "color-mix(in srgb, #ef4444 10%, transparent)",
            color: "#ef4444",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm1-4h-2V7h2v6z"/>
          </svg>
          SOS Emergency
        </Link>
      </div>

      {/* Adoption banner */}
      <div
        className="mt-auto mx-3 mb-4 rounded-2xl overflow-hidden shrink-0"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
        }}
      >
        <div className="relative aspect-[4/3] overflow-hidden flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fde8d0 100%)" }}>
          <span className="text-5xl select-none">🐕</span>
          <span className="absolute top-2 right-2 text-xs font-bold rounded-full px-2 py-0.5"
            style={{ background: "var(--primary)", color: "white" }}>
            Adopții
          </span>
        </div>
        <div className="p-3">
          <p className="text-xs font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
            Un viitor mai bun pentru fiecare animal.
          </p>
          <Link
            href="/adoptii"
            className="mt-2 flex items-center gap-1 text-xs font-bold hover:underline"
            style={{ color: "var(--primary)" }}
          >
            Susține adopțiile →
          </Link>
        </div>
      </div>
    </aside>
  );
}
