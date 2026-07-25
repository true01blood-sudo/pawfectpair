import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProduct, deleteProduct } from "./actions";

export default async function ProduseleMelePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_cents, currency, stock, category")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-xl font-bold sm:text-2xl">Produsele mele</h1>

      <ul className="mt-4 flex flex-col gap-2">
        {products?.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-zinc-500">
                {(p.price_cents / 100).toFixed(2)} {p.currency} · stoc: {p.stock}
              </p>
            </div>
            <form action={deleteProduct.bind(null, p.id)}>
              <button className="min-h-11 rounded-full border px-4 text-xs">Șterge</button>
            </form>
          </li>
        ))}
        {(!products || products.length === 0) && (
          <p className="text-sm text-zinc-500">Nu ai adăugat încă niciun produs.</p>
        )}
      </ul>

      <h2 className="mt-8 mb-3 font-semibold">Adaugă produs</h2>
      <form action={createProduct} className="flex flex-col gap-4">
        <input name="name" placeholder="Nume produs" required className="min-h-11 rounded-xl border px-4" />
        <div className="grid grid-cols-3 gap-4">
          <input name="price" type="number" min="0" step="0.01" placeholder="Preț (RON)" required className="min-h-11 rounded-xl border px-4" />
          <input name="stock" type="number" min="0" placeholder="Cantitate" className="min-h-11 rounded-xl border px-4" />
          <input name="category" placeholder="Categorie" className="min-h-11 rounded-xl border px-4" />
        </div>
        <input name="photo_url" placeholder="URL poză produs" className="min-h-11 rounded-xl border px-4" />
        <textarea name="description" placeholder="Descriere" rows={3} className="rounded-xl border p-4" />
        <button className="min-h-11 self-start rounded-full bg-primary px-5 font-semibold text-white">
          Publică produsul
        </button>
      </form>
    </main>
  );
}
