import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { placeOrder } from "../actions";
import BackLink from "@/components/BackLink";
import { ProductPlaceholder } from "@/components/PawPlaceholder";
import AddToCartButton from "@/components/AddToCartButton";

export default async function ProdusDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, profiles(full_name)")
    .eq("id", id)
    .single();
  if (!product) notFound();

  const seller = product.profiles as unknown as { full_name: string } | null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <BackLink href="/magazin" label="Magazin" />
      {product.photo_url ? (
        <div className="aspect-square w-full overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.photo_url} alt={product.name} className="h-full w-full object-cover" />
        </div>
      ) : (
        <ProductPlaceholder className="aspect-square w-full rounded-2xl" />
      )}

      <h1 className="mt-4 text-2xl font-bold">{product.name}</h1>
      <p className="text-lg font-semibold text-primary">
        {product.price_cents === 0
          ? "Preț de stabilit"
          : `${(product.price_cents / 100).toFixed(2)} ${product.currency}`}
      </p>
      {product.category && <p className="text-sm text-zinc-500">{product.category}</p>}
      <p className="mt-2 text-sm text-zinc-600">
        Vândut de <span className="font-medium">{seller?.full_name ?? "PawfectPair"}</span>
      </p>
      {product.delivery_info && (
        <p className="mt-1 text-sm text-zinc-600">🚚 {product.delivery_info}</p>
      )}
      {product.description && <p className="mt-3 text-sm text-zinc-700">{product.description}</p>}
      <p className="mt-2 text-xs text-zinc-400">Stoc: {product.stock}</p>

      {product.price_cents === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          Vânzătorul nu a stabilit încă un preț pentru acest produs.
        </p>
      ) : product.stock > 0 ? (
        user ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                price_cents: product.price_cents,
                currency: product.currency ?? "RON",
                photo_url: product.photo_url ?? null,
                stock: product.stock,
              }}
            />
            <form action={placeOrder.bind(null, id)}>
              <button className="min-h-11 rounded-full bg-primary px-6 font-semibold text-white hover:bg-primary-dark transition-colors">
                Comandă acum
              </button>
            </form>
          </div>
        ) : (
          <p className="mt-6 text-sm text-zinc-600">
            <a href="/login" className="text-primary underline">Autentifică-te</a> pentru a comanda.
          </p>
        )
      ) : (
        <p className="mt-6 text-sm text-red-500">Stoc epuizat</p>
      )}
    </main>
  );
}
