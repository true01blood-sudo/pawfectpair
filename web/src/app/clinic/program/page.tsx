import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ApptRow = {
  id: string;
  starts_at: string;
  reason: string | null;
  status: string;
  pets: { name: string; species: string } | null;
  profiles: { full_name: string | null } | null;
};

const STATUS_LABELS: Record<string, string> = {
  requested: "În așteptare",
  confirmed: "Confirmată",
  completed: "Finalizată",
  cancelled: "Anulată",
};

const STATUS_COLORS: Record<string, string> = {
  requested: "#d97706",
  confirmed: "#16a34a",
  completed: "#6b7280",
  cancelled: "#ef4444",
};

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.setHours(0, 0, 0, 0) - today.getTime()) / 86400000);
  if (diffDays === 0) return "Astăzi";
  if (diffDays === 1) return "Mâine";
  return new Date(iso).toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" });
}

export default async function ClinicProgramPage() {
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

  const now = new Date();
  const in14days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const { data: appts } = await supabase
    .from("vet_appointments")
    .select("id, starts_at, reason, status, pets(name, species), profiles!owner_id(full_name)")
    .eq("vet_id", vet.id)
    .neq("status", "cancelled")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", in14days.toISOString())
    .order("starts_at", { ascending: true });

  const rows = (appts ?? []) as unknown as ApptRow[];

  const grouped = rows.reduce<Record<string, ApptRow[]>>((acc, a) => {
    const key = new Date(a.starts_at).toDateString();
    (acc[key] ??= []).push(a);
    return acc;
  }, {});

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Program</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Programările din următoarele 14 zile.
        </p>
      </div>

      {Object.keys(grouped).length > 0 ? (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([day, items]) => (
            <section key={day}>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-3 capitalize" style={{ color: "var(--muted)" }}>
                {dayLabel(items[0].starts_at)}
              </h2>
              <div className="flex flex-col gap-2">
                {items.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-2xl border p-3"
                    style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                  >
                    <div className="w-14 text-center shrink-0">
                      <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                        {new Date(a.starts_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        {a.pets?.name ?? "Animal"} {a.pets?.species ? `· ${a.pets.species}` : ""}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {a.profiles?.full_name ?? "Client"}{a.reason ? ` · ${a.reason}` : ""}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                      style={{
                        background: `color-mix(in srgb, ${STATUS_COLORS[a.status] ?? "#6b7280"} 14%, transparent)`,
                        color: STATUS_COLORS[a.status] ?? "#6b7280",
                      }}
                    >
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p
          className="rounded-2xl border border-dashed p-8 text-center text-sm"
          style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
        >
          Nicio programare în următoarele 14 zile.
        </p>
      )}
    </main>
  );
}
