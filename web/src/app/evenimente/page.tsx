import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Evenimente — PetCare",
  description: "Meetup-uri, competiții, expoziții și evenimente caritabile pentru iubitorii de animale.",
};

const TYPE_LABELS: Record<string, string> = {
  meetup: "Meetup",
  adoption: "Adopție",
  competition: "Competiție",
  training: "Training",
  expo: "Expo",
  charity: "Caritabil",
  other: "Altele",
};

const TYPE_EMOJI: Record<string, string> = {
  meetup: "👋",
  adoption: "🐾",
  competition: "🏆",
  training: "🎓",
  expo: "🎪",
  charity: "❤️",
  other: "📌",
};

const TABS = [
  { id: "", label: "Toate" },
  { id: "meetup", label: "Meetup" },
  { id: "adoption", label: "Adopție" },
  { id: "competition", label: "Competiții" },
  { id: "expo", label: "Expo" },
  { id: "charity", label: "Caritabile" },
];

export default async function EvenimentePage({
  searchParams,
}: {
  searchParams: Promise<{ tip?: string }>;
}) {
  const { tip } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("pet_events")
    .select("id, title, event_type, city, location, starts_at, max_participants, photo_url")
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (tip) query = query.eq("event_type", tip);

  const { data: events } = await query;

  const { data: participants } = await supabase.from("event_participants").select("event_id, status");
  const countByEvent = new Map<string, number>();
  participants?.forEach((p) => {
    if (p.status === "going") countByEvent.set(p.event_id, (countByEvent.get(p.event_id) ?? 0) + 1);
  });

  function buildHref(params: { tip?: string }) {
    const sp = new URLSearchParams();
    if (params.tip) sp.set("tip", params.tip);
    const qs = sp.toString();
    return qs ? `/evenimente?${qs}` : "/evenimente";
  }

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Evenimente</h1>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Meetup-uri, competiții, expoziții și evenimente caritabile pentru comunitate.
              </p>
            </div>
            <Link
              href={user ? "/evenimente/creeaza" : "/login"}
              className="inline-flex shrink-0 items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              + Creează eveniment
            </Link>
          </div>

          <div className="flex gap-1 rounded-2xl p-1 mb-5 overflow-x-auto" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            {TABS.map((t) => (
              <Link
                key={t.id}
                href={buildHref({ tip: t.id || undefined })}
                className="flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: (tip ?? "") === t.id ? "var(--primary)" : "transparent",
                  color: (tip ?? "") === t.id ? "#fff" : "var(--muted)",
                }}
              >
                {t.label}
              </Link>
            ))}
          </div>

          {events && events.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {events.map((e) => {
                const going = countByEvent.get(e.id) ?? 0;
                return (
                  <Link
                    key={e.id}
                    href={`/evenimente/${e.id}`}
                    className="rounded-2xl border p-4 transition-shadow hover:shadow-md"
                    style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                  >
                    <div className="flex gap-3">
                      {e.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.photo_url} alt={e.title} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <div className="h-16 w-16 shrink-0 rounded-xl flex items-center justify-center text-2xl" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)" }}>
                          {TYPE_EMOJI[e.event_type] ?? "📅"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}>
                          {TYPE_LABELS[e.event_type] ?? e.event_type}
                        </span>
                        <p className="font-bold text-sm mt-1 truncate" style={{ color: "var(--foreground)" }}>{e.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                          {new Date(e.starts_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>📍 {e.location ?? e.city}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-semibold" style={{ color: "var(--primary)" }}>
                      {going}{e.max_participants ? `/${e.max_participants}` : ""} participan{going === 1 ? "t" : "ți"}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div
              className="rounded-2xl border-2 border-dashed p-10 text-center"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
            >
              <div className="text-4xl mb-3">📅</div>
              <p className="font-semibold" style={{ color: "var(--foreground)" }}>Niciun eveniment programat</p>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                Fii primul care creează un eveniment pentru comunitate.
              </p>
            </div>
          )}
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
