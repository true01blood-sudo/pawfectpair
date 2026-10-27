import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ReactNode } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/utilizatori", label: "Utilizatori", icon: "👥" },
  { href: "/admin/continut", label: "Moderare", icon: "🛡️" },
  { href: "/admin/produse", label: "Produse", icon: "📦" },
  { href: "/admin/comenzi", label: "Comenzi", icon: "🛒" },
  { href: "/admin/setari", label: "Setări", icon: "⚙️" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-52 shrink-0 border-r md:flex md:flex-col" style={{ borderColor: "var(--card-border)" }}>
        <div className="sticky top-16 p-3">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            Admin Panel
          </p>
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary"
                style={{ color: "var(--foreground)" }}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div
        className="flex gap-1.5 overflow-x-auto border-b px-4 py-2 md:hidden"
        style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap"
            style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </div>

      {/* Content area */}
      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}
