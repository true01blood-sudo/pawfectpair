import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import Breadcrumb from "@/components/Breadcrumb";
import { deleteCircle, deleteCircleEvent } from "../actions";

const TYPE_LABELS: Record<string, string> = {
  club: "Club",
  rescue: "Rescue",
  events: "Events",
};

export default async function AdminCercuriPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const [{ data: circles }, { data: events }] = await Promise.all([
    supabase
      .from("circles")
      .select("id, name, type, species, city, is_public, member_count, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("circle_events")
      .select("id, title, event_date, location, attendee_count, max_attendees, circles(name)")
      .order("event_date", { ascending: false })
      .limit(30),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ href: "/", label: "Acasă" }, { href: "/profil", label: "Profil" }, { href: "/admin", label: "Panou Admin" }, { label: "Cercuri" }]} />
      <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--foreground)" }}>
        Cercuri (admin)
      </h1>

      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
          Cercuri ({circles?.length ?? 0})
        </h2>
        {circles && circles.length > 0 ? (
          <div className="flex flex-col gap-2">
            {circles.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm shadow-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
              >
                <div className="min-w-0">
                  <p className="font-medium" style={{ color: "var(--foreground)" }}>
                    {c.name} {!c.is_public && <span className="text-[10px] font-semibold" style={{ color: "var(--muted)" }}>(privat)</span>}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {TYPE_LABELS[c.type] ?? c.type} · {c.city ?? "Oraș nespecificat"} · {c.member_count} membri · {new Date(c.created_at).toLocaleDateString("ro-RO")}
                  </p>
                </div>
                <form action={deleteCircle.bind(null, c.id)}>
                  <button className="text-xs text-red-500 hover:underline">Șterge</button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Niciun cerc creat.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
          Evenimente cercuri ({events?.length ?? 0})
        </h2>
        {events && events.length > 0 ? (
          <div className="flex flex-col gap-2">
            {events.map((e) => {
              const circle = e.circles as unknown as { name: string } | null;
              return (
                <div
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm shadow-sm"
                  style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate" style={{ color: "var(--foreground)" }}>{e.title}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {circle?.name ?? "?"} · {new Date(e.event_date).toLocaleDateString("ro-RO")} · {e.location ?? "fără locație"} · {e.attendee_count}{e.max_attendees ? `/${e.max_attendees}` : ""} participanți
                    </p>
                  </div>
                  <form action={deleteCircleEvent.bind(null, e.id)}>
                    <button className="text-xs text-red-500 hover:underline">Șterge</button>
                  </form>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Niciun eveniment.</p>
        )}
      </section>
    </main>
  );
}
