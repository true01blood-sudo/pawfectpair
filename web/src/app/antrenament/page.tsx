import type { Metadata } from "next";
import Link from "next/link";
import { createClient, getUser } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Training & Dresaj — PetCare",
  description: "Antrenori certificați pentru dresaj și sesiuni de training pentru câini și pisici.",
};

const SPECIALTY_LABELS: Record<string, string> = {
  obedience: "Ascultare",
  behavior: "Comportament",
  agility: "Agility",
  puppy: "Pui",
  protection: "Protecție",
  therapy: "Terapie",
};

const SPECIALTY_EMOJI: Record<string, string> = {
  obedience: "🎯",
  behavior: "🧠",
  agility: "🏃",
  puppy: "🐶",
  protection: "🛡️",
  therapy: "💚",
};

export default async function AntrenamentPage() {
  const supabase = await createClient();
  const user = await getUser();

  const { data: trainers } = await supabase
    .from("edu_trainers")
    .select("id, display_name, bio, specialties, city, photo_url, price_range, experience_years, verified")
    .eq("active", true)
    .order("verified", { ascending: false })
    .order("experience_years", { ascending: false });

  const avgExperience = trainers?.length
    ? Math.round(trainers.reduce((s, t) => s + (t.experience_years ?? 0), 0) / trainers.length)
    : 0;

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              Training & Dresaj
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Antrenori verificați, specializați pe comportament, ascultare și agility.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { emoji: "🎓", label: "Antrenori", value: `${trainers?.length ?? 0}` },
              { emoji: "⭐", label: "Experiență medie", value: `${avgExperience} ani` },
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

          {/* Trainers */}
          {trainers && trainers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {trainers.map((trainer) => (
                <Link
                  key={trainer.id}
                  href={`/antrenament/antrenori/${trainer.id}`}
                  className="rounded-2xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0 overflow-hidden"
                      style={{ background: "var(--primary)" }}
                    >
                      {trainer.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={trainer.photo_url} alt={trainer.display_name} className="h-12 w-12 object-cover" />
                      ) : (
                        trainer.display_name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                          {trainer.display_name}
                        </p>
                        {trainer.verified && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--primary)">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                          </svg>
                        )}
                      </div>
                      {trainer.city && (
                        <p className="text-xs" style={{ color: "var(--muted)" }}>📍 {trainer.city}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
                    {trainer.experience_years} {trainer.experience_years === 1 ? "an" : "ani"} experiență
                  </p>

                  {(trainer.specialties as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(trainer.specialties as string[]).slice(0, 3).map((sp) => (
                        <span
                          key={sp}
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}
                        >
                          {SPECIALTY_EMOJI[sp] ?? "📌"} {SPECIALTY_LABELS[sp] ?? sp}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    {trainer.price_range ? (
                      <p className="text-xs font-bold" style={{ color: "var(--primary)" }}>{trainer.price_range}</p>
                    ) : <span />}
                    <span
                      className="rounded-full px-4 py-1.5 text-xs font-semibold text-white"
                      style={{ background: "var(--primary)" }}
                    >
                      {user ? "Vezi profilul →" : "Autentifică-te"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div
              className="rounded-2xl border-2 border-dashed p-10 text-center"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
            >
              <div className="text-4xl mb-3">🎓</div>
              <p className="font-semibold" style={{ color: "var(--foreground)" }}>
                Niciun trainer momentan
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                Revino în curând — traineri noi se adaugă constant.
              </p>
            </div>
          )}
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
