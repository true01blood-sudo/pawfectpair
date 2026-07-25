import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <p className="text-xs text-zinc-400">Prea puține date pentru grafic.</p>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 30 - ((v - min) / range) * 28 - 1;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" className="h-10 w-full" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="2" />
    </svg>
  );
}

export default async function StatisticiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pets } = await supabase.from("pets").select("id, name").eq("owner_id", user.id);
  const petIds = (pets ?? []).map((p) => p.id);

  const [{ data: medRecords }, { data: tasks }, { data: appts }, { data: weights }] = await Promise.all([
    petIds.length
      ? supabase.from("medical_records").select("type, pet_id").in("pet_id", petIds)
      : Promise.resolve({ data: [] as { type: string; pet_id: string }[] }),
    supabase.from("planner_tasks").select("done").eq("owner_id", user.id),
    supabase.from("vet_appointments").select("status").eq("owner_id", user.id),
    petIds.length
      ? supabase.from("weight_logs").select("pet_id, weight_kg, logged_at").in("pet_id", petIds).order("logged_at", { ascending: true })
      : Promise.resolve({ data: [] as { pet_id: string; weight_kg: number; logged_at: string }[] }),
  ]);

  const taskTotal = tasks?.length ?? 0;
  const taskDone = tasks?.filter((t) => t.done).length ?? 0;
  const taskPct = taskTotal ? Math.round((taskDone / taskTotal) * 100) : 0;

  const recordsByType: Record<string, number> = {};
  medRecords?.forEach((r) => {
    recordsByType[r.type] = (recordsByType[r.type] ?? 0) + 1;
  });
  const maxRecords = Math.max(1, ...Object.values(recordsByType));

  const apptTotal = appts?.length ?? 0;
  const apptConfirmed = appts?.filter((a) => a.status === "confirmed" || a.status === "completed").length ?? 0;

  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
        <h1 className="text-xl font-bold sm:text-2xl">Statistici</h1>
        <p className="text-sm text-zinc-500">Rezumat real, bazat pe datele tale din PetWell și Planificator.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border p-4">
            <p className="text-2xl font-bold text-primary">{pets?.length ?? 0}</p>
            <p className="text-xs text-zinc-500">Animale</p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-2xl font-bold text-primary">{taskPct}%</p>
            <p className="text-xs text-zinc-500">Activități bifate</p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-2xl font-bold text-primary">{apptConfirmed}/{apptTotal}</p>
            <p className="text-xs text-zinc-500">Programări confirmate</p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-2xl font-bold text-primary">{medRecords?.length ?? 0}</p>
            <p className="text-xs text-zinc-500">Evenimente medicale</p>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="mb-3 font-semibold">Evenimente medicale pe tip</h2>
          {Object.keys(recordsByType).length > 0 ? (
            <div className="flex flex-col gap-2">
              {Object.entries(recordsByType).map(([type, count]) => (
                <div key={type} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 text-zinc-600">{type}</span>
                  <div className="h-3 flex-1 rounded-full bg-zinc-100">
                    <div className="h-3 rounded-full bg-primary" style={{ width: `${(count / maxRecords) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right text-zinc-500">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Nicio înregistrare medicală încă.</p>
          )}
        </section>

        <section className="mt-8">
          <h2 className="mb-3 font-semibold">Evoluție greutate</h2>
          {pets && pets.length > 0 ? (
            <div className="flex flex-col gap-4">
              {pets.map((pet) => {
                const petWeights = (weights ?? []).filter((w) => w.pet_id === pet.id).map((w) => w.weight_kg);
                return (
                  <div key={pet.id} className="rounded-2xl border p-4">
                    <p className="mb-2 text-sm font-medium">{pet.name}</p>
                    <Sparkline values={petWeights} />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Adaugă un animal pentru a vedea statistici.</p>
          )}
        </section>
      </main>
      <BottomNav />
    </>
  );
}
