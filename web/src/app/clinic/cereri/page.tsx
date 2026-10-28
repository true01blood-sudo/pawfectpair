import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setAppointmentStatus } from "@/app/programari/actions";

type RequestRow = {
  id: string;
  starts_at: string;
  reason: string | null;
  pets: { name: string; species: string } | null;
  profiles: { full_name: string | null } | null;
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("ro-RO", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default async function ClinicCereriPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: vet } = await supabase
    .from("vets")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!vet) redirect("/veterinari/adauga");

  const { data: requests } = await supabase
    .from("vet_appointments")
    .select("id, starts_at, reason, pets(name, species), profiles!owner_id(full_name)")
    .eq("vet_id", vet.id)
    .eq("status", "requested")
    .order("starts_at", { ascending: true });

  const rows = (requests ?? []) as unknown as RequestRow[];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Cereri de programare</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {rows.length} cerer{rows.length === 1 ? "e" : "i"} în așteptare.
        </p>
      </div>

      {rows.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border p-4"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                    {r.pets?.name ?? "Animal"} {r.pets?.species ? `· ${r.pets.species}` : ""}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    {r.profiles?.full_name ?? "Client"} · {fmtDateTime(r.starts_at)}
                  </p>
                  {r.reason && (
                    <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{r.reason}</p>
                  )}
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                  style={{ background: "color-mix(in srgb, #d97706 14%, transparent)", color: "#d97706" }}
                >
                  În așteptare
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                <form action={setAppointmentStatus.bind(null, r.id, "confirmed")}>
                  <button
                    type="submit"
                    className="min-h-9 rounded-full bg-primary px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Confirmă
                  </button>
                </form>
                <form action={setAppointmentStatus.bind(null, r.id, "cancelled")}>
                  <button
                    type="submit"
                    className="min-h-9 rounded-full border px-4 text-xs font-medium transition-colors hover:border-primary/40"
                    style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                  >
                    Respinge
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p
          className="rounded-2xl border border-dashed p-8 text-center text-sm"
          style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
        >
          Nicio cerere în așteptare momentan.
        </p>
      )}
    </main>
  );
}
