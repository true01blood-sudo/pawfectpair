import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applyToListing, acceptApplication } from "./actions";
import { PetPlaceholder } from "@/components/PawPlaceholder";
import BackLink from "@/components/BackLink";

export default async function AdoptieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: pet } = await supabase
    .from("adoption_listings")
    .select("*")
    .eq("id", id)
    .single();

  if (!pet) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user?.id === pet.posted_by;

  const { data: myApplication } = user && !isOwner
    ? await supabase
        .from("adoption_applications")
        .select("id, status")
        .eq("listing_id", id)
        .eq("applicant_id", user.id)
        .maybeSingle()
    : { data: null };

  const { data: applications } = isOwner
    ? await supabase
        .from("adoption_applications")
        .select("id, message, status, applicant_id, profiles(full_name)")
        .eq("listing_id", id)
    : { data: null };

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <BackLink href="/adoptii" label="Adopții" />
      {pet.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pet.photo_url} alt={pet.name} className="aspect-video w-full rounded-2xl object-cover" />
      ) : (
        <PetPlaceholder className="aspect-video w-full rounded-2xl" />
      )}

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pet.name}</h1>
          <p className="text-zinc-500">
            {pet.breed || pet.species} · {pet.age_years ? `${pet.age_years} ani · ` : ""}
            {pet.city}
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium capitalize text-zinc-600">
          {pet.status === "available" ? "Disponibil" : pet.status === "pending" ? "În proces" : "Adoptat"}
        </span>
      </div>

      {pet.description && (
        <p className="mt-4 whitespace-pre-line text-sm text-zinc-700">{pet.description}</p>
      )}

      {!isOwner && pet.status === "available" && (
        <section className="mt-8 rounded-2xl border p-4 sm:p-6">
          {!user ? (
            <p className="text-sm text-zinc-600">
              <a href="/login" className="text-primary underline">Autentifică-te</a> pentru a aplica la această adopție.
            </p>
          ) : myApplication ? (
            <p className="text-sm text-zinc-600">
              Ai aplicat deja pentru {pet.name} — status: <strong>{myApplication.status}</strong>
            </p>
          ) : (
            <form action={applyToListing.bind(null, id)} className="flex flex-col gap-3">
              <label className="text-sm font-medium">Aplică pentru adopție</label>
              <textarea
                name="message"
                rows={3}
                placeholder="Spune-le de ce ai fi un stăpân potrivit..."
                className="rounded-xl border p-3 text-sm"
              />
              <button
                type="submit"
                className="min-h-11 self-start rounded-full bg-primary px-5 text-sm font-semibold text-white"
              >
                Trimite aplicația
              </button>
            </form>
          )}
        </section>
      )}

      {isOwner && applications && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold">
            Aplicații primite ({applications.length})
          </h2>
          {applications.length === 0 ? (
            <p className="text-sm text-zinc-500">Nicio aplicație încă.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {applications.map((app) => (
                <li key={app.id} className="rounded-xl border p-3 text-sm">
                  <p className="font-medium">
                    {(app as unknown as { profiles?: { full_name?: string } }).profiles?.full_name || "Utilizator"}
                    {" — "}
                    <span className="capitalize text-zinc-500">{app.status}</span>
                  </p>
                  {app.message && <p className="mt-1 text-zinc-600">{app.message}</p>}
                  {app.status === "pending" && (
                    <form action={acceptApplication.bind(null, id, app.id)} className="mt-2">
                      <button className="min-h-11 rounded-full bg-primary px-4 text-xs font-semibold text-white">
                        Acceptă
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
