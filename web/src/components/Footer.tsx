"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const APP_ROUTES = [
  "/", "/animale", "/ingrijire", "/cercuri", "/explorare",
  "/sanatate", "/asigurare", "/gps", "/reproductie", "/antrenament",
  "/programari", "/planificator", "/statistici", "/educatie",
  "/profil", "/suport", "/forum", "/comunitate", "/sos", "/resq",
  "/veterinari", "/magazin", "/adoptii", "/notificari", "/admin",
  "/cont", "/contact", "/legal", "/clinic",
];

export default function Footer({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  // AppShell renders its own compact footer on these routes when logged in
  if (isLoggedIn && APP_ROUTES.some((r) => r === pathname || pathname.startsWith(r + "/"))) {
    return null;
  }

  return (
    <footer
      className="border-t mt-auto"
      style={{ background: "var(--header-bg)", borderColor: "var(--card-border)" }}
    >
      <div
        className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs sm:px-6 sm:flex-row sm:items-center sm:justify-between lg:px-8"
        style={{ color: "var(--muted)" }}
      >
        <p>© {new Date().getFullYear()} PawfectPair. Cu drag pentru fiecare lăbuță.</p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/legal/termeni" className="hover:text-primary transition-colors">Termeni și condiții</Link>
          <Link href="/legal/confidentialitate" className="hover:text-primary transition-colors">Confidențialitate</Link>
          <Link href="/legal/gdpr" className="hover:text-primary transition-colors">GDPR</Link>
          <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
