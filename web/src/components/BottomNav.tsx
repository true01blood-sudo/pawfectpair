"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function ExploreIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={active ? "white" : "currentColor"}/>
    </svg>
  );
}

function CareIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function CirclesIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function PetsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 50 50" fill="currentColor" stroke="none" opacity={active ? 1 : 0.65}>
      <ellipse cx="10" cy="16" rx="4" ry="6"/>
      <ellipse cx="40" cy="16" rx="4" ry="6"/>
      <ellipse cx="22" cy="8" rx="5" ry="7"/>
      <ellipse cx="34" cy="8" rx="5" ry="7"/>
      <path d="M25 20 C14 20 8 28 10 38 C12 46 18 48 25 48 C32 48 38 46 40 38 C42 28 36 20 25 20Z"/>
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/", label: "Acasă", Icon: HomeIcon, exact: true },
  { href: "/explorare", label: "Explorare", Icon: ExploreIcon, exact: false },
  { href: "/ingrijire", label: "Îngrijire", Icon: CareIcon, exact: false },
  { href: "/cercuri", label: "Cercuri", Icon: CirclesIcon, exact: false },
  { href: "/animale", label: "Animale", Icon: PetsIcon, exact: false },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-20 border-t md:hidden"
      style={{
        background: "var(--header-bg)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="flex items-stretch justify-around px-1" style={{ height: 60 }}>
        {NAV_ITEMS.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 min-h-11 text-[10px] font-medium transition-colors"
              style={{ color: active ? "var(--primary)" : "var(--muted)" }}
            >
              <Icon active={active} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
