import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Dosar medical — PetCare",
};

const TYPE_LABELS: Record<string, string> = {
  vaccination: "Vaccinare",
  treatment: "Tratament",
  surgery: "Operație",
  checkup: "Control",
  allergy: "Alergie",
  other: "Altele",
};

const TYPE_ICONS: Record<string, string> = {
  vaccination: "💉",
  treatment: "💊",
  surgery: "🔪",
  checkup: "🩺",
  allergy: "⚠️",
  other: "📋",
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  vaccination: { bg: "color-mix(in srgb, #16a34a 12%, transparent)", text: "#16a34a" },
  treatment: { bg: "color-mix(in srgb, #3b82f6 12%, transparent)", text: "#2563eb" },
  surgery: { bg: "color-mix(in srgb, #ef4444 12%, transparent)", text: "#ef4444" },
  checkup: { bg: "color-mix(in srgb, var(--primary) 12%, transparent)", text: "var(--primary)" },
  allergy: { bg: "color-mix(in srgb, #f59e0b 12%, transparent)", text: "#d97706" },
  other: { bg: "color-mix(in srgb, #6b7280 12%, transparent)", text: "#6b7280" },
};

const TABS = [
  { key: "all", label: "Toate" },
  { key: "vaccination", label: "Vaccinări" },
  { key: "treatment", label: "Tratamente" },
  { key: "checkup", label: "Controale" },
];

function speciesEmoji(s: string): string {
  if (s === "Câine" || s === "dog") return "🐶";
  if (s === "Pisică" || s === "cat") return "🐱";
  if (s === "Iepure" || s === "rabbit") return "🐰";
  return "🐾";
}

function ageLabel(birthDate: string | null): string {
  if (!birthDate) return "";
  const months = Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 24) return `${months} luni`;
  return `${Math.floor(months / 12)} ani`;
}

export default async function PetHealthPage({
  params,
  searchParams,
}: {
  params: Promise<{ petId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { petId } = await params;
  const { tab } = await searchParams;
  const activeTab = tab ?? "all";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pet } = await supabase
    .from("pets")
    .select("id, name, species, breed, photo_url, birth_date, gender")
    .eq("id", petId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!pet) notFound();

  let recordQuery = supabase
    .from("medical_records")
    .select("id, type, title, record_date, next_due_date, notes, attachment_url, created_by")
    .eq("pet_id", petId)
    .order("record_date", { ascending: false });

  if (activeTab !== "all") {
    recordQuery = recordQuery.eq("type", activeTab);
  }

  const { data: records } = await recordQuery;

  // Weight logs (last 6)
  const { data: weightLogs } = await supabase
    .from("weight_logs")
    .select("id, weight_kg, logged_at")
    .eq("pet_id", petId)
    .order("logged_at", { ascending: false })
    .limit(6);

  const latestWeight = weightLogs?.[0];

  function buildTabHref(t: string) {
    return t === "all" ? `/sanatate/${petId}` : `/sanatate/${petId}?tab=${t}`;
  }

  return (
    <>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <Link href="/sanatate" className="rounded-full p-2 hover:bg-card-bg transition-colors" style={{ color: "var(--muted)" }}>
            ← Înapoi
          </Link>
          <div className="flex-1" />
          <Link
            href={`/sanatate/${petId}/adauga`}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            + Adaugă
          </Link>
        </div>

        {/* Pet card */}
        <div
          className="mb-6 rounded-2xl border overflow-hidden"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          {/* Cover */}
          <div
            className="flex h-32 items-center justify-center relative"
            style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fde8d0 100%)" }}
          >
            {pet.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pet.photo_url} alt={pet.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-7xl">{speciesEmoji(pet.species)}</span>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{pet.name}</h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                  {pet.breed || pet.species}
                  {pet.gender ? ` · ${pet.gender === "female" ? "Femelă" : "Mascul"}` : ""}
                  {pet.birth_date ? ` · ${ageLabel(pet.birth_date)}` : ""}
                </p>
              </div>
              <Link
                href={`/animale/${petId}`}
                className="rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
              >
                Profil complet →
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl border p-2 text-center" style={{ borderColor: "var(--card-border)" }}>
                <div className="text-base font-bold" style={{ color: "var(--primary)" }}>
                  {records?.filter((r) => r.type === "vaccination").length ?? 0}
                </div>
                <div className="text-[10px]" style={{ color: "var(--muted)" }}>Vaccinări</div>
              </div>
              <div className="rounded-xl border p-2 text-center" style={{ borderColor: "var(--card-border)" }}>
                <div className="text-base font-bold" style={{ color: "var(--primary)" }}>
                  {records?.length ?? 0}
                </div>
                <div className="text-[10px]" style={{ color: "var(--muted)" }}>Total intrări</div>
              </div>
              <div className="rounded-xl border p-2 text-center" style={{ borderColor: "var(--card-border)" }}>
                <div className="text-base font-bold" style={{ color: "var(--primary)" }}>
                  {latestWeight ? `${latestWeight.weight_kg} kg` : "—"}
                </div>
                <div className="text-[10px]" style={{ color: "var(--muted)" }}>Greutate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming dues */}
        {(() => {
          const upcoming = (records ?? []).filter(
            (r) => r.next_due_date && new Date(r.next_due_date) > new Date()
          );
          if (upcoming.length === 0) return null;
          return (
            <div
              className="mb-5 rounded-2xl border p-4"
              style={{
                background: "color-mix(in srgb, #f59e0b 6%, transparent)",
                borderColor: "color-mix(in srgb, #f59e0b 25%, transparent)",
              }}
            >
              <p className="text-sm font-bold mb-2" style={{ color: "#92400e" }}>
                ⏰ Scadențe apropiate
              </p>
              <div className="space-y-1.5">
                {upcoming.slice(0, 3).map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium truncate" style={{ color: "#78350f" }}>{r.title}</p>
                    <span className="text-xs shrink-0" style={{ color: "#b45309" }}>
                      {new Date(r.next_due_date!).toLocaleDateString("ro-RO")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Tabs */}
        <div
          className="flex gap-1 rounded-2xl p-1 mb-4 overflow-x-auto"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={buildTabHref(t.key)}
              className="flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: activeTab === t.key ? "var(--primary)" : "transparent",
                color: activeTab === t.key ? "#fff" : "var(--muted)",
              }}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Records list */}
        {records && records.length > 0 ? (
          <div className="space-y-3">
            {records.map((record) => {
              const tc = TYPE_COLORS[record.type] ?? TYPE_COLORS.other;
              const icon = TYPE_ICONS[record.type] ?? "📋";
              const hasDue = record.next_due_date && new Date(record.next_due_date) > new Date();
              return (
                <div
                  key={record.id}
                  className="rounded-2xl border p-4"
                  style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                      style={{ background: tc.bg }}
                    >
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                          {record.title}
                        </p>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: tc.bg, color: tc.text }}
                        >
                          {TYPE_LABELS[record.type]}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        {new Date(record.record_date).toLocaleDateString("ro-RO")}
                        {hasDue && (
                          <span style={{ color: "#d97706" }}>
                            {" · "}⏰ Next: {new Date(record.next_due_date!).toLocaleDateString("ro-RO")}
                          </span>
                        )}
                      </p>
                      {record.notes && (
                        <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: "var(--muted)" }}>
                          {record.notes}
                        </p>
                      )}
                    </div>
                    {record.attachment_url && (
                      <a
                        href={record.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg border px-2 py-1 text-xs hover:border-primary hover:text-primary transition-colors"
                        style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
                      >
                        📄
                      </a>
                    )}
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
            <div className="text-4xl mb-3">📋</div>
            <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
              Nicio înregistrare
              {activeTab !== "all" ? ` în categoria "${TYPE_LABELS[activeTab] ?? activeTab}"` : ""}
            </p>
            <Link
              href={`/sanatate/${petId}/adauga`}
              className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-xs font-bold text-white"
            >
              + Adaugă prima înregistrare
            </Link>
          </div>
        )}

        {/* Weight log section */}
        {weightLogs && weightLogs.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                Grafic greutate
              </h2>
              <Link
                href={`/sanatate/${petId}/greutate`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Adaugă →
              </Link>
            </div>
            <div
              className="rounded-2xl border p-4"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              {/* Simple bar chart */}
              <div className="flex items-end gap-2 h-24 mb-2">
                {[...weightLogs].reverse().map((log) => {
                  const max = Math.max(...weightLogs.map((l) => Number(l.weight_kg)));
                  const pct = (Number(log.weight_kg) / max) * 100;
                  return (
                    <div key={log.id} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px]" style={{ color: "var(--muted)" }}>
                        {log.weight_kg}
                      </span>
                      <div
                        className="w-full rounded-t-sm"
                        style={{
                          height: `${pct}%`,
                          minHeight: 4,
                          background: "var(--primary)",
                          opacity: 0.8,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between">
                {[...weightLogs].reverse().map((log) => (
                  <span key={log.id} className="flex-1 text-center text-[9px]" style={{ color: "var(--muted)" }}>
                    {new Date(log.logged_at).toLocaleDateString("ro-RO", { month: "short", day: "numeric" })}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Passport CTA */}
        <div
          className="mt-8 rounded-2xl border p-4 flex items-center gap-4"
          style={{
            background: "color-mix(in srgb, #0284c7 6%, transparent)",
            borderColor: "color-mix(in srgb, #0284c7 20%, transparent)",
          }}
        >
          <span className="text-3xl shrink-0">🛂</span>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
              Pașaport & Travel Pack
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Documente, microchip, vaccinare antirabică și certificat EU.
            </p>
          </div>
          <Link
            href={`/sanatate/${petId}/pasaport`}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: "#0284c7" }}
          >
            Deschide →
          </Link>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
