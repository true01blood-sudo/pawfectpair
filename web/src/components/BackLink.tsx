import Link from "next/link";

export default function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm text-muted hover:text-primary"
    >
      ‹ {label}
    </Link>
  );
}
