import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setRsvp } from "../actions";
import BackLink from "@/components/BackLink";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";

const TYPE_LABELS: Record<string, string> = {
  meetup: "Meetup", adoption: "Adopție", competition: "Competiție",
  training: "Training", expo: "Expo", charity: "Caritabil", other: "Altele",
};

const AUDIENCE_LABELS: Record<string, string> = {
  all: "Toate animalele", dogs: "🐶 Doar câini", cats: "🐱 Doar pisici", small_pets: "🐹 Animale mici",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("pet_events")
    .select("*, profiles(full_name)")
    .eq("id", id)
    .single();

  if (!event) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rsvps } = await supabase
    .from("event_participants")
    .select("user_id, status, profiles(full_name)")
    .eq("event_id", id);

  const going = rsvps?.filter((r) => r.status === "going") ?? [];
  const maybe = rsvps?.filter((r) => r.status === "maybe") ?? [];
  const myRsvp = user ? rsvps?.find((r) => r.user_id === user.id) : null;
  const organizer = event.profiles as unknown as { full_name: string } | null;
  const isCancelled = event.status === "cancelled";

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
          <BackLink href="/evenimente" label="Evenimente" />

          {event.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.photo_url} alt={event.title} className="mt-3 h-48 w-full rounded-2xl object-cover" />
          )}

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}>
              {TYPE_LABELS[event.event_type] ?? event.event_type}
            </span>
            {isCancelled && (
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: "color-mix(in srgb, #ef4444 12%, transparent)", color: "#ef4444" }}>
                Anulat
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold mt-2" style={{ color: "var(--foreground)" }}>{event.title}</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            📅 {new Date(event.starts_at).toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
            {" → "}
            {new Date(event.ends_at).toLocaleDateString("ro-RO", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>📍 {event.location ?? event.city}, {event.city}</p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>🐾 {AUDIENCE_LABELS[event.audience] ?? event.audience}</p>
          {event.contact_phone && (
            <a href={`tel:${event.contact_phone}`} className="text-sm font-medium text-primary hover:underline">{event.contact_phone}</a>
          )}
          <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
            Organizat de {organizer?.full_name ?? "un membru al comunității"}
          </p>

          {event.description && <p className="mt-4 text-sm" style={{ color: "var(--foreground)" }}>{event.description}</p>}

          <section
            className="mt-8 rounded-2xl border p-4 sm:p-6"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <h2 className="mb-3 font-semibold" style={{ color: "var(--foreground)" }}>
              Participare {event.max_participants ? `(${going.length}/${event.max_participants})` : `(${going.length} confirma${going.length === 1 ? "t" : "ți"})`}
            </h2>
            {isCancelled ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>Acest eveniment a fost anulat.</p>
            ) : !user ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                <a href="/login" className="text-primary hover:underline">Autentifică-te</a> pentru a confirma participarea.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <form action={setRsvp.bind(null, id, "going")}>
                  <button
                    className="min-h-9 rounded-full px-4 text-xs font-semibold transition-opacity hover:opacity-90"
                    style={{ background: myRsvp?.status === "going" ? "var(--primary)" : "transparent", color: myRsvp?.status === "going" ? "#fff" : "var(--foreground)", border: "1px solid var(--card-border)" }}
                  >
                    ✅ Particip
                  </button>
                </form>
                <form action={setRsvp.bind(null, id, "maybe")}>
                  <button
                    className="min-h-9 rounded-full px-4 text-xs font-semibold transition-opacity hover:opacity-90"
                    style={{ background: myRsvp?.status === "maybe" ? "var(--primary)" : "transparent", color: myRsvp?.status === "maybe" ? "#fff" : "var(--foreground)", border: "1px solid var(--card-border)" }}
                  >
                    🤔 Poate
                  </button>
                </form>
                {myRsvp && myRsvp.status !== "cancelled" && (
                  <form action={setRsvp.bind(null, id, "cancelled")}>
                    <button className="min-h-9 rounded-full px-4 text-xs font-medium hover:underline" style={{ color: "#ef4444" }}>
                      Anulează participarea
                    </button>
                  </form>
                )}
              </div>
            )}

            {going.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>Participă:</p>
                <p className="text-sm" style={{ color: "var(--foreground)" }}>
                  {going.map((p) => (p.profiles as unknown as { full_name: string } | null)?.full_name ?? "Utilizator").join(", ")}
                </p>
              </div>
            )}
            {maybe.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>Poate participă:</p>
                <p className="text-sm" style={{ color: "var(--foreground)" }}>
                  {maybe.map((p) => (p.profiles as unknown as { full_name: string } | null)?.full_name ?? "Utilizator").join(", ")}
                </p>
              </div>
            )}
          </section>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
