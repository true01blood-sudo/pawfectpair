import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { PetPlaceholder } from "@/components/PawPlaceholder";
import PageBanner from "@/components/PageBanner";

const speciesOptions = ["Toate", "Câine", "Pisică", "Altele"];

export default async function AdoptiiPage({
  searchParams,
}: {
  searchParams: Promise<{ specie?: string }>;
}) {
  const { specie } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("adoption_listings")
    .select("id, name, species, breed, age_years, city, photo_url, status")
    .eq("status", "available")
    .order("created_at", { ascending: false });

  if (specie && specie !== "Toate") {
    query = query.ilike("species", specie);
  }

  const { data: listings } = await query;

  return (
    <>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 pb-24 sm:px-6 lg:px-8 md:pb-8">
        <PageBanner src="/images/pexels-adoptii.jpg" alt="Câini fericiți disponibili pentru adopție" title="Adopții" subtitle="Adoptă, nu cumpăra" />
        <div className="flex justify-end">
          <Link
            href="/adoptii/adauga"
            className="flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white"
          >
            Adaugă un anunț
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {speciesOptions.map((s) => {
            const active = (specie ?? "Toate") === s;
            return (
              <Link
                key={s}
                href={s === "Toate" ? "/adoptii" : `/adoptii?specie=${encodeURIComponent(s)}`}
                className={`flex min-h-11 items-center rounded-full border px-4 text-sm ${
                  active ? "border-primary bg-primary text-white" : "text-zinc-600"
                }`}
              >
                {s}
              </Link>
            );
          })}
        </div>

        {listings && listings.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {listings.map((pet) => (
              <Link
                key={pet.id}
                href={`/adoptii/${pet.id}`}
                className="card-hover rounded-2xl border p-3 shadow-sm hover:border-primary"
              >
                {pet.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pet.photo_url} alt={pet.name} className="mb-2 aspect-square w-full rounded-xl object-cover" />
                ) : (
                  <PetPlaceholder className="mb-2 aspect-square w-full rounded-xl" />
                )}
                <p className="truncate font-medium">{pet.name}</p>
                <p className="truncate text-xs text-zinc-500">
                  {pet.breed || pet.species}
                  {pet.age_years ? ` · ${pet.age_years} ani` : ""}
                  {pet.city ? ` · ${pet.city}` : ""}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed p-8 text-center text-sm text-zinc-500">
            Nu există anunțuri pentru acest filtru.
          </p>
        )}
      </main>
      <BottomNav />
    </>
  );
}
