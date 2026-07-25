import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bookAppointment } from "../actions";
import BackLink from "@/components/BackLink";

export default async function VetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vet } = await supabase
    .from("vets")
    .select("*")
    .eq("id", id)
    .single();

  if (!vet) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: myPets } = user
    ? await supabase.from("pets").select("id, name").eq("owner_id", user.id)
    : { data: null };

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <BackLink href="/veterinari" label="Veterinari" />
      <h1 className="text-2xl font-bold">{vet.clinic_name}</h1>
      <p className="text-zinc-500">{vet.city} {vet.address ? `· ${vet.address}` : ""}</p>
      {vet.phone && <p className="text-sm text-zinc-500">{vet.phone}</p>}
      {vet.bio && <p className="mt-4 text-sm text-zinc-700">{vet.bio}</p>}

      <section className="mt-8 rounded-2xl border p-4 sm:p-6">
        <h2 className="mb-3 font-semibold">Programează o vizită</h2>
        {!user ? (
          <p className="text-sm text-zinc-600">
            <a href="/login" className="text-primary underline">Autentifică-te</a> pentru a programa o vizită.
          </p>
        ) : !myPets || myPets.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Nu ai încă niciun animal adăugat. Adaugă unul din{" "}
            <a href="/profil" className="text-primary underline">profilul tău</a>.
          </p>
        ) : (
          <form action={bookAppointment.bind(null, id)} className="flex flex-col gap-3">
            <select name="pet_id" required className="min-h-11 rounded-xl border px-4">
              <option value="">Alege animalul</option>
              {myPets.map((pet) => (
                <option key={pet.id} value={pet.id}>{pet.name}</option>
              ))}
            </select>
            <input
              name="starts_at"
              type="datetime-local"
              required
              className="min-h-11 rounded-xl border px-4"
            />
            <input
              name="reason"
              placeholder="Motivul vizitei (opțional)"
              className="min-h-11 rounded-xl border px-4"
            />
            <button className="min-h-11 self-start rounded-full bg-primary px-5 text-sm font-semibold text-white">
              Trimite cererea de programare
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
