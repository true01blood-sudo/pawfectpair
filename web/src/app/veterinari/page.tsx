import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { StarsDisplay } from "@/components/Stars";
import PageBanner from "@/components/PageBanner";
import AppShell from "@/components/AppShell";

export default async function VeterinariPage() {
  const supabase = await createClient();
  const { data: vets } = await supabase
    .from("vets")
    .select("id, clinic_name, city, address, phone")
    .order("created_at", { ascending: false });

  const { data: allReviews } = await supabase.from("vet_reviews").select("vet_id, rating");
  const ratingsByVet = new Map<string, number[]>();
  allReviews?.forEach((r) => {
    const arr = ratingsByVet.get(r.vet_id) ?? [];
    arr.push(r.rating);
    ratingsByVet.set(r.vet_id, arr);
  });

  return (
    <>
      <AppShell>
        <main
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 pb-24 sm:px-6 lg:px-8 md:pb-8">
        <PageBanner src="/images/pexels-veterinar.jpg" alt="Consultație veterinară" title="Veterinari" subtitle="Servicii medicale veterinare lângă tine" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Link
              href="/programari"
              className="flex min-h-11 items-center rounded-full border px-4 text-sm"
            >
              Programările mele
            </Link>
            <Link
              href="/veterinari/adauga"
              className="flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white"
            >
              Înregistrează cabinet
            </Link>
          </div>
        </div>

        {vets && vets.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {vets.map((vet) => {
              const ratings = ratingsByVet.get(vet.id);
              const avg = ratings && ratings.length > 0
                ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                : 0;
              return (
                <Link
                  key={vet.id}
                  href={`/veterinari/${vet.id}`}
                  className="card-hover rounded-2xl border border-card-border bg-card p-4 shadow-sm hover:border-primary"
                >
                  <p className="font-medium">{vet.clinic_name}</p>
                  {ratings && ratings.length > 0 && (
                    <div className="mt-0.5"><StarsDisplay rating={avg} count={ratings.length} /></div>
                  )}
                  <p className="mt-1 text-sm text-muted">{vet.city || "Oraș nespecificat"}{vet.address ? ` · ${vet.address}` : ""}</p>
                  {vet.phone && <p className="text-xs text-muted opacity-70">{vet.phone}</p>}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-card-border p-8 text-center text-sm text-muted">
            Niciun cabinet veterinar înregistrat încă.
          </p>
        )}
      </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
