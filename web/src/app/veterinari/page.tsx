import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { StarsDisplay } from "@/components/Stars";
import { VetIcon } from "@/components/icons";
import PageBanner from "@/components/PageBanner";
import AppShell from "@/components/AppShell";

export default async function VeterinariPage({
  searchParams,
}: {
  searchParams: Promise<{ oras?: string }>;
}) {
  const { oras } = await searchParams;
  const supabase = await createClient();
  const { data: allVets } = await supabase
    .from("vets")
    .select("id, clinic_name, city, address, phone, bio")
    .order("created_at", { ascending: false });

  const cities = Array.from(
    new Set((allVets ?? []).map((v) => v.city).filter((c): c is string => Boolean(c)))
  ).sort();

  const vets = oras ? (allVets ?? []).filter((v) => v.city === oras) : allVets;

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
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 pb-24 sm:px-6 lg:px-8 md:pb-8">
          <PageBanner src="/images/pexels-veterinar.jpg" alt="Consultație veterinară" title="Veterinari" subtitle="Servicii medicale veterinare lângă tine" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Link
                href="/programari"
                className="flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
                style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
              >
                Programările mele
              </Link>
              <Link
                href="/veterinari/adauga"
                className="flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Înregistrează cabinet
              </Link>
            </div>
          </div>

          {cities.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/veterinari"
                className="flex min-h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors"
                style={
                  !oras
                    ? { borderColor: "var(--primary)", background: "var(--primary)", color: "white" }
                    : { borderColor: "var(--card-border)", color: "var(--muted)" }
                }
              >
                Toate orașele
              </Link>
              {cities.map((c) => (
                <Link
                  key={c}
                  href={`/veterinari?oras=${encodeURIComponent(c)}`}
                  className="flex min-h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors"
                  style={
                    oras === c
                      ? { borderColor: "var(--primary)", background: "var(--primary)", color: "white" }
                      : { borderColor: "var(--card-border)", color: "var(--muted)" }
                  }
                >
                  {c}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6 mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              {vets && vets.length > 0 ? `${vets.length} cabinete găsite` : "Cabinete veterinare"}
            </h2>
          </div>

          {vets && vets.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {vets.map((vet) => {
                const ratings = ratingsByVet.get(vet.id);
                const avg = ratings && ratings.length > 0
                  ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                  : 0;
                return (
                  <Link
                    key={vet.id}
                    href={`/veterinari/${vet.id}`}
                    className="card-hover group flex flex-col rounded-2xl border p-4 shadow-sm transition-colors hover:border-primary"
                    style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
                  >
                    <div className="mb-3 flex items-center justify-center rounded-xl bg-primary/10 aspect-[2/1]">
                      <VetIcon className="h-8 w-8 text-primary/60" />
                    </div>
                    <p className="font-semibold" style={{ color: "var(--foreground)" }}>{vet.clinic_name}</p>
                    {ratings && ratings.length > 0 ? (
                      <div className="mt-0.5"><StarsDisplay rating={avg} count={ratings.length} /></div>
                    ) : (
                      <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>Fără recenzii încă</p>
                    )}
                    {vet.bio && (
                      <p className="mt-2 text-xs line-clamp-2" style={{ color: "var(--muted)" }}>{vet.bio}</p>
                    )}
                    <div className="mt-3 flex flex-col gap-1 text-xs" style={{ color: "var(--muted)" }}>
                      <span className="flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        {vet.city || "Oraș nespecificat"}{vet.address ? ` · ${vet.address}` : ""}
                      </span>
                      {vet.phone && (
                        <span className="flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                          {vet.phone}
                        </span>
                      )}
                    </div>
                    <span className="mt-3 text-xs font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Vezi profil →
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed p-8 text-center text-sm" style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}>
              {oras ? `Niciun cabinet găsit în ${oras}.` : "Niciun cabinet veterinar înregistrat încă."}
            </p>
          )}
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
