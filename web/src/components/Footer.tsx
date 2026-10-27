"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

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
