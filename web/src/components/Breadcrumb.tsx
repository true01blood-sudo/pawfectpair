import Link from "next/link";

interface BreadcrumbItem {
  href?: string;
  label: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm" style={{ color: "var(--muted)" }}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="opacity-40">›</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-primary transition-colors">
              {item.label}
            </Link>
          ) : (
            <span style={{ color: "var(--foreground)" }} className="font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
