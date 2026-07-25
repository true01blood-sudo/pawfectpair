import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PetPlaceholder } from "@/components/PawPlaceholder";
import { resolveCase } from "../actions";

export default async function ResqDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: c } = await supabase.from("resq_cases").select("*").eq("id", id).single();
  if (!c) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === c.reporter_id;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      {c.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.photo_url} alt={c.name} className="aspect-video w-full rounded-2xl object-cover" />
      ) : (
        <PetPlaceholder className="aspect-video w-full rounded-2xl" />
      )}

      <span className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-semibold text-white ${c.type === "lost" ? "bg-red-500" : "bg-green-600"}`}>
        {c.type === "lost" ? "ANIMAL PIERDUT" : "ANIMAL GĂSIT"}
        {c.status === "resolved" && " · REZOLVAT"}
      </span>

      <h1 className="mt-2 text-2xl font-bold">{c.name}</h1>
      <p className="text-zinc-500">{c.species} {c.city && `· ${c.city}`}</p>
      {c.last_seen_location && (
        <p className="mt-1 text-sm text-zinc-600">Ultima locație: {c.last_seen_location}</p>
      )}
      {c.description && <p className="mt-3 text-sm text-zinc-700">{c.description}</p>}
      {c.contact_phone && (
        <a href={`tel:${c.contact_phone}`} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-white">
          Sună: {c.contact_phone}
        </a>
      )}

      {isOwner && c.status === "active" && (
        <form action={resolveCase.bind(null, id)} className="mt-6">
          <button className="min-h-11 rounded-full border px-5 text-sm font-semibold">
            Marchează ca rezolvat
          </button>
        </form>
      )}
    </main>
  );
}
