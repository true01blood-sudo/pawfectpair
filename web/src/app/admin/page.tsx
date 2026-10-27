import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const [
    { count: usersCount },
    { count: listingsCount },
    { count: ordersCount },
    { count: resqCount },
    { count: postsCount },
    { count: productsCount },
    { data: recentOrders },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("adoption_listings").select("*", { count: "exact", head: true }).eq("status", "available"),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("resq_cases").select("*", { count: "exact", head: true }).neq("status", "closed"),
    supabase.from("forum_posts").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("id, total_cents, currency, status, created_at, profiles(full_name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("profiles").select("id, full_name, role, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const stats = [
    { label: "Utilizatori înregistrați", value: usersCount ?? 0, icon: "👥", href: "/admin/utilizatori", accent: "#3b82f6" },
    { label: "Anunțuri adopție active", value: listingsCount ?? 0, icon: "🐾", href: "/admin/continut", accent: "#10b981" },
    { label: "Comenzi totale", value: ordersCount ?? 0, icon: "🛒", href: "/admin/comenzi", accent: "#f59e0b" },
    { label: "Cazuri ResQ deschise", value: resqCount ?? 0, icon: "🚨", href: "/admin/continut", accent: "#ef4444" },
    { label: "Postări forum", value: postsCount ?? 0, icon: "💬", href: "/admin/continut", accent: "#8b5cf6" },
    { label: "Produse în magazin", value: productsCount ?? 0, icon: "📦", href: "/admin/produse", accent: "#ec4899" },
  ];

  const roleLabels: Record<string, string> = {
    user: "Utilizator", vet: "Veterinar", shop: "Magazin", shelter: "Centru", admin: "Admin",
  };

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold sm:text-2xl">Dashboard Admin</h1>
        <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>
          {new Date().toLocaleDateString("ro-RO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="card-hover rounded-2xl border p-4 shadow-sm transition-colors hover:border-primary/30"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-3xl font-bold" style={{ color: s.accent }}>{s.value}</p>
              <span className="text-xl">{s.icon}</span>
            </div>
            <p className="mt-1.5 text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Comenzi recente</h2>
            <Link href="/admin/comenzi" className="text-xs text-primary hover:underline">Vezi toate →</Link>
          </div>
          {recentOrders && recentOrders.length > 0 ? (
            <ul className="flex flex-col divide-y" style={{ borderColor: "var(--card-border)" }}>
              {recentOrders.map((o) => {
                const buyer = o.profiles as unknown as { full_name: string } | null;
                return (
                  <li key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-medium">{buyer?.full_name ?? "Client"}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {new Date(o.created_at).toLocaleDateString("ro-RO")} · {o.status}
                      </p>
                    </div>
                    <span className="font-semibold text-primary">{(o.total_cents / 100).toFixed(2)} {o.currency}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Nicio comandă încă.</p>
          )}
        </div>

        <div className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Utilizatori noi</h2>
            <Link href="/admin/utilizatori" className="text-xs text-primary hover:underline">Vezi toți →</Link>
          </div>
          {recentUsers && recentUsers.length > 0 ? (
            <ul className="flex flex-col divide-y" style={{ borderColor: "var(--card-border)" }}>
              {recentUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-2.5 text-sm">
                  <p className="font-medium">{u.full_name || "(fără nume)"}</p>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: "var(--surface)", color: "var(--muted)" }}
                  >
                    {roleLabels[u.role] ?? u.role}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Niciun utilizator.</p>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6">
        <h2 className="mb-3 font-semibold">Acțiuni rapide</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/admin/utilizatori", label: "👥 Gestionare utilizatori" },
            { href: "/admin/continut", label: "🛡️ Moderare conținut" },
            { href: "/admin/produse", label: "📦 Gestionare produse" },
            { href: "/admin/comenzi", label: "🛒 Vizualizare comenzi" },
            { href: "/admin/setari", label: "⚙️ Setări platformă" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex min-h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary"
              style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
