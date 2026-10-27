import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Îngrijire — PetCare",
  description: "Servicii de îngrijire, grooming, antrenament și planificator pentru animalele tale.",
};

const CARE_MODULES = [
  {
    emoji: "✂️",
    title: "Grooming",
    desc: "Programează o tunsoare, baie sau toaletare.",
    href: "/programari?tip=grooming",
    color: "#8b5cf6",
  },
  {
    emoji: "🏋️",
    title: "Antrenament",
    desc: "Dresaj, agility și îmbunătățirea comportamentului.",
    href: "/antrenament",
    color: "#16a34a",
  },
  {
    emoji: "🍽️",
    title: "Nutriție",
    desc: "Plan alimentar personalizat, dozare și alergii.",
    href: "/planificator",
    color: "#ea580c",
  },
  {
    emoji: "🛁",
    title: "Baie acasă",
    desc: "Ghid pas cu pas pentru baia animalului tău.",
    href: "/educatie?categorie=baie",
    color: "#0284c7",
  },
  {
    emoji: "🦷",
    title: "Îngrijire dentară",
    desc: "Periaj dinți, produse recomandate și programări.",
    href: "/educatie?categorie=dental",
    color: "#d97706",
  },
  {
    emoji: "📋",
    title: "Plan de îngrijire",
    desc: "Crează un plan săptămânal de rutine pentru animalul tău.",
    href: "/planificator",
    color: "#0891b2",
  },
];

const UPCOMING_CARE = [
  { emoji: "✂️", title: "Tuns — Luna", date: "În 3 zile", type: "grooming" },
  { emoji: "🦷", title: "Periaj dinți — Thor", date: "Ieri (restant)", type: "dental" },
];

export default async function IngrijirePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Îngrijire
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Grooming, antrenament, nutriție și rutine zilnice.
          </p>
        </div>

        {/* Upcoming care reminders */}
        <div
          className="mb-6 rounded-2xl border p-4"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
            Programate
          </p>
          <div className="flex flex-col gap-2">
            {UPCOMING_CARE.map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <span className="text-xl">{item.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {item.title}
                  </p>
                </div>
                <span
                  className="text-xs rounded-full px-2.5 py-1 font-medium"
                  style={{
                    background: item.date.includes("restant")
                      ? "color-mix(in srgb, #ef4444 12%, transparent)"
                      : "color-mix(in srgb, var(--primary) 10%, transparent)",
                    color: item.date.includes("restant") ? "#ef4444" : "var(--primary)",
                  }}
                >
                  {item.date}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/planificator"
            className="mt-3 block text-center text-xs font-medium"
            style={{ color: "var(--primary)" }}
          >
            Vezi planificatorul complet →
          </Link>
        </div>

        {/* Care modules grid */}
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
          Module îngrijire
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CARE_MODULES.map((mod) => (
            <Link
              key={mod.title}
              href={mod.href}
              className="flex items-start gap-3 rounded-2xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                style={{ background: `color-mix(in srgb, ${mod.color} 12%, transparent)` }}
              >
                {mod.emoji}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                  {mod.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {mod.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick link to trainers */}
        <div
          className="mt-6 rounded-2xl border p-5 flex items-center gap-4"
          style={{
            background: "color-mix(in srgb, var(--primary) 5%, transparent)",
            borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
          }}
        >
          <span className="text-3xl shrink-0">🎓</span>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
              Caută un antrenor certificat
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Dresaj, agility, comportament — antrenori în zona ta.
            </p>
          </div>
          <Link
            href="/antrenament"
            className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white"
          >
            Caută →
          </Link>
        </div>
      </main>
      <BottomNav />
    </AppShell>
  );
}
