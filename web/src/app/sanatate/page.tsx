import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Sănătate & Dosar medical — PetCare",
  description: "Fișa medicală, vaccinări, tratamente și graficul de greutate pentru animalele tale.",
};

const TYPE_LABELS: Record<string, string> = {
  vaccination: "Vaccinare",
  treatment: "Tratament",
  surgery: "Operație",
  checkup: "Control",
  allergy: "Alergie",
  other: "Altele",
};

const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  vaccination: { bg: "color-mix(in srgb, #16a34a 12%, transparent)", text: "#16a34a", dot: "#16a34a" },
  treatment: { bg: "color-mix(in srgb, #3b82f6 12%, transparent)", text: "#2563eb", dot: "#3b82f6" },
  surgery: { bg: "color-mix(in srgb, #ef4444 12%, transparent)", text: "#ef4444", dot: "#ef4444" },
  checkup: { bg: "color-mix(in srgb, var(--primary) 12%, transparent)", text: "var(--primary)", dot: "var(--primary)" },
  allergy: { bg: "color-mix(in srgb, #f59e0b 12%, transparent)", text: "#d97706", dot: "#f59e0b" },
  other: { bg: "color-mix(in srgb, #6b7280 12%, transparent)", text: "#6b7280", dot: "#6b7280" },
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

function speciesEmoji(s: string): string {
  if (s === "Câine" || s === "dog") return "🐶";
  if (s === "Pisică" || s === "cat") return "🐱";
  if (s === "Iepure" || s === "rabbit") return "🐰";
  return "🐾";
}

export default async function SanatatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pets } = await supabase
    .from("pets")
    .select("id, name, species, breed, photo_url, birth_date")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  // Upcoming records (next 60 days) across all pets
  const petIds = (pets ?? []).map((p) => p.id);
  let upcomingRecords: Array<{
    id: string; pet_id: string; type: string; title: string;
    next_due_date: string; pets?: { name: string } | null;
  }> = [];

  if (petIds.length > 0) {
    const now = new Date().toISOString().split("T")[0];
    const in60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const { data } = await supabase
      .from("medical_records")
      .select("id, pet_id, type, title, next_due_date, pets(name)")
      .in("pet_id", petIds)
      .gte("next_due_date", now)
      .lte("next_due_date", in60)
      .order("next_due_date", { ascending: true })
      .limit(10);
    upcomingRecords = (data ?? []) as unknown as typeof upcomingRecords;
  }

  // Recent records per pet (last 3 per pet)
  const recentByPet: Record<string, Array<{ id: string; type: string; title: string; record_date: string }>> = {};
  for (const pet of pets ?? []) {
    const { data } = await supabase
      .from("medical_records")
      .select("id, type, title, record_date")
      .eq("pet_id", pet.id)
      .order("record_date", { ascending: false })
      .limit(3);
    recentByPet[pet.id] = data ?? [];
  }

  return (
    <>
      <AppShell>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              Sănătate & Dosar medical
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Fișe medicale, vaccinări, tratamente și monitorizare greutate.
            </p>
          </div>
        </div>

        {/* Upcoming scadentar */}
        {upcomingRecords.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
              Scadente în 60 de zile
            </h2>
            <div className="space-y-2">
              {upcomingRecords.map((rec) => {
                const days = daysUntil(rec.next_due_date);
                const typeColor = TYPE_COLORS[rec.type] ?? TYPE_COLORS.other;
                const pet = rec.pets as { name: string } | null;
                return (
                  <div
                    key={rec.id}
                    className="flex items-center gap-3 rounded-xl border p-3"
                    style={{
                      background: days <= 7
                        ? "color-mix(in srgb, #ef4444 4%, var(--card-bg))"
                        : "var(--card-bg)",
                      borderColor: days <= 7
                        ? "color-mix(in srgb, #ef4444 25%, var(--card-border))"
                        : "var(--card-border)",
                    }}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ background: typeColor.bg, color: typeColor.text }}
                    >
                      {days}z
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                        {rec.title}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {pet?.name} · {new Date(rec.next_due_date).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0"
                      style={{ background: typeColor.bg, color: typeColor.text }}
                    >
                      {TYPE_LABELS[rec.type]}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Pet cards */}
        {pets && pets.length > 0 ? (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
              Animalele tale
            </h2>
            <div className="space-y-4">
              {pets.map((pet) => {
                const recent = recentByPet[pet.id] ?? [];
                return (
                  <div
                    key={pet.id}
                    className="rounded-2xl border overflow-hidden"
                    style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                  >
                    {/* Pet header */}
                    <div className="flex items-center gap-3 p-4 pb-3">
                      {pet.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pet.photo_url} alt={pet.name} className="h-12 w-12 rounded-full object-cover shrink-0" />
                      ) : (
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl"
                          style={{ background: "#fff7ed" }}
                        >
                          {speciesEmoji(pet.species)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{pet.name}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          {pet.breed || pet.species}
                        </p>
                      </div>
                      <Link
                        href={`/sanatate/${pet.id}`}
                        className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark transition-colors shrink-0"
                      >
                        Dosar complet →
                      </Link>
                    </div>

                    {/* Quick action pills */}
                    <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
                      {[
                        { href: `/sanatate/${pet.id}?tab=vaccinations`, label: "💉 Vaccinări" },
                        { href: `/sanatate/${pet.id}?tab=treatments`, label: "💊 Tratamente" },
                        { href: `/sanatate/${pet.id}?tab=weight`, label: "⚖️ Greutate" },
                        { href: `/sanatate/${pet.id}/adauga`, label: "+ Adaugă" },
                      ].map((a) => (
                        <Link
                          key={a.href}
                          href={a.href}
                          className="shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                          style={{ borderColor: "var(--card-border)", color: "var(--muted)", background: "var(--surface)" }}
                        >
                          {a.label}
                        </Link>
                      ))}
                    </div>

                    {/* Recent records */}
                    {recent.length > 0 && (
                      <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: "var(--card-border)" }}>
                        {recent.map((r) => {
                          const tc = TYPE_COLORS[r.type] ?? TYPE_COLORS.other;
                          return (
                            <div key={r.id} className="flex items-center gap-3">
                              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: tc.dot }} />
                              <p className="flex-1 text-xs truncate" style={{ color: "var(--foreground)" }}>
                                {r.title}
                              </p>
                              <span className="text-[10px] shrink-0" style={{ color: "var(--muted)" }}>
                                {new Date(r.record_date).toLocaleDateString("ro-RO")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {recent.length === 0 && (
                      <div className="border-t px-4 py-4 text-center" style={{ borderColor: "var(--card-border)" }}>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          Nicio înregistrare.{" "}
                          <Link href={`/sanatate/${pet.id}/adauga`} className="text-primary hover:underline">
                            Adaugă prima →
                          </Link>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <div
            className="rounded-2xl border-2 border-dashed p-12 text-center"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
          >
            <div className="text-5xl mb-4">🏥</div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>
              Niciun animal înregistrat
            </h2>
            <Link
              href="/animale/adauga"
              className="inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white"
            >
              + Adaugă animal
            </Link>
          </div>
        )}
      </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
