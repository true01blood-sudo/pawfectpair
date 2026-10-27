"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SEGMENT_LABELS: Record<string, string> = {
  sanatate: "Sănătate",
  asigurare: "Asigurare",
  explorare: "Explorare",
  animale: "Animalele mele",
  ingrijire: "Îngrijire",
  antrenament: "Antrenament",
  programari: "Programări",
  cercuri: "Cercuri",
  gps: "GPS",
  reproductie: "Reproducție",
  planificator: "Planificator",
  magazin: "Magazin",
  adauga: "Adaugă",
  pasaport: "Pașaport",
  profil: "Profil",
  admin: "Admin",
  utilizatori: "Utilizatori",
  comenzi: "Comenzi",
  produse: "Produse",
  continut: "Conținut",
  setari: "Setări",
};

interface BreadcrumbItem {
  href?: string;
  label: string;
}

export default function Breadcrumb({ items }: { items?: BreadcrumbItem[] }) {
  const pathname = usePathname();

  // If items prop provided (legacy admin pages), use those directly
  let crumbs: BreadcrumbItem[];
  if (items && items.length > 0) {
    crumbs = items;
  } else {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length <= 1) return null;
    crumbs = [{ label: "Acasă", href: "/" }];
    let running = "";
    for (const seg of segments) {
      running += "/" + seg;
      const label = SEGMENT_LABELS[seg] ?? (seg.length > 8 ? `${seg.slice(0, 8)}…` : seg);
      crumbs.push({ label, href: running });
    }
  }

  return (
    <nav className="flex items-center gap-1 text-xs mb-4 flex-wrap" aria-label="breadcrumb">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href ?? crumb.label} className="flex items-center gap-1">
            {i > 0 && (
              <span style={{ color: "var(--muted)" }}>/</span>
            )}
            {isLast || !crumb.href ? (
              <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:underline transition-colors"
                style={{ color: "var(--primary)" }}
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
