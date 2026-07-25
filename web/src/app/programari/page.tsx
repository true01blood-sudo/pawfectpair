import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { setAppointmentStatus } from "./actions";

const statusStyles: Record<string, string> = {
  requested: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-zinc-100 text-zinc-600",
};
const statusLabels: Record<string, string> = {
  requested: "în așteptare",
  confirmed: "confirmată",
  cancelled: "anulată",
  completed: "finalizată",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyles[status] ?? "bg-zinc-100 text-zinc-600"}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}

type AppointmentRow = {
  id: string;
  starts_at: string;
  reason: string | null;
  status: string;
  pets: { name: string } | null;
  vets: { clinic_name: string } | null;
};

export default async function ProgramariPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myAppointments } = await supabase
    .from("vet_appointments")
    .select("id, starts_at, reason, status, pets(name), vets(clinic_name)")
    .eq("owner_id", user.id)
    .order("starts_at", { ascending: true });

  const { data: myVet } = await supabase
    .from("vets")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: incoming } = myVet
    ? await supabase
        .from("vet_appointments")
        .select("id, starts_at, reason, status, pets(name)")
        .eq("vet_id", myVet.id)
        .order("starts_at", { ascending: true })
    : { data: null };

  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
        <h1 className="text-xl font-bold sm:text-2xl">Programările mele</h1>

        {myAppointments && myAppointments.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-3">
            {(myAppointments as unknown as AppointmentRow[]).map((a) => (
              <li key={a.id} className="card-hover rounded-xl border p-3 text-sm shadow-sm">
                <p className="font-medium">
                  {a.pets?.name} @ {a.vets?.clinic_name}
                </p>
                <p className="mt-1 flex items-center gap-2 text-zinc-500">
                  {new Date(a.starts_at).toLocaleString("ro-RO")}
                  <StatusBadge status={a.status} />
                </p>
                {a.reason && <p className="text-zinc-600">{a.reason}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">Nu ai încă programări.</p>
        )}

        {myVet && (
          <section className="mt-10">
            <h2 className="mb-3 font-semibold">Cereri primite (cabinetul tău)</h2>
            {incoming && incoming.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {(incoming as unknown as AppointmentRow[]).map((a) => (
                  <li key={a.id} className="card-hover rounded-xl border p-3 text-sm shadow-sm">
                    <p className="font-medium">
                      {a.pets?.name} · {new Date(a.starts_at).toLocaleString("ro-RO")}
                    </p>
                    <p className="mt-1"><StatusBadge status={a.status} /></p>
                    {a.status === "requested" && (
                      <div className="mt-2 flex gap-2">
                        <form action={setAppointmentStatus.bind(null, a.id, "confirmed")}>
                          <button className="min-h-11 rounded-full bg-primary px-4 text-xs font-semibold text-white">
                            Confirmă
                          </button>
                        </form>
                        <form action={setAppointmentStatus.bind(null, a.id, "cancelled")}>
                          <button className="min-h-11 rounded-full border px-4 text-xs">
                            Anulează
                          </button>
                        </form>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">Nicio cerere primită.</p>
            )}
          </section>
        )}
      </main>
      <BottomNav />
    </>
  );
}
