import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { createProduct, deleteProduct, updatePrice, updateStockAndDelivery } from "./actions";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import ImageUpload from "@/components/ImageUpload";

export default async function ProduseleMelePage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/login");

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_cents, currency, stock, category, delivery_info")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const inputStyle = {
    borderColor: "var(--card-border)",
    color: "var(--foreground)",
    background: "var(--card-bg)",
  };

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--foreground)" }}>Produsele mele</h1>

          <ul className="mt-4 flex flex-col gap-3">
            {products?.map((p) => (
              <li
                key={p.id}
                className="card-hover rounded-xl border p-3 text-sm shadow-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: "var(--foreground)" }}>{p.name}</p>
                    <p style={{ color: "var(--muted)" }}>
                      {p.price_cents === 0 ? "Preț de stabilit" : `${(p.price_cents / 100).toFixed(2)} ${p.currency}`}
                      {" · stoc: "}{p.stock}
                      {p.delivery_info ? ` · ${p.delivery_info}` : ""}
                    </p>
                  </div>
                  <form action={deleteProduct.bind(null, p.id)}>
                    <button
                      className="min-h-11 rounded-full border px-4 text-xs transition-colors hover:border-red-300 hover:text-red-500"
                      style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                    >
                      Șterge
                    </button>
                  </form>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <form action={updatePrice.bind(null, p.id)} className="flex items-center gap-1">
                    <input name="price" type="number" min="0" step="0.01" placeholder="Preț" className="min-h-11 w-20 rounded-lg border px-2 text-xs" style={inputStyle} />
                    <button className="min-h-11 rounded-full border px-3 text-xs transition-colors hover:border-primary/40" style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}>Preț</button>
                  </form>
                  <form action={updateStockAndDelivery.bind(null, p.id)} className="flex items-center gap-1">
                    <input name="stock" type="number" min="0" placeholder="Stoc" defaultValue={p.stock} className="min-h-11 w-16 rounded-lg border px-2 text-xs" style={inputStyle} />
                    <input name="delivery_info" placeholder="Livrare (ex: 24h)" defaultValue={p.delivery_info ?? ""} className="min-h-11 w-32 rounded-lg border px-2 text-xs" style={inputStyle} />
                    <button className="min-h-11 rounded-full border px-3 text-xs transition-colors hover:border-primary/40" style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}>Salvează</button>
                  </form>
                </div>
              </li>
            ))}
            {(!products || products.length === 0) && (
              <p
                className="rounded-2xl border border-dashed p-8 text-center text-sm"
                style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
              >
                Nu ai adăugat încă niciun produs.
              </p>
            )}
          </ul>

          <h2 className="mt-8 mb-3 font-semibold" style={{ color: "var(--foreground)" }}>Adaugă produs</h2>
          <form action={createProduct} className="flex flex-col gap-4">
            <input name="name" placeholder="Nume produs" required className="min-h-11 rounded-xl border px-4" style={inputStyle} />
            <div className="grid grid-cols-3 gap-4">
              <input name="price" type="number" min="0" step="0.01" placeholder="Preț (RON)" required className="min-h-11 rounded-xl border px-4" style={inputStyle} />
              <input name="stock" type="number" min="0" placeholder="Cantitate" className="min-h-11 rounded-xl border px-4" style={inputStyle} />
              <input name="category" placeholder="Categorie" className="min-h-11 rounded-xl border px-4" style={inputStyle} />
            </div>
            <input name="delivery_info" placeholder="Livrare (ex: 24h, 2-3 zile lucrătoare)" className="min-h-11 rounded-xl border px-4" style={inputStyle} />
            <ImageUpload name="photo_url" label="Poză produs (opțional)" />
            <textarea name="description" placeholder="Descriere" rows={3} className="rounded-xl border p-4" style={inputStyle} />
            <button className="min-h-11 self-start rounded-full bg-primary px-5 font-semibold text-white transition-opacity hover:opacity-90">
              Publică produsul
            </button>
          </form>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
