import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
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

  const userName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "";
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AppHeader userName={userName} avatarUrl={avatarUrl} isAdmin={true} />
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Desktop sidebar */}
        <aside
          className="hidden w-52 shrink-0 border-r md:flex md:flex-col overflow-y-auto"
          style={{ borderColor: "var(--card-border)", background: "var(--background)" }}
        >
          <div className="p-3 pt-4">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Admin Panel
            </p>
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-9 items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary"
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
        <div className="flex md:hidden absolute top-[60px] left-0 right-0 z-10 gap-1.5 overflow-x-auto border-b px-4 py-2"
          style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
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
        <div className="min-w-0 flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
