import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addMedicalRecord, addWeightLog } from "./actions";
import { PetPlaceholder } from "@/components/PawPlaceholder";
import BackLink from "@/components/BackLink";

const typeLabels: Record<string, string> = {
  vaccination: "Vaccinare",
  treatment: "Tratament",
  surgery: "Intervenție chirurgicală",
  checkup: "Control de rutină",
  allergy: "Alergie",
  other: "Altele",
};

function isSoon(dateStr: string | null) {
  if (!dateStr) return false;
  const due = new Date(dateStr).getTime();
  const in30days = Date.now() + 30 * 24 * 60 * 60 * 1000;
  return due <= in30days;
}

export default async function PetHealthPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pet } = await supabase.from("pets").select("*").eq("id", id).single();
  if (!pet || pet.owner_id !== user.id) notFound();

  const { data: records } = await supabase
    .from("medical_records")
    .select("*")
    .eq("pet_id", id)
    .order("record_date", { ascending: false });

  const { data: weights } = await supabase
    .from("weight_logs")
    .select("weight_kg, logged_at")
    .eq("pet_id", id)
    .order("logged_at", { ascending: false })
    .limit(6);

  const upcoming = (records ?? []).filter((r) => isSoon(r.next_due_date));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
      <BackLink href="/profil" label="Profil" />
      <div className="flex items-center gap-4">
        {pet.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pet.photo_url} alt={pet.name} className="h-20 w-20 rounded-2xl object-cover" />
        ) : (
          <PetPlaceholder className="h-20 w-20 rounded-2xl" />
        )}
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{pet.name} — fișă medicală</h1>
        </div>
      </div>
      <p className="text-sm text-zinc-500">
        {pet.breed || pet.species}
        {pet.weight_kg ? ` · ${pet.weight_kg} kg` : ""}
      </p>

      {upcoming.length > 0 && (
        <section className="mt-4 rounded-2xl bg-primary/10 p-4">
          <p className="mb-2 text-sm font-semibold text-primary">Scadențe apropiate</p>
          <ul className="space-y-1 text-sm">
            {upcoming.map((r) => (
              <li key={r.id}>
                {typeLabels[r.type]} — {r.title} · {r.next_due_date}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 font-semibold">Greutate</h2>
        {weights && weights.length > 0 ? (
          <ul className="flex flex-wrap gap-2 text-sm">
            {weights.map((w, i) => (
              <li key={i} className="rounded-full border px-3 py-1">
                {w.weight_kg} kg <span className="text-zinc-400">· {w.logged_at}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">Nicio înregistrare de greutate.</p>
        )}
        <form action={addWeightLog.bind(null, id)} className="mt-3 flex gap-2">
          <input
            name="weight_kg"
            type="number"
            min="0"
            step="0.1"
            placeholder="Greutate (kg)"
            required
            className="min-h-11 w-32 rounded-xl border px-3 text-sm"
          />
          <button className="min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-white">
            Adaugă
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold">Istoric medical</h2>
        {records && records.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {records.map((r) => (
              <li key={r.id} className="rounded-xl border p-3 text-sm">
                <p className="font-medium">
                  {typeLabels[r.type] ?? r.type} — {r.title}
                </p>
                <p className="text-zinc-500">
                  {r.record_date}
                  {r.next_due_date ? ` · următoarea scadență: ${r.next_due_date}` : ""}
                </p>
                {r.notes && <p className="mt-1 text-zinc-600">{r.notes}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">Niciun eveniment medical înregistrat.</p>
        )}

        <form action={addMedicalRecord.bind(null, id)} className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <select name="type" className="min-h-11 rounded-xl border px-3 text-sm">
              <option value="vaccination">Vaccinare</option>
              <option value="treatment">Tratament</option>
              <option value="surgery">Intervenție</option>
              <option value="checkup">Control de rutină</option>
              <option value="allergy">Alergie</option>
              <option value="other">Altele</option>
            </select>
            <input name="title" placeholder="Titlu (ex: Rabie)" required className="min-h-11 rounded-xl border px-3 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Data</label>
              <input name="record_date" type="date" className="min-h-11 rounded-xl border px-3 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Următoarea scadență (opțional)</label>
              <input name="next_due_date" type="date" className="min-h-11 rounded-xl border px-3 text-sm" />
            </div>
          </div>
          <textarea name="notes" placeholder="Note" rows={3} className="rounded-xl border p-3 text-sm" />
          <button className="min-h-11 self-start rounded-full bg-primary px-5 text-sm font-semibold text-white">
            Adaugă în fișă
          </button>
        </form>
      </section>
    </main>
  );
}
