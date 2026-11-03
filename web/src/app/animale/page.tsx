import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import { completeTask } from "../planificator/actions";

export const metadata: Metadata = {
  title: "Animalele mele — PetCare",
  description: "Gestionează profilurile animalelor tale de companie.",
};

function ageString(birthDate: string | null): string {
  if (!birthDate) return "";
  const diff = Date.now() - new Date(birthDate).getTime();
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
  if (years > 0) return `${years} an${years > 1 ? "i" : ""} ${months > 0 ? `${months} lun${months > 1 ? "i" : "ă"}` : ""}`.trim();
  return `${months} lun${months > 1 ? "i" : "ă"}`;
}

const SPECIES_EMOJI: Record<string, string> = {
  dog: "🐕", cat: "🐈", bird: "🐦", rabbit: "🐇", hamster: "🐹",
  fish: "🐠", turtle: "🐢", other: "🐾",
};

const CATEGORY_EMOJI: Record<string, string> = {
  feeding: "🍽️", walk: "🐕", grooming: "✂️", medication: "💊", other: "📋",
};

export default async function AnimelePage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string }>;
}) {
  const { pet: petParam } = await searchParams;
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/login");

  const { data: pets } = await supabase
    .from("pets")
    .select("id, name, species, breed, birth_date, photo_url, sex")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (!pets || pets.length === 0) {
    return (
      <>
        <AppShell>
          <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
            <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--foreground)" }}>Animalele mele</h1>
            <div className="rounded-2xl border-2 border-dashed p-16 text-center" style={{ borderColor: "var(--card-border)" }}>
              <div className="text-6xl mb-4">🐾</div>
              <p className="font-bold text-lg" style={{ color: "var(--foreground)" }}>Niciun animal adăugat</p>
              <p className="text-sm mt-2 mb-6" style={{ color: "var(--muted)" }}>
                Adaugă primul tău animal de companie pentru a-i gestiona sănătatea, programările și mai mult.
              </p>
              <Link href="/animale/adauga" className="inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark transition-colors">
                Adaugă primul animal
              </Link>
            </div>
          </main>
        </AppShell>
        <BottomNav />
      </>
    );
  }

  const selectedPet = pets.find((p) => p.id === petParam) ?? pets[0];
  const emoji = SPECIES_EMOJI[selectedPet.species as string] ?? "🐾";

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const [
    { data: todayTasks },
    { data: nextAppt },
    { count: healthRecordsCount },
    { data: medicationTasks },
    { data: feedingTasks },
    { data: insurancePolicy },
    { data: gpsPing },
  ] = await Promise.all([
    supabase.from("planner_tasks").select("id, title, category, due_at, done")
      .eq("pet_id", selectedPet.id)
      .gte("due_at", startOfDay.toISOString()).lt("due_at", endOfDay.toISOString())
      .order("due_at", { ascending: true }),
    supabase.from("vet_appointments").select("id, starts_at, reason, vets(clinic_name)")
      .eq("pet_id", selectedPet.id)
      .in("status", ["requested", "confirmed"])
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("medical_records").select("id", { count: "exact", head: true }).eq("pet_id", selectedPet.id),
    supabase.from("planner_tasks").select("id").eq("pet_id", selectedPet.id).eq("category", "medication").eq("done", false),
    supabase.from("planner_tasks").select("id").eq("pet_id", selectedPet.id).eq("category", "feeding").limit(1),
    supabase.from("insurance_policies").select("id").eq("pet_id", selectedPet.id).eq("status", "active").limit(1).maybeSingle(),
    supabase.from("guardian_pings").select("id").eq("pet_id", selectedPet.id).order("recorded_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const doneCount = (todayTasks ?? []).filter((t) => t.done).length;
  const totalCount = (todayTasks ?? []).length;
  const appt = nextAppt as unknown as { id: string; starts_at: string; reason: string | null; vets: { clinic_name: string } | null } | null;

  const quickLinks = [
    { emoji: "📋", label: "Dosar medical", value: `${healthRecordsCount ?? 0} înregistrări`, href: `/sanatate/${selectedPet.id}` },
    { emoji: "💊", label: "Medicație", value: `${medicationTasks?.length ?? 0} active`, href: "/planificator" },
    { emoji: "🍽️", label: "Nutriție", value: feedingTasks && feedingTasks.length > 0 ? "Plan personalizat" : "Fără plan", href: "/planificator" },
    { emoji: "🛡️", label: "Asigurare", value: insurancePolicy ? "Activă" : "Fără poliță", href: "/asigurare" },
    { emoji: "📍", label: "GPS", value: gpsPing ? "Urmărire activă" : "Neconfigurat", href: `/gps?petId=${selectedPet.id}` },
  ];

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Animalele mele</h1>
            <Link
              href="/animale/adauga"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white text-xl font-bold hover:bg-primary-dark transition-colors"
              aria-label="Adaugă animal"
            >
              +
            </Link>
          </div>

          {/* Pet selector strip */}
          <div className="flex gap-3 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
            {pets.map((p) => (
              <Link key={p.id} href={`/animale?pet=${p.id}`} className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  className="relative h-16 w-16 rounded-full overflow-hidden flex items-center justify-center"
                  style={{
                    background: "color-mix(in srgb, var(--primary) 8%, transparent)",
                    border: p.id === selectedPet.id ? "3px solid var(--primary)" : "3px solid transparent",
                  }}
                >
                  {p.photo_url ? (
                    <Image src={p.photo_url} alt={p.name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <span className="text-2xl">{SPECIES_EMOJI[p.species as string] ?? "🐾"}</span>
                  )}
                </div>
                <span className="text-xs font-semibold max-w-16 truncate" style={{ color: p.id === selectedPet.id ? "var(--foreground)" : "var(--muted)" }}>
                  {p.name}
                </span>
              </Link>
            ))}
          </div>

          {/* Hero card */}
          <div className="relative rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: "16/10", background: "linear-gradient(135deg, #fff7ed 0%, #fde8d0 100%)" }}>
            {selectedPet.photo_url ? (
              <Image src={selectedPet.photo_url} alt={selectedPet.name} fill className="object-cover" sizes="(max-width: 672px) 100vw, 672px" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-8xl">{emoji}</div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
              <p className="text-xl font-bold text-white">{selectedPet.name}</p>
              <p className="text-sm text-white/85">{[selectedPet.breed, ageString(selectedPet.birth_date)].filter(Boolean).join(" · ")}</p>
            </div>
            <Link
              href={`/animale/${selectedPet.id}`}
              className="absolute bottom-3 right-3 h-9 w-9 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition-colors"
              aria-label="Editează profilul"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </Link>
          </div>

          {/* Next appointment */}
          <Link
            href="/programari"
            className="mb-5 flex items-center gap-3 rounded-2xl p-4 transition-opacity hover:opacity-90"
            style={{ background: "color-mix(in srgb, var(--primary) 8%, transparent)" }}
          >
            <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center" style={{ background: "var(--card-bg)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              {appt ? (
                <>
                  <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>Următoarea programare</p>
                  <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{appt.reason ?? "Consultație"}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {new Date(appt.starts_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {appt.vets ? ` · ${appt.vets.clinic_name}` : ""}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Nicio programare viitoare</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Programează o vizită la veterinar</p>
                </>
              )}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>

          {/* Today's tasks */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Sarcini de azi</p>
              {totalCount > 0 && (
                <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>{doneCount} din {totalCount} făcute</span>
              )}
            </div>
            {totalCount > 0 ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(todayTasks ?? []).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 rounded-xl border p-3"
                    style={{ borderColor: "var(--card-border)", background: task.done ? "color-mix(in srgb, #16a34a 6%, transparent)" : "var(--card-bg)" }}
                  >
                    {task.done ? (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white text-xs" style={{ background: "#16a34a" }}>✓</span>
                    ) : (
                      <form action={completeTask.bind(null, task.id)}>
                        <button type="submit" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2" style={{ borderColor: "var(--card-border)" }} aria-label="Marchează ca făcută" />
                      </form>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--foreground)" }}>{CATEGORY_EMOJI[task.category] ?? "📋"} {task.title}</p>
                      <p className="text-[11px]" style={{ color: task.done ? "#16a34a" : "var(--muted)" }}>
                        {task.done ? "Făcut" : `Scadent ${new Date(task.due_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--muted)" }}>Nicio sarcină programată azi pentru {selectedPet.name}.</p>
            )}
          </div>

          {/* Quick-link rows */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
            {quickLinks.map((q, i) => (
              <Link
                key={q.label}
                href={q.href}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-black/[0.02]"
                style={{ borderTop: i > 0 ? "1px solid var(--card-border)" : undefined }}
              >
                <span className="text-lg shrink-0">{q.emoji}</span>
                <span className="flex-1 text-sm font-medium" style={{ color: "var(--foreground)" }}>{q.label}</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>{q.value}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ))}
          </div>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
