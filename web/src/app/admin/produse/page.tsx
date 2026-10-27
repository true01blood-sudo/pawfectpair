import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Breadcrumb from "@/components/Breadcrumb";
import ImageUpload from "@/components/ImageUpload";
import { addProduct, updateProduct, deleteProduct } from "./actions";

export default async function AdminProdusePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const { data: products } = await supabase
    .from("products")
    .select("id, name, category, price_cents, stock, photo_url, external_url, source, profiles(full_name)")
    .order("created_at", { ascending: false });

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ href: "/admin", label: "Admin" }, { label: "Produse" }]} />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Gestionare produse</h1>
        <span className="text-sm" style={{ color: "var(--muted)" }}>{products?.length ?? 0} produse</span>
      </div>

      {/* Add product form */}
      <section className="mb-6 rounded-2xl border p-4 sm:p-6" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
        <h2 className="mb-4 font-semibold">Adaugă produs nou</h2>
        <form action={addProduct} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input name="name" placeholder="Nume produs *" required
            className="min-h-11 rounded-xl border px-3 text-sm sm:col-span-2"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
          <select name="category"
            className="min-h-11 rounded-xl border px-3 text-sm"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}>
            <option value="general">General</option>
            <option value="dog-food">Hrană câini</option>
            <option value="cat-food">Hrană pisici</option>
            <option value="dog-treats">Recompense</option>
            <option value="accessories">Accesorii</option>
            <option value="health">Sănătate</option>
            <option value="toys">Jucării</option>
          </select>
          <input name="price" type="number" step="0.01" min="0" placeholder="Preț (RON)"
            className="min-h-11 rounded-xl border px-3 text-sm"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
          <input name="stock" type="number" min="0" placeholder="Stoc"
            className="min-h-11 rounded-xl border px-3 text-sm"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
          <input name="external_url" type="url" placeholder="Link extern (opțional)"
            className="min-h-11 rounded-xl border px-3 text-sm"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
          <textarea name="description" placeholder="Descriere (opțional)" rows={2}
            className="rounded-xl border p-3 text-sm sm:col-span-2"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
          <div className="sm:col-span-2">
            <ImageUpload name="photo_url" label="Poză produs" />
          </div>
          <button className="min-h-11 self-start rounded-full bg-primary px-6 text-sm font-semibold text-white sm:col-span-2">
            Adaugă produs
          </button>
        </form>
      </section>

      {/* Products list */}
      {products && products.length > 0 ? (
        <div className="flex flex-col gap-3">
          {products.map((p) => {
            const seller = p.profiles as unknown as { full_name: string } | null;
            return (
              <div key={p.id} className="rounded-2xl border p-4 shadow-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
                <div className="flex gap-4">
                  {p.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo_url} alt={p.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-2xl"
                      style={{ background: "var(--surface)" }}>📦</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          {p.category} · stoc: {p.stock} · vânzător: {seller?.full_name ?? "Admin"}
                          {p.source && ` · sursă: ${p.source}`}
                        </p>
                      </div>
                      <p className="font-bold text-primary">{(p.price_cents / 100).toFixed(2)} RON</p>
                    </div>
                    {p.external_url && (
                      <a href={p.external_url} target="_blank" rel="noopener noreferrer"
                        className="mt-1 block truncate text-xs text-primary hover:underline">
                        {p.external_url}
                      </a>
                    )}
                  </div>
                </div>

                {/* Edit form (inline) */}
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-primary hover:underline">Editează ›</summary>
                  <form action={updateProduct.bind(null, p.id)} className="mt-3 grid grid-cols-2 gap-2">
                    <input name="name" defaultValue={p.name} required placeholder="Nume"
                      className="col-span-2 min-h-10 rounded-xl border px-3 text-sm"
                      style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
                    <input name="price" type="number" step="0.01" min="0"
                      defaultValue={(p.price_cents / 100).toFixed(2)} placeholder="Preț RON"
                      className="min-h-10 rounded-xl border px-3 text-sm"
                      style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
                    <input name="stock" type="number" min="0" defaultValue={p.stock} placeholder="Stoc"
                      className="min-h-10 rounded-xl border px-3 text-sm"
                      style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
                    <input name="category" defaultValue={p.category} placeholder="Categorie"
                      className="min-h-10 rounded-xl border px-3 text-sm"
                      style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
                    <input name="external_url" type="url" defaultValue={p.external_url ?? ""} placeholder="Link extern"
                      className="min-h-10 rounded-xl border px-3 text-sm"
                      style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
                    <input name="photo_url" defaultValue={p.photo_url ?? ""} placeholder="URL poză"
                      className="col-span-2 min-h-10 rounded-xl border px-3 text-sm"
                      style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
                    <textarea name="description" rows={2} placeholder="Descriere"
                      className="col-span-2 rounded-xl border p-2 text-sm"
                      style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
                    <button className="min-h-10 rounded-full bg-primary px-4 text-sm font-semibold text-white">
                      Salvează
                    </button>
                  </form>
                </details>

                <form action={deleteProduct.bind(null, p.id)} className="mt-2">
                  <button className="text-xs text-red-500 hover:underline">Șterge produs</button>
                </form>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--muted)" }}>Niciun produs în baza de date.</p>
      )}
    </main>
  );
}
