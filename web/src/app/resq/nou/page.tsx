import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reportCase } from "../actions";

export default async function ResqNouPage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { pet: petIdParam } = await searchParams;
  const { data: myPets } = await supabase.from("pets").select("id, name, species").eq("owner_id", user.id);
  const prefill = myPets?.find((p) => p.id === petIdParam);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-xl font-bold sm:text-2xl">Raportează un caz</h1>

      <form action={reportCase} className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm">
            <input type="radio" name="type" value="lost" defaultChecked /> Animal pierdut
          </label>
          <label className="flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm">
            <input type="radio" name="type" value="found" /> Animal găsit
          </label>
        </div>

        {myPets && myPets.length > 0 && (
          <select name="pet_id" defaultValue={prefill?.id ?? ""} className="min-h-11 rounded-xl border px-3 text-sm">
            <option value="">Nu e unul dintre animalele mele</option>
            {myPets.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        <input name="name" placeholder="Nume animal (sau descriere scurtă)" defaultValue={prefill?.name} required className="min-h-11 rounded-xl border px-4" />
        <input name="species" placeholder="Specie" defaultValue={prefill?.species} required className="min-h-11 rounded-xl border px-4" />
        <div className="grid grid-cols-2 gap-3">
          <input name="city" placeholder="Oraș" className="min-h-11 rounded-xl border px-4" />
          <input name="last_seen_location" placeholder="Ultima locație văzută" className="min-h-11 rounded-xl border px-4" />
        </div>
        <input name="contact_phone" placeholder="Telefon de contact" className="min-h-11 rounded-xl border px-4" />
        <textarea name="description" placeholder="Descriere: semne distinctive, circumstanțe..." rows={4} className="rounded-xl border p-4" />

        <button className="min-h-11 self-start rounded-full bg-primary px-5 text-sm font-semibold text-white">
          Publică raportul
        </button>
      </form>
    </main>
  );
}
