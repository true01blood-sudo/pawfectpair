import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bookAppointment, submitReview } from "../actions";
import BackLink from "@/components/BackLink";
import { StarsDisplay, StarsInput } from "@/components/Stars";

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

  const { data: reviews } = await supabase
    .from("vet_reviews")
    .select("user_id, rating, comment, created_at, profiles(full_name)")
    .eq("vet_id", id)
    .order("created_at", { ascending: false });

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const myReview = user ? reviews?.find((r) => r.user_id === user.id) : null;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <BackLink href="/veterinari" label="Veterinari" />
      <h1 className="text-2xl font-bold">{vet.clinic_name}</h1>
      {reviews && reviews.length > 0 && (
        <div className="mt-1"><StarsDisplay rating={avgRating} count={reviews.length} /></div>
      )}
      <p className="mt-2 text-zinc-500">{vet.city} {vet.address ? `· ${vet.address}` : ""}</p>
      {vet.phone && (
        <a href={`tel:${vet.phone}`} className="text-sm text-primary underline">{vet.phone}</a>
      )}
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

      <section className="mt-8">
        <h2 className="mb-3 font-semibold">Recenzii</h2>
        {reviews && reviews.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {reviews.map((r, i) => {
              const author = r.profiles as unknown as { full_name: string } | null;
              return (
                <li key={i} className="rounded-xl border p-3 text-sm shadow-sm">
                  <StarsDisplay rating={r.rating} />
                  <p className="mt-1 font-medium">{author?.full_name || "Utilizator"}</p>
                  {r.comment && <p className="mt-1 text-zinc-600">{r.comment}</p>}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">Nicio recenzie încă.</p>
        )}

        {user && !myReview && (
          <form action={submitReview.bind(null, id)} className="mt-4 flex flex-col gap-3 rounded-xl border p-4">
            <p className="text-sm font-medium">Lasă o recenzie</p>
            <StarsInput />
            <textarea name="comment" placeholder="Comentariu (opțional)" rows={2} className="rounded-xl border p-3 text-sm" />
            <button className="min-h-11 self-start rounded-full bg-primary px-5 text-sm font-semibold text-white">
              Trimite recenzia
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
