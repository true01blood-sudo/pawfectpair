"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const APP_ROUTES = [
  "/", "/animale", "/ingrijire", "/cercuri", "/explorare",
  "/sanatate", "/asigurare", "/gps", "/reproductie", "/antrenament",
  "/programari", "/planificator", "/statistici", "/educatie",
  "/profil", "/suport", "/forum", "/comunitate", "/sos", "/resq",
  "/veterinari", "/magazin", "/adoptii", "/notificari", "/admin", "/cont",
];

export default function Footer({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  if (isLoggedIn && APP_ROUTES.some((r) => r === pathname || pathname.startsWith(r + "/"))) return null;

  return (
    <footer className="hidden border-t md:block" style={{ background: "var(--header-bg)", borderColor: "var(--card-border)" }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:px-6 sm:flex-row sm:items-center sm:justify-between lg:px-8" style={{ color: "var(--muted)" }}>
        <p>© {new Date().getFullYear()} PawfectPair. Cu drag pentru fiecare lăbuță.</p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/legal/termeni" className="hover:text-primary">Termeni și condiții</Link>
          <Link href="/legal/confidentialitate" className="hover:text-primary">Confidențialitate</Link>
          <Link href="/legal/gdpr" className="hover:text-primary">GDPR</Link>
        </nav>
      </div>
    </footer>
  );
}
