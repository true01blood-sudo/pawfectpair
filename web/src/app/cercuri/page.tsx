import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Cercuri — PetCare",
  description: "Cluburi, echipe rescue și organizatori de events pentru iubitorii de animale.",
};

const TYPE_LABELS: Record<string, string> = {
  club: "Club",
  rescue: "Rescue",
  events: "Events",
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  club: { bg: "color-mix(in srgb, var(--primary) 12%, transparent)", text: "var(--primary)" },
  rescue: { bg: "color-mix(in srgb, #ef4444 12%, transparent)", text: "#ef4444" },
  events: { bg: "color-mix(in srgb, #8b5cf6 12%, transparent)", text: "#8b5cf6" },
};

const SPECIES_EMOJI: Record<string, string> = {
  general: "🐾",
  caine: "🐶",
  pisica: "🐱",
  altele: "🦜",
};

const TABS = [
  { id: "", label: "Toate" },
  { id: "club", label: "Cluburi" },
  { id: "rescue", label: "Rescue" },
  { id: "events", label: "Events" },
];

export default async function CercuriPage({
  searchParams,
}: {
  searchParams: Promise<{ tip?: string; specie?: string }>;
}) {
  const { tip, specie } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("circles")
    .select("id, name, description, type, species, city, photo_url, member_count")
    .eq("is_public", true)
    .order("member_count", { ascending: false });

  if (tip) query = query.eq("type", tip);
  if (specie) query = query.eq("species", specie);

  const { data: circles } = await query;

  // If user is logged in, get their joined circles
  let joinedIds = new Set<string>();
  if (user) {
    const { data: memberships } = await supabase
      .from("circle_members")
      .select("circle_id")
      .eq("user_id", user.id);
    joinedIds = new Set((memberships ?? []).map((m) => m.circle_id as string));
  }

  function buildHref(params: { tip?: string; specie?: string }) {
    const sp = new URLSearchParams();
    if (params.tip) sp.set("tip", params.tip);
    if (params.specie) sp.set("specie", params.specie);
    const qs = sp.toString();
    return qs ? `/cercuri?${qs}` : "/cercuri";
  }

  return (
    <>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Cercuri
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Cluburi de rasă, echipe rescue și comunități de pet owners din toată România.
          </p>
        </div>

        {/* Type tabs */}
        <div
          className="flex gap-1 rounded-2xl p-1 mb-4 overflow-x-auto"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={buildHref({ tip: t.id || undefined, specie })}
              className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: (tip ?? "") === t.id ? "var(--primary)" : "transparent",
                color: (tip ?? "") === t.id ? "#fff" : "var(--muted)",
                fontWeight: (tip ?? "") === t.id ? 600 : 400,
              }}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Species filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: "", label: "Toate speciile", emoji: "🐾" },
            { id: "caine", label: "Câini", emoji: "🐶" },
            { id: "pisica", label: "Pisici", emoji: "🐱" },
            { id: "general", label: "General", emoji: "🌐" },
            { id: "altele", label: "Altele", emoji: "🦜" },
          ].map((s) => (
            <Link
              key={s.id}
              href={buildHref({ tip, specie: s.id || undefined })}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
              style={{
                borderColor: (specie ?? "") === s.id ? "var(--primary)" : "var(--card-border)",
                background: (specie ?? "") === s.id ? "color-mix(in srgb, var(--primary) 10%, transparent)" : "var(--card-bg)",
                color: (specie ?? "") === s.id ? "var(--primary)" : "var(--foreground)",
              }}
            >
              <span>{s.emoji}</span>
              {s.label}
            </Link>
          ))}
        </div>

        {/* Circles grid */}
        {circles && circles.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {circles.map((circle) => {
              const typeColor = TYPE_COLORS[circle.type] ?? TYPE_COLORS.club;
              const isJoined = joinedIds.has(circle.id);

              return (
                <div
                  key={circle.id}
                  className="flex flex-col rounded-2xl border overflow-hidden transition-shadow hover:shadow-md"
                  style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                >
                  {/* Cover */}
                  <div
                    className="relative h-28 flex items-center justify-center text-5xl"
                    style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fde8d0 100%)" }}
                  >
                    {circle.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={circle.photo_url} alt={circle.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{SPECIES_EMOJI[circle.species] ?? "🐾"}</span>
                    )}
                    <span
                      className="absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                      style={{ background: typeColor.bg, color: typeColor.text }}
                    >
                      {TYPE_LABELS[circle.type]}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="font-bold text-sm leading-snug" style={{ color: "var(--foreground)" }}>
                      {circle.name}
                    </h2>
                    {circle.city && (
                      <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                        📍 {circle.city}
                      </p>
                    )}
                    {circle.description && (
                      <p className="mt-2 text-xs leading-relaxed line-clamp-2" style={{ color: "var(--muted)" }}>
                        {circle.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        👥 {circle.member_count} membri
                      </span>
                      {user ? (
                        <form action={isJoined ? `/cercuri/actiuni/paraseste` : `/cercuri/actiuni/alatura`} method="post">
                          <input type="hidden" name="circleId" value={circle.id} />
                          <button
                            type="submit"
                            className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                            style={
                              isJoined
                                ? { background: "var(--card-border)", color: "var(--muted)" }
                                : { background: "var(--primary)", color: "#fff" }
                            }
                          >
                            {isJoined ? "Înscris ✓" : "Alătură-te"}
                          </button>
                        </form>
                      ) : (
                        <Link
                          href="/login"
                          className="rounded-full px-3 py-1.5 text-xs font-semibold"
                          style={{ background: "var(--primary)", color: "#fff" }}
                        >
                          Alătură-te
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="rounded-2xl border-2 border-dashed p-12 text-center"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
          >
            <div className="text-5xl mb-4">⭕</div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>
              Niciun cerc {tip ? `de tip "${TYPE_LABELS[tip]?.toLowerCase()}"` : ""} momentan
            </h2>
            <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
              Fii primul care creează un club, o echipă rescue sau organizează events.
            </p>
            {user && (
              <Link
                href="/cercuri/creeaza"
                className="inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                + Creează un cerc
              </Link>
            )}
          </div>
        )}

        {/* Create CTA (when there are circles) */}
        {circles && circles.length > 0 && user && (
          <div className="mt-6 text-center">
            <Link
              href="/cercuri/creeaza"
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
            >
              + Creează un cerc nou
            </Link>
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
