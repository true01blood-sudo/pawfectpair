import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Sfaturi și educație",
  description: "Sfaturi pentru îngrijirea animalelor de companie: câini, pisici și mai mult.",
};

const speciesLabels: Record<string, string> = {
  general: "General",
  caine: "Câini",
  pisica: "Pisici",
  altele: "Altele",
};

export default async function EducatiePage({
  searchParams,
}: {
  searchParams: Promise<{ specie?: string }>;
}) {
  const { specie } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("edu_articles").select("*").order("created_at", { ascending: false });
  if (specie) query = query.eq("species", specie);
  const { data: articles } = await query;

  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
        <h1 className="text-xl font-bold sm:text-2xl">Sfaturi pentru animalul tău</h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {["general", "caine", "pisica", "altele"].map((s) => (
            <a
              key={s}
              href={`/educatie?specie=${s}`}
              className={`flex min-h-11 items-center rounded-full border px-4 text-sm ${
                specie === s ? "border-primary bg-primary text-white" : "text-zinc-600"
              }`}
            >
              {speciesLabels[s]}
            </a>
          ))}
          <a href="/educatie" className="flex min-h-11 items-center rounded-full border px-4 text-sm text-zinc-600">
            Toate
          </a>
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
