import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { becomeSeller } from "./actions";
import AppShell from "@/components/AppShell";
import MagazinClient from "./MagazinClient";

export const metadata: Metadata = {
  title: "Magazin — PetCare",
  description: "Produse premium pentru animale de companie.",
};

export default async function MagazinPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  // Fetch user's first pet for "For Luna" filter
  const { data: pet } = user
    ? await supabase
        .from("pets")
        .select("name, species")
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_cents, currency, photo_url, category, delivery_info, species_tags, profiles(full_name)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const mappedProducts = (products ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    price_cents: p.price_cents as number,
    currency: (p.currency ?? "RON") as string,
    photo_url: (p.photo_url ?? null) as string | null,
    category: (p.category ?? null) as string | null,
    delivery_info: (p.delivery_info ?? null) as string | null,
    species_tags: (p.species_tags ?? null) as string[] | null,
    seller_name: ((p.profiles as unknown as { full_name: string } | null)?.full_name ?? null) as string | null,
  }));

  return (
    <>
      <AppShell>
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
          {/* Seller controls */}
          {user && (
            <div className="flex justify-end gap-2 px-4 pt-4">
              {profile?.role === "shop" ? (
                <Link
                  href="/magazin/produsele-mele"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  Produsele mele
                </Link>
              ) : (
                <form action={becomeSeller}>
                  <button className="rounded-full border px-4 py-2 text-sm font-medium" style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}>
                    Devino vânzător
                  </button>
                </form>
              )}
            </div>
          )}

          <MagazinClient
            products={mappedProducts}
            petName={pet?.name ?? null}
            petSpecies={pet?.species ?? null}
            isLoggedIn={!!user}
          />
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
