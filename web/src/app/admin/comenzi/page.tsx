import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Breadcrumb from "@/components/Breadcrumb";

export default async function AdminComenziPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const { data: orders } = await supabase
    .from("orders")
    .select("id, total_cents, currency, status, created_at, profiles(full_name)")
    .order("created_at", { ascending: false });

  const { data: items } = await supabase
    .from("order_items")
    .select("order_id, quantity, unit_price_cents, products(name, base_price_cents, seller_id, profiles(full_name))");

  const totalRevenueCents = orders?.reduce((sum, o) => sum + o.total_cents, 0) ?? 0;

  let totalMarkupCents = 0;
  items?.forEach((it) => {
    const product = it.products as unknown as { base_price_cents: number | null } | null;
    if (product?.base_price_cents != null) {
      totalMarkupCents += (it.unit_price_cents - product.base_price_cents) * it.quantity;
    }
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ href: "/", label: "Acasă" }, { href: "/profil", label: "Profil" }, { href: "/admin", label: "Panou Admin" }, { label: "Comenzi" }]} />
      <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--foreground)" }}>Comenzi (admin)</h1>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <p className="text-2xl font-bold text-primary">{orders?.length ?? 0}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Total comenzi</p>
        </div>
        <div className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <p className="text-2xl font-bold text-primary">{(totalRevenueCents / 100).toFixed(2)} RON</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Valoare totală</p>
        </div>
        <div className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <p className="text-2xl font-bold text-primary">{(totalMarkupCents / 100).toFixed(2)} RON</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Markup încasat</p>
        </div>
      </div>

      <h2 className="mt-8 mb-3 font-semibold" style={{ color: "var(--foreground)" }}>Istoric comenzi</h2>
      {orders && orders.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {orders.map((o) => {
            const buyer = o.profiles as unknown as { full_name: string } | null;
            const orderItems = items?.filter((it) => it.order_id === o.id) ?? [];
            return (
              <li
                key={o.id}
                className="card-hover rounded-xl border p-3 text-sm shadow-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium" style={{ color: "var(--foreground)" }}>{buyer?.full_name ?? "Utilizator"}</p>
                  <p className="font-semibold text-primary">{(o.total_cents / 100).toFixed(2)} {o.currency}</p>
                </div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {new Date(o.created_at).toLocaleString("ro-RO")} · {o.status}
                </p>
                {orderItems.map((it, i) => {
                  const product = it.products as unknown as { name: string; profiles: { full_name: string } | null } | null;
                  return (
                    <p key={i} className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                      {product?.name} × {it.quantity} — vânzător: {product?.profiles?.full_name ?? "PawfectPair"}
                    </p>
                  );
                })}
              </li>
            );
          })}
        </ul>
      ) : (
        <p
          className="rounded-2xl border border-dashed p-8 text-center text-sm"
          style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
        >
          Nicio comandă încă.
        </p>
      )}
    </main>
  );
}
