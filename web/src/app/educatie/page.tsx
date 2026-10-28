import type { Metadata } from "next";
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

const TRAINERS = [
  {
    id: 1,
    name: "Andrei Popa",
    specialty: "Dresaj comportamental",
    rating: 4.9,
    reviews: 87,
    experience: "8 ani experiență",
    tags: ["Câini", "Comportament", "Agresivitate"],
    avatar: "AP",
    color: "#FF6B2D",
  },
  {
    id: 2,
    name: "Maria Ionescu",
    specialty: "Nutriție & Wellness",
    rating: 4.8,
    reviews: 64,
    experience: "5 ani experiență",
    tags: ["Câini", "Pisici", "Dietă"],
    avatar: "MI",
    color: "#7C3AED",
  },
  {
    id: 3,
    name: "Cristian Dumitrescu",
    specialty: "Agility & Sport canin",
    rating: 5.0,
    reviews: 43,
    experience: "12 ani experiență",
    tags: ["Câini", "Agility", "Sport"],
    avatar: "CD",
    color: "#16A34A",
  },
];

const COURSES = [
  {
    id: 1,
    title: "Bazele dresajului — Curs începători",
    trainer: "Andrei Popa",
    duration: "4 săptămâni",
    sessions: "8 ședințe",
    price: "360 RON",
    level: "Începător",
    species: "Câini",
  },
  {
    id: 2,
    title: "Nutriție corectă pentru câini și pisici",
    trainer: "Maria Ionescu",
    duration: "2 săptămâni",
    sessions: "4 ședințe",
    price: "180 RON",
    level: "Toți",
    species: "Câini & Pisici",
  },
  {
    id: 3,
    title: "Agility — Pregătire pentru competiții",
    trainer: "Cristian Dumitrescu",
    duration: "8 săptămâni",
    sessions: "16 ședințe",
    price: "640 RON",
    level: "Avansat",
    species: "Câini",
  },
];

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
        <h1 className="text-xl font-bold sm:text-2xl">Sfaturi pentru animalul tău</h1>
        <p className="text-sm text-zinc-500">Îngrijire, dresaj, exerciții și alimentație corectă.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <a href={buildHref({ categorie })} className={`flex min-h-11 items-center rounded-full border px-4 text-sm ${!specie ? "border-primary bg-primary text-white" : "text-zinc-600"}`}>
            Toate speciile
          </a>
          {["caine", "pisica", "altele"].map((s) => (
            <a key={s} href={buildHref({ specie: s, categorie })} className={`flex min-h-11 items-center rounded-full border px-4 text-sm ${specie === s ? "border-primary bg-primary text-white" : "text-zinc-600"}`}>
              {speciesLabels[s]}
            </a>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <a href={buildHref({ specie })} className={`flex min-h-11 items-center rounded-full border px-4 text-sm ${!categorie ? "border-primary bg-primary text-white" : "text-zinc-600"}`}>
            Toate categoriile
          </a>
          {trainingCategories.map((c) => (
            <a key={c} href={buildHref({ specie, categorie: c })} className={`flex min-h-11 items-center rounded-full border px-4 text-sm capitalize ${categorie === c ? "border-primary bg-primary text-white" : "text-zinc-600"}`}>
              {c}
            </a>
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

        {/* ── Traineri certificați ── */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Traineri certificați</h2>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Experți care te ajută să îngrijești mai bine animalul tău</p>
            </div>
            <a href="#" className="text-sm font-medium text-primary hover:underline">Vezi toți</a>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TRAINERS.map((t) => (
              <div key={t.id} className="rounded-2xl border p-4 shadow-sm flex flex-col gap-3" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: t.color }}>
                    {t.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate" style={{ color: "var(--foreground)" }}>{t.name}</p>
                    <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{t.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 text-sm">★</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{t.rating}</span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>({t.reviews} recenzii)</span>
                </div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{t.experience}</p>
                <div className="flex flex-wrap gap-1.5">
                  {t.tags.map((tag) => (
                    <span key={tag} className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--card-border)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <button type="button" className="mt-auto w-full rounded-xl py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: "var(--primary)" }}>
                  Contactează trainer
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Cursuri & Training ── */}
        <section className="mt-10 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Cursuri & Training</h2>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Programe structurate pentru tine și animalul tău</p>
            </div>
            <a href="#" className="text-sm font-medium text-primary hover:underline">Toate cursurile</a>
          </div>
          <div className="flex flex-col gap-3">
            {COURSES.map((c) => (
              <div key={c.id} className="rounded-2xl border p-4 shadow-sm flex items-center gap-4" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
                <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)" }}>
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: "var(--foreground)" }}>{c.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    {c.trainer} · {c.duration} · {c.sessions}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}>
                      {c.level}
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{c.species}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold text-primary">{c.price}</p>
                  <button type="button" className="mt-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "var(--primary)" }}>
                    Înscrie-te
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
