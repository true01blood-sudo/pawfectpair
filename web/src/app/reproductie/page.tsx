import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Reproducție & Breeding — PetCare",
  description: "Marketplace reproducție responsabilă: anunțuri, pedigree și parteneri de calitate.",
};

const GENDER_LABEL: Record<string, string> = {
  mascul: "Mascul ♂",
  femela: "Femelă ♀",
};

const GENDER_COLOR: Record<string, { bg: string; text: string }> = {
  mascul: { bg: "color-mix(in srgb, #3b82f6 12%, transparent)", text: "#2563eb" },
  femela: { bg: "color-mix(in srgb, #ec4899 12%, transparent)", text: "#db2777" },
};

const SPECIES_EMOJI: Record<string, string> = {
  caine: "🐶",
  pisica: "🐱",
  altele: "🦜",
};

export default async function ReproductiePage({
  searchParams,
}: {
  searchParams: Promise<{ specie?: string; rasa?: string }>;
}) {
  const { specie, rasa } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("breeding_listings")
    .select("id, title, description, species, breed, gender, age_years, health_tests, price_info, city, photo_url, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (specie) query = query.eq("species", specie);
  if (rasa) query = query.ilike("breed", `%${rasa}%`);

  const { data: listings } = await query;

  function buildHref(params: { specie?: string; rasa?: string }) {
    const sp = new URLSearchParams();
    if (params.specie) sp.set("specie", params.specie);
    if (params.rasa) sp.set("rasa", params.rasa);
    const qs = sp.toString();
    return qs ? `/reproductie?${qs}` : "/reproductie";
  }

  return (
    <>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              Reproducție & Breeding
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Parteneri de reproducție responsabilă, cu pedigree și teste de sănătate.
            </p>
          </div>
          {user && (
            <Link
              href="/reproductie/adauga"
              className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              + Adaugă anunț
            </Link>
          )}
        </div>

        {/* Species filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: "", label: "Toate", emoji: "🐾" },
            { id: "caine", label: "Câini", emoji: "🐶" },
            { id: "pisica", label: "Pisici", emoji: "🐱" },
            { id: "altele", label: "Altele", emoji: "🦜" },
          ].map((s) => (
            <Link
              key={s.id}
              href={buildHref({ specie: s.id || undefined, rasa })}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
              style={{
                borderColor: (specie ?? "") === s.id ? "var(--primary)" : "var(--card-border)",
                background: (specie ?? "") === s.id ? "color-mix(in srgb, var(--primary) 10%, transparent)" : "var(--card-bg)",
                color: (specie ?? "") === s.id ? "var(--primary)" : "var(--foreground)",
              }}
            >
              {s.emoji} {s.label}
            </Link>
          ))}
        </div>

        {/* Info banner */}
        <div
          className="mb-6 rounded-2xl border p-4 flex items-start gap-3"
          style={{
            background: "color-mix(in srgb, var(--primary) 6%, transparent)",
            borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
          }}
        >
          <span className="text-2xl shrink-0">🏆</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Reproducție responsabilă
            </p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--muted)" }}>
              Toți partenerii din această secțiune ar trebui să furnizeze teste de sănătate și pedigree. Verifică întotdeauna documentele înainte de a continua.
            </p>
          </div>
        </div>

        {/* Listings grid */}
        {listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {listings.map((listing) => {
              const genderColor = listing.gender ? GENDER_COLOR[listing.gender] : null;

              return (
                <div
                  key={listing.id}
                  className="rounded-2xl border overflow-hidden transition-shadow hover:shadow-md"
                  style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                >
                  {/* Photo or placeholder */}
                  <div
                    className="relative h-40 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fde8d0 100%)" }}
                  >
                    {listing.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.photo_url} alt={listing.title} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-6xl">{SPECIES_EMOJI[listing.species] ?? "🐾"}</span>
                    )}
                    {listing.gender && genderColor && (
                      <span
                        className="absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                        style={{ background: genderColor.bg, color: genderColor.text }}
                      >
                        {GENDER_LABEL[listing.gender]}
                      </span>
                    )}
                    {listing.health_tests && listing.health_tests.length > 0 && (
                      <span
                        className="absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                        style={{ background: "color-mix(in srgb, #16a34a 15%, transparent)", color: "#16a34a" }}
                      >
                        ✓ Testat
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                      {listing.title}
                    </h2>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs" style={{ color: "var(--muted)" }}>
                      {listing.breed && <span>🏷️ {listing.breed}</span>}
                      {listing.age_years && <span>· {listing.age_years} ani</span>}
                      {listing.city && <span>· 📍 {listing.city}</span>}
                    </div>

                    {listing.description && (
                      <p className="mt-2 text-xs leading-relaxed line-clamp-2" style={{ color: "var(--muted)" }}>
                        {listing.description}
                      </p>
                    )}

                    {listing.health_tests && listing.health_tests.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(listing.health_tests as string[]).map((test) => (
                          <span
                            key={test}
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              background: "color-mix(in srgb, #16a34a 10%, transparent)",
                              color: "#16a34a",
                            }}
                          >
                            ✓ {test}
                          </span>
                        ))}
                      </div>
                    )}

                    {listing.price_info && (
                      <p className="mt-2 text-xs font-semibold" style={{ color: "var(--primary)" }}>
                        {listing.price_info}
                      </p>
                    )}

                    <Link
                      href={user ? `/reproductie/${listing.id}` : "/login"}
                      className="mt-3 flex items-center justify-center rounded-full bg-primary py-2 text-xs font-semibold text-white hover:bg-primary-dark transition-colors"
                    >
                      Contactează proprietarul →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="rounded-2xl border-2 border-dashed p-12 text-center"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
          >
            <div className="text-5xl mb-4">🌸</div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>
              Niciun anunț momentan
            </h2>
            <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
              Aplică migrarea 0042 în Supabase Dashboard și adaugă anunțuri.
            </p>
            {user && (
              <Link
                href="/reproductie/adauga"
                className="inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                + Adaugă primul anunț
              </Link>
            )}
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
