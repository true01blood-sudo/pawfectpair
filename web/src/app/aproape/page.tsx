import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";

const CATEGORY_META: Record<string, { emoji: string; label: string }> = {
  pet_shop: { emoji: "🛍️", label: "Magazine" },
  shelter: { emoji: "🏠", label: "Adăposturi & adopții" },
  trainer: { emoji: "🎓", label: "Traineri" },
};

export default async function AproapePage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; oras?: string }>;
}) {
  const { categorie, oras } = await searchParams;
  const supabase = await createClient();

  const { data: allListings } = await supabase
    .from("business_listings")
    .select("id, category, name, city, address, phone, website, description, verified")
    .eq("active", true)
    .order("verified", { ascending: false })
    .order("name", { ascending: true });

  const rows = allListings ?? [];
  const cities = Array.from(new Set(rows.map((r) => r.city).filter((c): c is string => Boolean(c)))).sort();

  const filtered = rows.filter((r) => (!categorie || r.category === categorie) && (!oras || r.city === oras));

  function hrefFor(next: { categorie?: string; oras?: string }) {
    const params = new URLSearchParams();
    const c = next.categorie !== undefined ? next.categorie : categorie;
    const o = next.oras !== undefined ? next.oras : oras;
    if (c) params.set("categorie", c);
    if (o) params.set("oras", o);
    const qs = params.toString();
    return qs ? `/aproape?${qs}` : "/aproape";
  }

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Aproape de tine</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Magazine pentru animale, adăposturi/centre de adopție și traineri — din OpenStreetMap și Asociația Chinologică Română.
          </p>

          {/* Filtru categorie */}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={hrefFor({ categorie: undefined })}
              className="flex min-h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors"
              style={!categorie
                ? { borderColor: "var(--primary)", background: "var(--primary)", color: "white" }
                : { borderColor: "var(--card-border)", color: "var(--muted)" }}
            >
              Toate
            </Link>
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <Link
                key={key}
                href={hrefFor({ categorie: key })}
                className="flex min-h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors"
                style={categorie === key
                  ? { borderColor: "var(--primary)", background: "var(--primary)", color: "white" }
                  : { borderColor: "var(--card-border)", color: "var(--muted)" }}
              >
                {meta.emoji} {meta.label}
              </Link>
            ))}
          </div>

          {/* Filtru oraș */}
          {cities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={hrefFor({ oras: undefined })}
                className="flex min-h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors"
                style={!oras
                  ? { borderColor: "var(--primary)", color: "var(--primary)" }
                  : { borderColor: "var(--card-border)", color: "var(--muted)" }}
              >
                Toate orașele
              </Link>
              {cities.slice(0, 20).map((c) => (
                <Link
                  key={c}
                  href={hrefFor({ oras: c })}
                  className="flex min-h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors"
                  style={oras === c
                    ? { borderColor: "var(--primary)", color: "var(--primary)" }
                    : { borderColor: "var(--card-border)", color: "var(--muted)" }}
                >
                  {c}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              {filtered.length} {filtered.length === 1 ? "rezultat" : "rezultate"}
            </h2>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed p-10 text-center" style={{ borderColor: "var(--card-border)" }}>
              <p className="text-3xl mb-2">🔍</p>
              <p className="font-semibold" style={{ color: "var(--foreground)" }}>Niciun rezultat pentru acest filtru</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {filtered.map((r) => {
                const meta = CATEGORY_META[r.category] ?? { emoji: "📍", label: r.category };
                return (
                  <div
                    key={r.id}
                    className="flex flex-col rounded-2xl border p-4 shadow-sm"
                    style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>{meta.emoji} {meta.label}</span>
                      {r.verified && (
                        <span className="text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ background: "var(--success-bg, #DCFCE7)", color: "var(--success, #16A34A)" }}>
                          Verificat
                        </span>
                      )}
                    </div>
                    <p className="mt-2 font-semibold" style={{ color: "var(--foreground)" }}>{r.name}</p>
                    {(r.address || r.city) && (
                      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                        {[r.address, r.city].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {r.description && (
                      <p className="mt-2 text-xs line-clamp-2" style={{ color: "var(--muted)" }}>{r.description}</p>
                    )}
                    <div className="mt-3 flex gap-3 text-xs font-medium">
                      {r.phone && (
                        <a href={`tel:${r.phone}`} className="hover:text-primary" style={{ color: "var(--primary)" }}>📞 {r.phone}</a>
                      )}
                      {r.website && (
                        <a href={r.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary" style={{ color: "var(--primary)" }}>🌐 Website</a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
