import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

export default async function VeterinariPage() {
  const supabase = await createClient();
  const { data: vets } = await supabase
    .from("vets")
    .select("id, clinic_name, city, phone")
    .order("created_at", { ascending: false });

  return (
    <>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 pb-24 sm:px-6 lg:px-8 md:pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold sm:text-2xl">Veterinari</h1>
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
            {vets.map((vet) => (
              <Link
                key={vet.id}
                href={`/veterinari/${vet.id}`}
                className="rounded-2xl border p-4 transition-colors hover:border-primary"
              >
                <p className="font-medium">{vet.clinic_name}</p>
                <p className="text-sm text-zinc-500">{vet.city || "Oraș nespecificat"}</p>
                {vet.phone && <p className="text-xs text-zinc-400">{vet.phone}</p>}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed p-8 text-center text-sm text-zinc-500">
            Niciun cabinet veterinar înregistrat încă.
          </p>
        )}
      </main>
      <BottomNav />
    </>
  );
}
