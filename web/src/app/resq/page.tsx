import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { PetPlaceholder } from "@/components/PawPlaceholder";
import PageBanner from "@/components/PageBanner";
import AppShell from "@/components/AppShell";

export default async function ResqPage({
  searchParams,
}: {
  searchParams: Promise<{ tip?: string }>;
}) {
  const { tip } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("resq_cases")
    .select("id, type, name, species, city, photo_url")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (tip === "lost" || tip === "found") query = query.eq("type", tip);
  const { data: cases } = await query;

  return (
    <>
      <AppShell>
        <main
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 pb-24 sm:px-6 lg:px-8 md:pb-8">
        <PageBanner src="/images/pexels-resq.jpg" alt="Câine căutat" title="PetResQ" subtitle="Animale pierdute și găsite" />
        <div className="flex justify-end">
          <Link
            href="/resq/nou"
            className="flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white"
          >
            Raportează un caz
          </Link>
        </div>

        <div className="mt-4 flex gap-2">
          <Link href="/resq" className={`flex min-h-11 items-center rounded-full border px-4 text-sm ${!tip ? "border-primary bg-primary text-white" : "text-muted border-card-border"}`}>
            Toate
          </Link>
          <Link href="/resq?tip=lost" className={`flex min-h-11 items-center rounded-full border px-4 text-sm ${tip === "lost" ? "border-primary bg-primary text-white" : "text-muted border-card-border"}`}>
            Pierdute
          </Link>
          <Link href="/resq?tip=found" className={`flex min-h-11 items-center rounded-full border px-4 text-sm ${tip === "found" ? "border-primary bg-primary text-white" : "text-muted border-card-border"}`}>
            Găsite
          </Link>
        </div>

        {cases && cases.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {cases.map((c) => (
              <Link key={c.id} href={`/resq/${c.id}`} className="card-hover rounded-2xl border border-card-border bg-card p-3 shadow-sm hover:border-primary">
                {c.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.photo_url} alt={c.name} className="mb-2 aspect-square w-full rounded-xl object-cover" />
                ) : (
                  <PetPlaceholder className="mb-2 aspect-square w-full rounded-xl" />
                )}
                <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${c.type === "lost" ? "bg-red-500" : "bg-green-600"}`}>
                  {c.type === "lost" ? "PIERDUT" : "GĂSIT"}
                </span>
                <p className="truncate font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted">{c.species} · {c.city}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-card-border p-8 text-center text-sm text-muted">
            Niciun caz activ momentan.
          </p>
        )}
      </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
