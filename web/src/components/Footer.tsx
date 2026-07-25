import Link from "next/link";

export default function Footer() {
  return (
    <footer className="hidden border-t bg-white md:block">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-zinc-500 sm:px-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
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
