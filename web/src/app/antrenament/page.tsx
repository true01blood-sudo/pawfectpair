import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Training & Dresaj — PetCare",
  description: "Antrenori certificați, planuri de dresaj și sesiuni de training pentru câini și pisici.",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Începător",
  intermediate: "Intermediar",
  advanced: "Avansat",
};

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: "color-mix(in srgb, #16a34a 12%, transparent)", text: "#16a34a" },
  intermediate: { bg: "color-mix(in srgb, #f59e0b 12%, transparent)", text: "#d97706" },
  advanced: { bg: "color-mix(in srgb, var(--primary) 12%, transparent)", text: "var(--primary)" },
};

const SPECS_EMOJIS: Record<string, string> = {
  dresaj: "🎯",
  comportament: "🧠",
  agility: "🏃",
  socializare: "🤝",
  obedience: "⭐",
  "dresaj avansat": "🏆",
  pisici: "🐱",
};

export default async function AntrenamentPage({
  searchParams,
}: {
  searchParams: Promise<{ nivel?: string; specie?: string }>;
}) {
  const { nivel, specie } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch trainers
  const { data: trainers } = await supabase
    .from("trainers")
    .select("id, display_name, bio, specializations, city, photo_url, price_per_session_cents, currency, rating, session_count, is_verified")
    .order("rating", { ascending: false });

  // Fetch training plans
  let planQuery = supabase
    .from("training_plans")
    .select("id, trainer_id, title, description, level, species, duration_weeks, sessions_per_week, price_cents, currency, includes, trainers(display_name, photo_url, rating, is_verified)")
    .eq("is_active", true)
    .order("price_cents", { ascending: true });

  if (nivel) planQuery = planQuery.eq("level", nivel);
  if (specie) planQuery = planQuery.eq("species", specie);

  const { data: plans } = await planQuery;

  function buildHref(params: { nivel?: string; specie?: string }) {
    const sp = new URLSearchParams();
    if (params.nivel) sp.set("nivel", params.nivel);
    if (params.specie) sp.set("specie", params.specie);
    const qs = sp.toString();
    return qs ? `/antrenament?${qs}` : "/antrenament";
  }

  return (
    <>
      <AppShell>
        <main
        className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Training & Dresaj
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Antrenori certificați, planuri personalizate și sesiuni de comportament.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { emoji: "🎓", label: "Antrenori certificați", value: `${trainers?.length ?? 0}+` },
            { emoji: "📋", label: "Planuri disponibile", value: `${plans?.length ?? 0}+` },
            { emoji: "⭐", label: "Rating mediu", value: trainers?.length ? `${(trainers.reduce((s, t) => s + Number(t.rating), 0) / trainers.length).toFixed(1)}/5` : "—" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border p-3 text-center"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <div className="text-2xl mb-1">{stat.emoji}</div>
              <div className="text-lg font-bold" style={{ color: "var(--primary)" }}>{stat.value}</div>
              <div className="text-[10px] leading-snug" style={{ color: "var(--muted)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Trainers section */}
        {trainers && trainers.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold mb-3" style={{ color: "var(--foreground)" }}>
              Antrenori recomandate
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {trainers.map((trainer) => (
                <div
                  key={trainer.id}
                  className="flex-shrink-0 w-52 rounded-2xl border p-4"
                  style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="h-11 w-11 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
                      style={{ background: "var(--primary)" }}
                    >
                      {trainer.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={trainer.photo_url} alt={trainer.display_name} className="h-11 w-11 rounded-full object-cover" />
                      ) : (
                        trainer.display_name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                          {trainer.display_name}
                        </p>
                        {trainer.is_verified && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--primary)">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                          </svg>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        📍 {trainer.city}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-yellow-400">★</span>
                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{trainer.rating}</span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>({trainer.session_count} sesiuni)</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {(trainer.specializations as string[]).slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                          color: "var(--primary)",
                        }}
                      >
                        {SPECS_EMOJIS[s] ?? "📌"} {s}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs font-bold" style={{ color: "var(--primary)" }}>
                    {(trainer.price_per_session_cents / 100).toFixed(0)} {trainer.currency} / sesiune
                  </p>

                  <Link
                    href={user ? `/antrenament/antrenori/${trainer.id}` : "/login"}
                    className="mt-3 flex w-full items-center justify-center rounded-full bg-primary py-1.5 text-xs font-semibold text-white hover:bg-primary-dark transition-colors"
                  >
                    Rezervă sesiune
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex gap-1 rounded-2xl p-1 overflow-x-auto" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            {[
              { id: "", label: "Toate nivelele" },
              { id: "beginner", label: "Începător" },
              { id: "intermediate", label: "Intermediar" },
              { id: "advanced", label: "Avansat" },
            ].map((n) => (
              <Link
                key={n.id}
                href={buildHref({ nivel: n.id || undefined, specie })}
                className="flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: (nivel ?? "") === n.id ? "var(--primary)" : "transparent",
                  color: (nivel ?? "") === n.id ? "#fff" : "var(--muted)",
                }}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Training Plans */}
        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--foreground)" }}>
            Planuri de antrenament
          </h2>

          {plans && plans.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {plans.map((plan) => {
                const trainer = plan.trainers as unknown as { display_name: string; photo_url: string | null; rating: number; is_verified: boolean } | null;
                const levelColor = LEVEL_COLORS[plan.level] ?? LEVEL_COLORS.beginner;

                return (
                  <div
                    key={plan.id}
                    className="rounded-2xl border p-5 transition-shadow hover:shadow-md"
                    style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                          {plan.title}
                        </h3>
                        {trainer && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                            {trainer.is_verified ? "✅" : "👤"} {trainer.display_name} · ★ {trainer.rating}
                          </p>
                        )}
                      </div>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0"
                        style={{ background: levelColor.bg, color: levelColor.text }}
                      >
                        {LEVEL_LABELS[plan.level]}
                      </span>
                    </div>

                    {plan.description && (
                      <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: "var(--muted)" }}>
                        {plan.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        📅 {plan.duration_weeks} săptămâni
                      </span>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        · {plan.sessions_per_week}x/săptămână
                      </span>
                    </div>

                    {(plan.includes as string[]).length > 0 && (
                      <ul className="mb-3 space-y-1">
                        {(plan.includes as string[]).map((item) => (
                          <li key={item} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--foreground)" }}>
                            <span className="text-green-500">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="font-bold" style={{ color: "var(--primary)" }}>
                        {plan.price_cents === 0
                          ? "Preț la cerere"
                          : `${(plan.price_cents / 100).toFixed(0)} ${plan.currency}`}
                      </p>
                      <Link
                        href={user ? `/antrenament/rezerva/${plan.id}` : "/login"}
                        className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark transition-colors"
                      >
                        Înscrie-te
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="rounded-2xl border-2 border-dashed p-10 text-center"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
            >
              <div className="text-4xl mb-3">🎓</div>
              <p className="font-semibold" style={{ color: "var(--foreground)" }}>
                Niciun plan momentan
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                Aplică migrarea 0041 în Supabase Dashboard pentru date demo.
              </p>
            </div>
          )}
        </section>

        {/* Intake CTA */}
        <div
          className="mt-8 rounded-2xl border p-6"
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, transparent) 0%, transparent 100%)",
            borderColor: "color-mix(in srgb, var(--primary) 25%, transparent)",
          }}
        >
          <div className="flex items-start gap-4">
            <div className="text-4xl">🧠</div>
            <div className="flex-1">
              <h3 className="font-bold" style={{ color: "var(--foreground)" }}>
                Evaluare comportamentală gratuită
              </h3>
              <p className="text-sm mt-1 mb-4" style={{ color: "var(--muted)" }}>
                Completează formularul de intake comportamental și primește o recomandare personalizată de la antrenorii noștri.
              </p>
              <Link
                href={user ? "/antrenament/intake" : "/login"}
                className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                Completează formularul →
              </Link>
            </div>
          </div>
        </div>
      </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
