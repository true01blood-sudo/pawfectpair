import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BackLink from "@/components/BackLink";

const STATUS_LABEL: Record<string, string> = {
  pending: "În procesare",
  confirmed: "Confirmată",
  shipped: "Expediată",
  completed: "Finalizată",
  cancelled: "Anulată",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const PAYMENT_LABEL: Record<string, string> = {
  cod: "Ramburs",
  card: "Card",
  bank_transfer: "Transfer bancar",
};

export default async function ComenzilemMelePage({
  searchParams,
}: {
  searchParams: Promise<{ comanda?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { comanda } = await searchParams;

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(id, quantity, unit_price_cents, products(name))")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <BackLink href="/magazin" label="Magazin" />
      <h1 className="mb-6 text-2xl font-bold">Comenzile mele</h1>

      {comanda && (
        <div
          className="mb-6 rounded-2xl border p-4 text-center"
          style={{
            borderColor: "var(--primary)",
            background: "color-mix(in srgb, var(--primary) 10%, transparent)",
          }}
        >
          <p className="font-semibold text-primary">✓ Comandă plasată cu succes!</p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Vei fi contactat în curând de vânzător.
          </p>
        </div>
      )}

      {!orders?.length ? (
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <div className="text-4xl mb-3">📦</div>
          <p className="font-semibold mb-1">Nu ai comenzi încă</p>
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            Explorează magazinul și comandă primul tău produs.
          </p>
          <Link href="/magazin" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors">
            Mergi la magazin
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const statusKey = (order.status as string) ?? "pending";
            const colorClass = STATUS_COLOR[statusKey] ?? STATUS_COLOR.pending;
            const statusText = STATUS_LABEL[statusKey] ?? statusKey;

            return (
              <li
                key={order.id}
                className="rounded-2xl border p-4"
                style={{ borderColor: order.id === comanda ? "var(--primary)" : "var(--card-border)", background: "var(--card-bg)" }}
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {new Date(order.created_at).toLocaleDateString("ro-RO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-1 text-lg font-bold text-primary">
                      {(order.total_cents / 100).toFixed(2)} {order.currency}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colorClass}`}>
                    {statusText}
                  </span>
                </div>

                {order.order_items?.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t pt-3" style={{ borderColor: "var(--card-border)" }}>
                    {(order.order_items as Array<{ id: string; quantity: number; unit_price_cents: number; products: { name: string } | null }>).map((oi) => (
                      <li key={oi.id} className="flex justify-between text-sm" style={{ color: "var(--muted)" }}>
                        <span>{oi.quantity}× {oi.products?.name ?? "Produs"}</span>
                        <span>{((oi.unit_price_cents * oi.quantity) / 100).toFixed(2)} {order.currency}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-3 flex flex-wrap gap-3 text-xs" style={{ color: "var(--muted)" }}>
                  {order.payment_method && (
                    <span>💳 {PAYMENT_LABEL[order.payment_method as string] ?? order.payment_method}</span>
                  )}
                  {order.shipping_city && (
                    <span>
                      📍 {order.shipping_city}
                      {order.shipping_county ? `, ${order.shipping_county}` : ""}
                    </span>
                  )}
                  {order.shipping_name && (
                    <span>👤 {order.shipping_name}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
