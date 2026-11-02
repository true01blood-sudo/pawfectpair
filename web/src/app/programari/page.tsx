import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { setAppointmentStatus, setTrainerBookingStatus } from "./actions";
import AppShell from "@/components/AppShell";

const statusColors: Record<string, string> = {
  requested: "#d97706",
  confirmed: "#16a34a",
  declined: "#ef4444",
  cancelled: "#ef4444",
  completed: "#6b7280",
};
const statusLabels: Record<string, string> = {
  requested: "în așteptare",
  confirmed: "confirmată",
  declined: "respinsă",
  cancelled: "anulată",
  completed: "finalizată",
};

function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status] ?? "#6b7280";
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
    >
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

type TrainerBookingRow = {
  id: string;
  requested_at: string;
  notes: string | null;
  status: string;
  pets: { name: string } | null;
  edu_trainers: { display_name: string } | null;
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

  const { data: myTrainerBookings } = await supabase
    .from("trainer_bookings")
    .select("id, requested_at, notes, status, pets(name), edu_trainers(display_name)")
    .eq("owner_id", user.id)
    .order("requested_at", { ascending: true });

  const { data: myTrainerProfile } = await supabase
    .from("edu_trainers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: incomingTrainerBookings } = myTrainerProfile
    ? await supabase
        .from("trainer_bookings")
        .select("id, requested_at, notes, status, pets(name)")
        .eq("trainer_id", myTrainerProfile.id)
        .order("requested_at", { ascending: true })
    : { data: null };

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Programările mele</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Vizite programate la cabinete veterinare pentru animalele tale.
            </p>
          </div>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
              Programările tale
            </h2>
            {myAppointments && myAppointments.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {(myAppointments as unknown as AppointmentRow[]).map((a) => (
                  <li
                    key={a.id}
                    className="card-hover rounded-2xl border p-4 text-sm shadow-sm"
                    style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
                  >
                    <p className="font-semibold" style={{ color: "var(--foreground)" }}>
                      {a.pets?.name} @ {a.vets?.clinic_name}
                    </p>
                    <p className="mt-1 flex items-center gap-2" style={{ color: "var(--muted)" }}>
                      {new Date(a.starts_at).toLocaleString("ro-RO")}
                      <StatusBadge status={a.status} />
                    </p>
                    {a.reason && <p className="mt-1" style={{ color: "var(--muted)" }}>{a.reason}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p
                className="rounded-2xl border border-dashed p-8 text-center text-sm"
                style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
              >
                Nu ai încă programări.
              </p>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
              Sesiuni cu traineri
            </h2>
            {myTrainerBookings && myTrainerBookings.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {(myTrainerBookings as unknown as TrainerBookingRow[]).map((b) => (
                  <li
                    key={b.id}
                    className="card-hover rounded-2xl border p-4 text-sm shadow-sm"
                    style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
                  >
                    <p className="font-semibold" style={{ color: "var(--foreground)" }}>
                      {b.pets?.name} @ {b.edu_trainers?.display_name}
                    </p>
                    <p className="mt-1 flex items-center gap-2" style={{ color: "var(--muted)" }}>
                      {new Date(b.requested_at).toLocaleString("ro-RO")}
                      <StatusBadge status={b.status} />
                    </p>
                    {b.notes && <p className="mt-1" style={{ color: "var(--muted)" }}>{b.notes}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p
                className="rounded-2xl border border-dashed p-8 text-center text-sm"
                style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
              >
                Nu ai încă sesiuni cu traineri.
              </p>
            )}
          </section>

          {myVet && (
            <section className="mt-10">
              <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                Cereri primite (cabinetul tău)
              </h2>
              {incoming && incoming.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {(incoming as unknown as AppointmentRow[]).map((a) => (
                    <li
                      key={a.id}
                      className="card-hover rounded-2xl border p-4 text-sm shadow-sm"
                      style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
                    >
                      <p className="font-semibold" style={{ color: "var(--foreground)" }}>
                        {a.pets?.name} · {new Date(a.starts_at).toLocaleString("ro-RO")}
                      </p>
                      <p className="mt-1"><StatusBadge status={a.status} /></p>
                      {a.status === "requested" && (
                        <div className="mt-3 flex gap-2">
                          <form action={setAppointmentStatus.bind(null, a.id, "confirmed")}>
                            <button className="min-h-9 rounded-full bg-primary px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                              Confirmă
                            </button>
                          </form>
                          <form action={setAppointmentStatus.bind(null, a.id, "cancelled")}>
                            <button
                              className="min-h-9 rounded-full border px-4 text-xs font-medium transition-colors hover:border-primary/40"
                              style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                            >
                              Anulează
                            </button>
                          </form>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  className="rounded-2xl border border-dashed p-8 text-center text-sm"
                  style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
                >
                  Nicio cerere primită.
                </p>
              )}
            </section>
          )}

          {myTrainerProfile && (
            <section className="mt-10">
              <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                Cereri primite (profilul tău de trainer)
              </h2>
              {incomingTrainerBookings && incomingTrainerBookings.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {(incomingTrainerBookings as unknown as TrainerBookingRow[]).map((b) => (
                    <li
                      key={b.id}
                      className="card-hover rounded-2xl border p-4 text-sm shadow-sm"
                      style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
                    >
                      <p className="font-semibold" style={{ color: "var(--foreground)" }}>
                        {b.pets?.name} · {new Date(b.requested_at).toLocaleString("ro-RO")}
                      </p>
                      {b.notes && <p className="mt-1" style={{ color: "var(--muted)" }}>{b.notes}</p>}
                      <p className="mt-1"><StatusBadge status={b.status} /></p>
                      {b.status === "requested" && (
                        <div className="mt-3 flex gap-2">
                          <form action={setTrainerBookingStatus.bind(null, b.id, "confirmed")}>
                            <button className="min-h-9 rounded-full bg-primary px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                              Confirmă
                            </button>
                          </form>
                          <form action={setTrainerBookingStatus.bind(null, b.id, "declined")}>
                            <button
                              className="min-h-9 rounded-full border px-4 text-xs font-medium transition-colors hover:border-primary/40"
                              style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                            >
                              Respinge
                            </button>
                          </form>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  className="rounded-2xl border border-dashed p-8 text-center text-sm"
                  style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
                >
                  Nicio cerere primită.
                </p>
              )}
            </section>
          )}
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
