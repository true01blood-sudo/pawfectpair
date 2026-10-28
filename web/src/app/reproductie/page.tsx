import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Reproducție & Breeding — PetCare",
  description: "Marketplace reproducție responsabilă: parteneri verificați, pedigree și teste de sănătate.",
};

const GENDER_LABEL: Record<string, string> = {
  mascul: "Mascul ♂",
  femela: "Femelă ♀",
};

const GENDER_COLOR: Record<string, { bg: string; text: string }> = {
  mascul: { bg: "color-mix(in srgb, #3b82f6 12%, transparent)", text: "#2563eb" },
  femela: { bg: "color-mix(in srgb, #ec4899 12%, transparent)", text: "#db2777" },
};

const SPECIES_TABS = [
  { id: "", label: "Toate", emoji: "🐾" },
  { id: "caine", label: "Câini", emoji: "🐶" },
  { id: "pisica", label: "Pisici", emoji: "🐱" },
  { id: "altele", label: "Altele", emoji: "🦜" },
];

export default async function ReproductiePage({
  searchParams,
}: {
  searchParams: Promise<{ specie?: string; rasa?: string; gen?: string }>;
}) {
  const { specie, rasa, gen } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("breeding_listings")
    .select("id, title, description, species, breed, gender, age_years, health_tests, price_info, city, photo_url, pedigree_info, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (specie) query = query.eq("species", specie);
  if (rasa) query = query.ilike("breed", `%${rasa}%`);
  if (gen) query = query.eq("gender", gen);

  const { data: listings } = await query;

  function buildHref(params: { specie?: string; rasa?: string; gen?: string }) {
    const sp = new URLSearchParams();
    if (params.specie) sp.set("specie", params.specie);
    if (params.rasa) sp.set("rasa", params.rasa);
    if (params.gen) sp.set("gen", params.gen);
    const qs = sp.toString();
    return qs ? `/reproductie?${qs}` : "/reproductie";
  }

  const speciesEmoji = (s: string) =>
    s === "caine" ? "🐶" : s === "pisica" ? "🐱" : "🐾";

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">

          {/* Header */}
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                Caută partener de reproducție
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Parteneri verificați cu teste de sănătate și pedigree.
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

          {/* Species tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
            {SPECIES_TABS.map((s) => (
              <Link
                key={s.id}
                href={buildHref({ specie: s.id || undefined, rasa, gen })}
                className="flex-shrink-0 flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
                style={{
                  background: (specie ?? "") === s.id ? "var(--primary)" : "var(--card-bg)",
                  borderColor: (specie ?? "") === s.id ? "var(--primary)" : "var(--card-border)",
                  color: (specie ?? "") === s.id ? "#fff" : "var(--foreground)",
                }}
              >
                <span>{s.emoji}</span>
                {s.label}
              </Link>
            ))}
          </div>

          {/* Filters row */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {/* Breed search */}
            <form action="/reproductie" method="GET" className="flex gap-2 flex-1 min-w-48">
              {specie && <input type="hidden" name="specie" value={specie} />}
              {gen && <input type="hidden" name="gen" value={gen} />}
              <input
                type="text"
                name="rasa"
                defaultValue={rasa ?? ""}
                placeholder="Rasă..."
                className="flex-1 rounded-full border px-4 py-2 text-sm outline-none focus:border-primary transition-colors"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
              />
              <button
                type="submit"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                Caută
              </button>
            </form>

            {/* Gender filter */}
            <div className="flex gap-1">
              {[
                { id: "", label: "Ambele" },
                { id: "mascul", label: "Mascul ♂" },
                { id: "femela", label: "Femelă ♀" },
              ].map((g) => (
                <Link
                  key={g.id}
                  href={buildHref({ specie, rasa, gen: g.id || undefined })}
                  className="flex-shrink-0 rounded-full border px-3 py-2 text-xs font-medium transition-colors"
                  style={{
                    background: (gen ?? "") === g.id ? "var(--primary)" : "var(--card-bg)",
                    borderColor: (gen ?? "") === g.id ? "var(--primary)" : "var(--card-border)",
                    color: (gen ?? "") === g.id ? "#fff" : "var(--foreground)",
                  }}
                >
                  {g.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Responsible breeding banner */}
          <div
            className="mb-5 rounded-2xl border p-4 flex items-start gap-3"
            style={{
              background: "color-mix(in srgb, var(--primary) 6%, transparent)",
              borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
            }}
          >
            <span className="text-xl shrink-0">🏆</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Reproducție responsabilă
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                Solicită întotdeauna teste de sănătate și pedigree înainte de a continua. PetCare verifică crescătorii la cerere.
              </p>
            </div>
          </div>

          {/* Results count */}
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
            {listings?.length ?? 0} parteneri disponibili
          </p>

          {/* Listings grid */}
          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {listings.map((listing) => {
                const genderColor = listing.gender ? GENDER_COLOR[listing.gender] : null;
                const healthTests = (listing.health_tests as string[] | null) ?? [];
                const hasPedigree = !!listing.pedigree_info;

                return (
                  <Link
                    key={listing.id}
                    href={`/reproductie/${listing.id}`}
                    className="rounded-2xl border overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 block"
                    style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                  >
                    {/* Photo */}
                    <div
                      className="relative h-48 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fde8d0 100%)" }}
                    >
                      {listing.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={listing.photo_url} alt={listing.title} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-7xl">{speciesEmoji(listing.species)}</span>
                      )}

                      {/* Badges overlay */}
                      <div className="absolute top-2 left-2 flex gap-1.5">
                        {listing.gender && genderColor && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: genderColor.bg, color: genderColor.text, backdropFilter: "blur(4px)" }}
                          >
                            {GENDER_LABEL[listing.gender]}
                          </span>
                        )}
                        {hasPedigree && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: "rgba(255,255,255,0.9)", color: "#7c3aed" }}
                          >
                            📜 Pedigree
                          </span>
                        )}
                      </div>

                      {healthTests.length > 0 && (
                        <span
                          className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: "rgba(255,255,255,0.9)", color: "#16a34a" }}
                        >
                          ✓ {healthTests.length} teste
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <h2 className="font-bold text-sm mb-1" style={{ color: "var(--foreground)" }}>
                        {listing.title}
                      </h2>

                      <div className="flex flex-wrap gap-2 text-xs mb-3" style={{ color: "var(--muted)" }}>
                        {listing.breed && <span>🏷️ {listing.breed}</span>}
                        {listing.age_years && <span>· {listing.age_years} ani</span>}
                        {listing.city && <span>· 📍 {listing.city}</span>}
                      </div>

                      {/* Health tests */}
                      {healthTests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {healthTests.slice(0, 3).map((test) => (
                            <span
                              key={test}
                              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{
                                background: "color-mix(in srgb, #16a34a 10%, transparent)",
                                color: "#16a34a",
                                border: "1px solid color-mix(in srgb, #16a34a 20%, transparent)",
                              }}
                            >
                              ✓ {test}
                            </span>
                          ))}
                          {healthTests.length > 3 && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{ background: "var(--surface)", color: "var(--muted)" }}
                            >
                              +{healthTests.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        {listing.price_info ? (
                          <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                            {listing.price_info}
                          </span>
                        ) : (
                          <span className="text-sm" style={{ color: "var(--muted)" }}>Preț la cerere</span>
                        )}
                        <span
                          className="rounded-full px-3 py-1.5 text-xs font-bold text-white"
                          style={{ background: "var(--primary)" }}
                        >
                          Detalii →
                        </span>
                      </div>
                    </div>
                  </Link>
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
                Niciun anunț{specie ? ` pentru ${SPECIES_TABS.find(s => s.id === specie)?.label}` : ""} momentan
              </h2>
              <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
                Fii primul care adaugă un anunț de reproducție responsabilă.
              </p>
              {user && (
                <Link
                  href="/reproductie/adauga"
                  className="inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
                >
                  + Adaugă primul anunț
                </Link>
              )}
              {!user && (
                <Link
                  href="/login"
                  className="inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
                >
                  Autentifică-te pentru a adăuga
                </Link>
              )}
            </div>
          )}
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
