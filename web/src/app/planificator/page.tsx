import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { addTask, completeTask } from "./actions";
import AppShell from "@/components/AppShell";

const categoryLabels: Record<string, string> = {
  feeding: "Hrănire",
  walk: "Plimbare",
  grooming: "Îngrijire",
  medication: "Medicație",
  other: "Altele",
};

export default async function PlanificatorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myPets } = await supabase.from("pets").select("id, name").eq("owner_id", user.id);

  const { data: tasks } = await supabase
    .from("planner_tasks")
    .select("id, title, category, due_at, done, recurrence, pets(name)")
    .eq("owner_id", user.id)
    .eq("done", false)
    .order("due_at", { ascending: true });

  type TaskRow = {
    id: string;
    title: string;
    category: string;
    due_at: string;
    recurrence: string;
    pets: { name: string } | null;
  };

  return (
    <>
      <AppShell>
        <main
        className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
        <h1 className="text-xl font-bold sm:text-2xl">Planificator</h1>

        {!myPets || myPets.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600">
            Adaugă mai întâi un animal în{" "}
            <a href="/profil" className="text-primary underline">profilul tău</a>.
          </p>
        ) : (
          <>
            {tasks && tasks.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-2">
                {(tasks as unknown as TaskRow[]).map((t) => (
                  <li key={t.id} className="card-hover flex items-center justify-between rounded-xl border p-3 text-sm shadow-sm">
                    <div>
                      <p className="font-medium">
                        {categoryLabels[t.category]} — {t.title}
                      </p>
                      <p className="text-zinc-500">
                        {t.pets?.name} · {new Date(t.due_at).toLocaleString("ro-RO")}
                        {t.recurrence !== "none" && ` · repetă ${t.recurrence === "daily" ? "zilnic" : "săptămânal"}`}
                      </p>
                    </div>
                    <form action={completeTask.bind(null, t.id)}>
                      <button className="min-h-11 rounded-full bg-primary px-4 text-xs font-semibold text-white">
                        Bifează
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">Nicio activitate planificată.</p>
            )}

            <h2 className="mt-8 mb-3 font-semibold">Adaugă activitate</h2>
            <form action={addTask} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <select name="pet_id" required className="min-h-11 rounded-xl border px-3 text-sm">
                  <option value="">Animal</option>
                  {myPets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <select name="category" className="min-h-11 rounded-xl border px-3 text-sm">
                  <option value="feeding">Hrănire</option>
                  <option value="walk">Plimbare</option>
                  <option value="grooming">Îngrijire</option>
                  <option value="medication">Medicație</option>
                  <option value="other">Altele</option>
                </select>
              </div>
              <input name="title" placeholder="Titlu (ex: Hrană de dimineață)" required className="min-h-11 rounded-xl border px-3 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input name="due_at" type="datetime-local" required className="min-h-11 rounded-xl border px-3 text-sm" />
                <select name="recurrence" className="min-h-11 rounded-xl border px-3 text-sm">
                  <option value="none">O singură dată</option>
                  <option value="daily">Zilnic</option>
                  <option value="weekly">Săptămânal</option>
                </select>
              </div>
              <button className="min-h-11 self-start rounded-full bg-primary px-5 text-sm font-semibold text-white">
                Adaugă în planificator
              </button>
            </form>
          </>
        )}
      </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
