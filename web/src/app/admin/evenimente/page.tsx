import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import Breadcrumb from "@/components/Breadcrumb";
import { cancelPetEvent, deletePetEvent } from "../actions";

const TYPE_LABELS: Record<string, string> = {
  meetup: "Meetup",
  adoption: "Adopție",
  competition: "Competiție",
  training: "Training",
  expo: "Expo",
  charity: "Caritabil",
  other: "Altele",
};

export default async function AdminEvenimentePage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const { data: events } = await supabase
    .from("pet_events")
    .select("id, title, event_type, city, starts_at, status, max_participants, profiles(full_name)")
    .order("starts_at", { ascending: false });

  const { data: participants } = await supabase.from("event_participants").select("event_id, status");
  const countByEvent = new Map<string, number>();
  participants?.forEach((p) => {
    if (p.status === "going") countByEvent.set(p.event_id, (countByEvent.get(p.event_id) ?? 0) + 1);
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ href: "/", label: "Acasă" }, { href: "/profil", label: "Profil" }, { href: "/admin", label: "Panou Admin" }, { label: "Evenimente" }]} />
      <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--foreground)" }}>
        Evenimente (admin)
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
        {events?.length ?? 0} eveniment{(events?.length ?? 0) === 1 ? "" : "e"}.
      </p>

      <section className="mt-6">
        {events && events.length > 0 ? (
          <div className="flex flex-col gap-2">
            {events.map((e) => {
              const organizer = e.profiles as unknown as { full_name: string } | null;
              const going = countByEvent.get(e.id) ?? 0;
              return (
                <div
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm shadow-sm"
                  style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
                >
                  <div className="min-w-0">
                    <p className="font-medium" style={{ color: "var(--foreground)" }}>
                      {e.title} {e.status === "cancelled" && <span className="text-[10px] font-semibold" style={{ color: "#ef4444" }}>(anulat)</span>}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {TYPE_LABELS[e.event_type] ?? e.event_type} · {e.city} · {new Date(e.starts_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {organizer?.full_name ?? "?"} · {going}{e.max_participants ? `/${e.max_participants}` : ""} participan{going === 1 ? "t" : "ți"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {e.status !== "cancelled" && (
                      <form action={cancelPetEvent.bind(null, e.id)}>
                        <button className="min-h-8 rounded-full border px-3 text-xs hover:border-amber-400 hover:text-amber-600" style={{ borderColor: "var(--card-border)" }}>
                          Anulează
                        </button>
                      </form>
                    )}
                    <form action={deletePetEvent.bind(null, e.id)}>
                      <button className="text-xs text-red-500 hover:underline">Șterge</button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Niciun eveniment creat.</p>
        )}
      </section>
    </main>
  );
}
