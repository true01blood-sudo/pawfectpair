import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";

const CATEGORY_META: Record<string, { emoji: string; label: string }> = {
  pet_shop: { emoji: "🛍️", label: "Magazine" },
  shelter: { emoji: "🏠", label: "Adăposturi & adopții" },
  trainer: { emoji: "🎓", label: "Traineri" },
  transport: { emoji: "🚚", label: "Transport animale" },
};

const PAGE_SIZE = 60;

export default async function AproapePage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; oras?: string; pagina?: string }>;
}) {
  const { categorie, oras } = await searchParams;
  const page = Math.max(1, parseInt((await searchParams).pagina ?? "1", 10) || 1);
  const supabase = await createClient();

  // business_listings are peste 1300 de randuri active (transport singur
  // >1000) — peste limita implicita PostgREST (max-rows, de obicei 1000),
  // care taie orice raspuns la 1000 indiferent de .limit() cerut de client.
  // Fara paginare reala (range() + count exact), "Toate" / "Transport"
  // trunchiau silentios rezultatele fara nicio indicatie.
  let q = supabase
    .from("business_listings")
    .select("id, category, name, city, address, phone, website, description, verified", { count: "exact" })
    .eq("active", true)
    .order("verified", { ascending: false })
    .order("name", { ascending: true })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (categorie) q = q.eq("category", categorie);
  if (oras) q = q.eq("city", oras);

  const { data: filtered, count } = await q;
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Lista de orase pentru filtru — interogare separata, usoara (o singura
  // coloana), filtrata doar pe categorie (nu si pe oras — altfel ai pierde
  // restul optiunilor din chip-uri odata ce alegi unul).
  let cityQ = supabase.from("business_listings").select("city").eq("active", true).not("city", "is", null);
  if (categorie) cityQ = cityQ.eq("category", categorie);
  const { data: cityRows } = await cityQ;
  const cities = Array.from(new Set((cityRows ?? []).map((r) => r.city).filter((c): c is string => Boolean(c)))).sort();

  function hrefFor(next: { categorie?: string; oras?: string; pagina?: number }) {
    const params = new URLSearchParams();
    const c = next.categorie !== undefined ? next.categorie : categorie;
    const o = next.oras !== undefined ? next.oras : oras;
    const p = next.pagina !== undefined ? next.pagina : (next.categorie !== undefined || next.oras !== undefined ? 1 : page);
    if (c) params.set("categorie", c);
    if (o) params.set("oras", o);
    if (p > 1) params.set("pagina", String(p));
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
              {totalCount} {totalCount === 1 ? "rezultat" : "rezultate"}
              {totalPages > 1 && ` · pagina ${page} din ${totalPages}`}
            </h2>
          </div>

          {(filtered ?? []).length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed p-10 text-center" style={{ borderColor: "var(--card-border)" }}>
              <p className="text-3xl mb-2">🔍</p>
              <p className="font-semibold" style={{ color: "var(--foreground)" }}>Niciun rezultat pentru acest filtru</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {(filtered ?? []).map((r) => {
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

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              {page > 1 && (
                <Link
                  href={hrefFor({ pagina: page - 1 })}
                  className="flex min-h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors"
                  style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                >
                  ← Pagina anterioară
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={hrefFor({ pagina: page + 1 })}
                  className="flex min-h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors"
                  style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                >
                  Pagina următoare →
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
