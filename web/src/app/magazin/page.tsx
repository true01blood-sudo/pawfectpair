import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { becomeSeller } from "./actions";
import { ProductPlaceholder } from "@/components/PawPlaceholder";

function formatPrice(cents: number, currency: string) {
  if (cents === 0) return "Preț de stabilit";
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export default async function MagazinPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_cents, currency, photo_url, category")
    .order("created_at", { ascending: false });

  return (
    <>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 pb-24 sm:px-6 lg:px-8 md:pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold sm:text-2xl">Magazin</h1>
          {profile?.role === "shop" ? (
            <Link
              href="/magazin/produsele-mele"
              className="flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white"
            >
              Produsele mele
            </Link>
          ) : user ? (
            <form action={becomeSeller}>
              <button className="flex min-h-11 items-center rounded-full border px-4 text-sm">
                Devino vânzător
              </button>
            </form>
          ) : null}
        </div>

        {products && products.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/magazin/${p.id}`}
                className="card-hover rounded-2xl border p-3 shadow-sm hover:border-primary"
              >
                {p.photo_url ? (
                  <div className="mb-2 aspect-square w-full overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <ProductPlaceholder className="mb-2 aspect-square w-full rounded-xl" />
                )}
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-sm font-semibold text-primary">
                  {formatPrice(p.price_cents, p.currency)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed p-8 text-center text-sm text-zinc-500">
            Niciun produs momentan.
          </p>
        )}
      </main>
      <BottomNav />
    </>
  );
}
