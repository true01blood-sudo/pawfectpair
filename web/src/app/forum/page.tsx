import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import PageBanner from "@/components/PageBanner";
import AppShell from "@/components/AppShell";

const categories = ["Sănătate", "Dresaj", "Nutriție", "Adopții", "Urgențe", "Recomandări"];

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}) {
  const { categorie } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("forum_posts")
    .select("id, title, body, category, created_at, profiles(full_name)")
    .order("created_at", { ascending: false });
  if (categorie) query = query.eq("category", categorie);
  const { data: posts } = await query;

  type PostRow = {
    id: string;
    title: string;
    body: string;
    category: string | null;
    created_at: string;
    profiles: { full_name: string } | null;
  };

  return (
    <>
      <AppShell>
        <main
        className="mx-auto w-full max-w-3xl flex-1 px-4 py-4 pb-24 sm:px-6 lg:px-8 md:pb-8">
        <PageBanner src="/images/pexels-forum.jpg" alt="Comunitate de proprietari de animale" title="Forum" subtitle="Întreabă, discută, învață de la alți stăpâni" />
        <div className="flex justify-end">
          <Link href="/forum/nou" className="flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white">
            Postare nouă
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/forum" className={`flex min-h-11 items-center rounded-full border px-4 text-sm ${!categorie ? "border-primary bg-primary text-white" : "text-zinc-600"}`}>
            Toate
          </Link>
          {categories.map((c) => (
            <Link key={c} href={`/forum?categorie=${encodeURIComponent(c)}`} className={`flex min-h-11 items-center rounded-full border px-4 text-sm ${categorie === c ? "border-primary bg-primary text-white" : "text-zinc-600"}`}>
              {c}
            </Link>
          ))}
        </div>

        {posts && posts.length > 0 ? (
          <ul className="mt-6 flex flex-col gap-3">
            {(posts as unknown as PostRow[]).map((p) => (
              <li key={p.id}>
                <Link href={`/forum/${p.id}`} className="card-hover block rounded-2xl border p-4 shadow-sm hover:border-primary">
                  {p.category && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">{p.category}</span>
                  )}
                  <p className="mt-1 font-semibold">{p.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{p.body}</p>
                  <p className="mt-2 text-xs text-zinc-400">{p.profiles?.full_name || "Utilizator"}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed p-8 text-center text-sm text-zinc-500">
            Nicio postare încă. Fii primul care întreabă sau împărtășește ceva!
          </p>
        )}
      </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
