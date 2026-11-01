import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import AppShell from "@/components/AppShell";
import { StarsDisplay } from "@/components/Stars";

export const metadata: Metadata = {
  title: "Pensiuni & Cazare Animale — PetCare",
  description: "Pensiuni, pet-sitteri și centre de cazare pentru câini și pisici, cu recenzii reale.",
};

const PRICE_UNIT_LABELS: Record<string, string> = {
  day: "/zi", night: "/noapte", hour: "/oră", visit: "/vizită", walk: "/plimbare",
};

export default async function PensiuniPage({
  searchParams,
}: {
  searchParams: Promise<{ oras?: string }>;
}) {
  const { oras } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("petday_listings")
    .select("id, title, city, price_from, price_unit, photo_url, verified, services")
    .eq("active", true)
    .order("verified", { ascending: false })
    .order("created_at", { ascending: false });

  if (oras) query = query.ilike("city", `%${oras}%`);

  const { data: listings } = await query;

  const { data: reviews } = await supabase.from("petday_reviews").select("listing_id, rating");
  const ratingByListing = new Map<string, number[]>();
  reviews?.forEach((r) => {
    const arr = ratingByListing.get(r.listing_id) ?? [];
    arr.push(r.rating);
    ratingByListing.set(r.listing_id, arr);
  });

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Pensiuni & Cazare</h1>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Unități de cazare și pet-sitteri verificați, cu recenzii reale.
              </p>
            </div>
            <Link
              href={user ? "/pensiuni/adauga" : "/login"}
              className="inline-flex shrink-0 items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              + Adaugă pensiunea ta
            </Link>
          </div>

          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {listings.map((l) => {
                const ratings = ratingByListing.get(l.id);
                const avg = ratings && ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
                return (
                  <Link
                    key={l.id}
                    href={`/pensiuni/${l.id}`}
                    className="rounded-2xl border p-4 transition-shadow hover:shadow-md"
                    style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                  >
                    <div className="flex gap-3">
                      {l.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.photo_url} alt={l.title} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <div className="h-16 w-16 shrink-0 rounded-xl flex items-center justify-center text-2xl" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)" }}>
                          🏠
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <p className="font-bold text-sm truncate" style={{ color: "var(--foreground)" }}>{l.title}</p>
                          {l.verified && <span title="Verificat">✅</span>}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>📍 {l.city}</p>
                        {ratings && ratings.length > 0 ? (
                          <div className="mt-1"><StarsDisplay rating={avg} count={ratings.length} /></div>
                        ) : (
                          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Fără recenzii</p>
                        )}
                      </div>
                    </div>
                    <p className="mt-3 text-sm font-bold" style={{ color: "var(--primary)" }}>
                      {l.price_from ? `De la ${l.price_from} RON${PRICE_UNIT_LABELS[l.price_unit] ?? ""}` : "Preț la cerere"}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div
              className="rounded-2xl border-2 border-dashed p-10 text-center"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
            >
              <div className="text-4xl mb-3">🏠</div>
              <p className="font-semibold" style={{ color: "var(--foreground)" }}>Nicio pensiune momentan</p>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                Fii primul care adaugă o unitate de cazare.
              </p>
            </div>
          )}
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
