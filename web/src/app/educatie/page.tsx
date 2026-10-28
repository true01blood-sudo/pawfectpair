import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Educație & Dresaj",
  description: "Sfaturi, traineri certificați și cursuri pentru îngrijirea și dresajul animalelor de companie.",
};

const speciesLabels: Record<string, string> = {
  general: "General",
  caine: "Câini",
  pisica: "Pisici",
  altele: "Altele",
};

const trainingCategories = ["dresaj", "alimentație", "exerciții"];

export default async function EducatiePage({
  searchParams,
}: {
  searchParams: Promise<{ specie?: string; categorie?: string }>;
}) {
  const { specie, categorie } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("edu_articles").select("*").order("created_at", { ascending: false });
  if (specie) query = query.eq("species", specie);
  if (categorie) query = query.eq("category", categorie);
  const { data: articles } = await query;

  function buildHref(params: { specie?: string; categorie?: string }) {
    const sp = new URLSearchParams();
    if (params.specie) sp.set("specie", params.specie);
    if (params.categorie) sp.set("categorie", params.categorie);
    const qs = sp.toString();
    return qs ? `/educatie?${qs}` : "/educatie";
  }

  return (
    <>
      <AppShell>
        <main
        className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
        <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--foreground)" }}>Sfaturi pentru animalul tău</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Îngrijire, dresaj, exerciții și alimentație corectă.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={buildHref({ categorie })}
            className="flex min-h-11 items-center rounded-full border px-4 text-sm"
            style={!specie ? { borderColor: "var(--primary)", background: "var(--primary)", color: "white" } : { borderColor: "var(--card-border)", color: "var(--muted)" }}
          >
            Toate speciile
          </Link>
          {["caine", "pisica", "altele"].map((s) => (
            <Link
              key={s}
              href={buildHref({ specie: s, categorie })}
              className="flex min-h-11 items-center rounded-full border px-4 text-sm"
              style={specie === s ? { borderColor: "var(--primary)", background: "var(--primary)", color: "white" } : { borderColor: "var(--card-border)", color: "var(--muted)" }}
            >
              {speciesLabels[s]}
            </Link>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href={buildHref({ specie })}
            className="flex min-h-11 items-center rounded-full border px-4 text-sm"
            style={!categorie ? { borderColor: "var(--primary)", background: "var(--primary)", color: "white" } : { borderColor: "var(--card-border)", color: "var(--muted)" }}
          >
            Toate categoriile
          </Link>
          {trainingCategories.map((c) => (
            <Link
              key={c}
              href={buildHref({ specie, categorie: c })}
              className="flex min-h-11 items-center rounded-full border px-4 text-sm capitalize"
              style={categorie === c ? { borderColor: "var(--primary)", background: "var(--primary)", color: "white" } : { borderColor: "var(--card-border)", color: "var(--muted)" }}
            >
              {c}
            </Link>
          ))}
        </div>

        {articles && articles.length > 0 ? (
          <ul className="mt-6 flex flex-col gap-3">
            {articles.map((a) => (
              <li key={a.id} className="card-hover rounded-2xl border p-4 shadow-sm" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {speciesLabels[a.species]}
                  {a.category ? ` · ${a.category}` : ""}
                </p>
                <p className="mt-1 font-semibold" style={{ color: "var(--foreground)" }}>{a.title}</p>
                <p className="mt-1 whitespace-pre-line text-sm" style={{ color: "var(--muted)" }}>{a.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed p-8 text-center text-sm" style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}>
            Niciun articol momentan pentru acest filtru.
          </p>
        )}

        {/* ── Traineri & cursuri — modulul Antrenament ── */}
        <section className="mt-10 mb-6">
          <div
            className="rounded-2xl border p-5 flex items-center gap-4"
            style={{ background: "color-mix(in srgb, var(--primary) 6%, transparent)", borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)" }}
          >
            <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)" }}>
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold" style={{ color: "var(--foreground)" }}>Traineri certificați & cursuri de dresaj</p>
              <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                Vezi antrenori verificați, planuri de training și programează ședințe.
              </p>
            </div>
            <Link
              href="/antrenament"
              className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--primary)" }}
            >
              Vezi antrenori →
            </Link>
          </div>
        </section>
      </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
