import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Sfaturi și educație",
  description: "Sfaturi pentru îngrijirea, dresajul și alimentația animalelor de companie.",
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
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
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
              <li key={a.id} className="rounded-2xl border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {speciesLabels[a.species]}
                  {a.category ? ` · ${a.category}` : ""}
                </p>
                <p className="mt-1 font-semibold">{a.title}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-zinc-600">{a.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed p-8 text-center text-sm text-zinc-500">
            Niciun articol momentan pentru acest filtru.
          </p>
        )}
      </main>
      <BottomNav />
    </>
  );
}
