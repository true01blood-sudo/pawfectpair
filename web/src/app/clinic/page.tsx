import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Clinic Workspace" };

export default async function ClinicPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: vet } = await supabase
    .from("vets")
    .select("id, clinic_name, city, bio")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!vet) redirect("/veterinari/adauga");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's appointments
  const { data: todayAppts } = await supabase
    .from("vet_appointments")
    .select("id, starts_at, reason, status, pet_id, owner_id, pets(name, species, breed, birth_date, photo_url), profiles!owner_id(full_name, avatar_url)")
    .eq("vet_id", vet.id)
    .gte("starts_at", today.toISOString())
    .lt("starts_at", tomorrow.toISOString())
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true });

  // Pending requests
  const { data: pendingAppts } = await supabase
    .from("vet_appointments")
    .select("id, starts_at, reason, pet_id, pets(name, species), profiles!owner_id(full_name)")
    .eq("vet_id", vet.id)
    .eq("status", "requested")
    .order("starts_at", { ascending: true })
    .limit(5);

  // Stats
  const { count: todayCount } = await supabase
    .from("vet_appointments")
    .select("id", { count: "exact", head: true })
    .eq("vet_id", vet.id)
    .gte("starts_at", today.toISOString())
    .lt("starts_at", tomorrow.toISOString())
    .neq("status", "cancelled");

  const { count: pendingCount } = await supabase
    .from("vet_appointments")
    .select("id", { count: "exact", head: true })
    .eq("vet_id", vet.id)
    .eq("status", "requested");

  const { count: clientCount } = await supabase
    .from("vet_appointments")
    .select("owner_id", { count: "exact", head: true })
    .eq("vet_id", vet.id)
    .neq("status", "cancelled");

  const stats = [
    { value: todayCount ?? 0, label: "Appointments today", icon: "📅", color: "#16a34a" },
    { value: pendingCount ?? 0, label: "Pending requests", icon: "👥", color: "#d97706" },
    { value: clientCount ?? 0, label: "Active clients", icon: "🐾", color: "#FF6B2D" },
    { value: 0, label: "Evidence in review", icon: "📋", color: "#7c3aed" },
  ];

  type ApptRow = {
    id: string;
    starts_at: string;
    reason: string | null;
    status: string;
    pets: { name: string; species: string; breed: string | null; birth_date: string | null; photo_url: string | null } | null;
    profiles: { full_name: string | null; avatar_url: string | null } | null;
  };

  type PendingRow = {
    id: string;
    starts_at: string;
    reason: string | null;
    pets: { name: string; species: string } | null;
    profiles: { full_name: string | null } | null;
  };

  function petAge(birth_date: string | null): string {
    if (!birth_date) return "";
    const months = Math.floor((Date.now() - new Date(birth_date).getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (months < 24) return `${months} luni`;
    return `${Math.floor(months / 12)} ani`;
  }

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
  }

  function fmtDateShort(iso: string) {
    const d = new Date(iso);
    const isToday = d.toDateString() === new Date().toDateString();
    if (isToday) return `Today, ${fmtTime(iso)}`;
    return d.toLocaleDateString("ro-RO", { day: "numeric", month: "short" }) + ` ${fmtTime(iso)}`;
  }

  const statusBadge: Record<string, { label: string; bg: string; color: string }> = {
    confirmed: { label: "Checked in", bg: "#dcfce7", color: "#16a34a" },
    requested: { label: "Pending", bg: "#fef9c3", color: "#ca8a04" },
    completed: { label: "Done", bg: "#f3f4f6", color: "#6b7280" },
  };

  const nextAppt = (todayAppts as unknown as ApptRow[] | null)?.[0] ?? null;

  return (
    <div className="flex flex-1 min-h-0">
      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-8">
        {/* Hero banner */}
        <div
          className="relative h-52 w-full overflow-hidden flex items-end"
          style={{ background: "linear-gradient(135deg, #1a3318 0%, #2d5a28 60%, #4a8a3f 100%)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/pexels-veterinar.jpg"
            alt="Clinic banner"
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="relative z-10 p-6 pb-8">
            <h1 className="text-2xl font-bold text-white leading-tight">
              Compassionate care<br />for happier lives
            </h1>
            <p className="mt-1 text-sm text-white/80">Preventive care, expert treatment and a personal touch.</p>
            <div className="mt-4 flex gap-3">
              <Link
                href="/clinic/cereri"
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
                style={{ background: "var(--primary)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                </svg>
                New appointment
              </Link>
              <Link
                href="/clinic/clienti"
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border border-white/40 text-white hover:bg-white/10 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Add client
              </Link>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border p-4"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{s.icon}</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Today's schedule */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)" }}>
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Today</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {new Date().toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" })}
                </span>
              </div>
              <Link href="/clinic/program" className="text-xs font-semibold hover:underline" style={{ color: "var(--primary)" }}>
                View week →
              </Link>
            </div>

            <div
              className="rounded-2xl border divide-y overflow-hidden"
              style={{ borderColor: "var(--card-border)" }}
            >
              {(todayAppts as unknown as ApptRow[] | null)?.length ? (
                (todayAppts as unknown as ApptRow[]).map((a) => {
                  const badge = statusBadge[a.status] ?? statusBadge.requested;
                  const pet = Array.isArray(a.pets) ? a.pets[0] : a.pets;
                  const owner = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 px-4 py-3"
                      style={{ background: "var(--card-bg)" }}
                    >
                      <div className="w-12 text-center shrink-0">
                        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{fmtTime(a.starts_at)}</p>
                        <p className="text-[10px]" style={{ color: "var(--muted)" }}>30 min</p>
                      </div>
                      <div
                        className="h-9 w-9 rounded-full flex items-center justify-center text-lg shrink-0"
                        style={{ background: "#e8f4ea" }}
                      >
                        {pet?.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={pet.photo_url} alt={pet.name} className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          pet?.species === "Pisică" ? "🐱" : "🐶"
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{pet?.name ?? "—"}</p>
                        <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                          {pet?.breed ? `${pet.breed}${pet.birth_date ? ` · ${petAge(pet.birth_date)}` : ""}` : pet?.species}
                        </p>
                        {a.reason && (
                          <span className="inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px]" style={{ background: "var(--surface)", color: "var(--muted)" }}>
                            {a.reason}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {owner?.full_name && (
                          <div className="hidden sm:flex items-center gap-1.5">
                            <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "var(--primary)" }}>
                              {owner.full_name.charAt(0)}
                            </div>
                            <span className="text-xs" style={{ color: "var(--muted)" }}>{owner.full_name}</span>
                          </div>
                        )}
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: badge.bg, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--muted)" }}>
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center" style={{ background: "var(--card-bg)" }}>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>Nicio programare astăzi</p>
                  <Link href="/clinic/cereri" className="mt-2 inline-block text-xs font-semibold hover:underline" style={{ color: "var(--primary)" }}>
                    Vezi cereri →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Pending requests */}
          {(pendingAppts as unknown as PendingRow[] | null)?.length ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                  Pending requests
                  <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: "var(--primary)" }}>
                    {(pendingAppts as unknown as PendingRow[]).length}
                  </span>
                </span>
                <Link href="/clinic/cereri" className="text-xs font-semibold hover:underline" style={{ color: "var(--primary)" }}>
                  View all →
                </Link>
              </div>
              <div
                className="rounded-2xl border overflow-hidden"
                style={{ borderColor: "var(--card-border)" }}
              >
                {(pendingAppts as unknown as PendingRow[]).map((a) => {
                  const pet = Array.isArray(a.pets) ? a.pets[0] : a.pets;
                  const owner = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
                  return (
                    <div key={a.id} className="flex items-center gap-3 px-4 py-3" style={{ background: "var(--card-bg)" }}>
                      <div className="h-9 w-9 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background: "#e8f4ea" }}>
                        {pet?.species === "Pisică" ? "🐱" : "🐶"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{pet?.name ?? owner?.full_name ?? "—"}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          {a.reason ?? "Consultație"} · {fmtDateShort(a.starts_at)}
                        </p>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--muted)" }}>
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Right panel — Next patient */}
      {nextAppt && (() => {
        const pet = Array.isArray(nextAppt.pets) ? nextAppt.pets[0] : nextAppt.pets;
        const owner = Array.isArray(nextAppt.profiles) ? nextAppt.profiles[0] : nextAppt.profiles;
        return (
          <aside
            className="hidden xl:flex xl:flex-col w-72 shrink-0 border-l overflow-y-auto p-4"
            style={{ borderColor: "var(--card-border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Next patient</p>
              <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: "var(--primary)" }}>
                {fmtTime(nextAppt.starts_at)}
              </span>
            </div>

            <div
              className="rounded-2xl overflow-hidden mb-3"
              style={{ background: "linear-gradient(135deg, #e8f4ea 0%, #c4d9bc 100%)" }}
            >
              <div className="aspect-[4/3] flex items-center justify-center text-6xl">
                {pet?.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  pet?.species === "Pisică" ? "🐱" : "🐶"
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold" style={{ color: "var(--foreground)" }}>{pet?.name ?? "—"}</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {pet?.breed ?? pet?.species}
                {pet?.birth_date ? ` · ${petAge(pet.birth_date)}` : ""}
              </p>

              {nextAppt.reason && (
                <div className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--muted)" }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span className="text-sm" style={{ color: "var(--foreground)" }}>{nextAppt.reason}</span>
                </div>
              )}

              {owner?.full_name && (
                <div className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--muted)" }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span className="text-sm" style={{ color: "var(--foreground)" }}>{owner.full_name}</span>
                </div>
              )}
            </div>

            <Link
              href={`/clinic/clienti`}
              className="mt-4 w-full rounded-full py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--primary)" }}
            >
              View full record
            </Link>
          </aside>
        );
      })()}
    </div>
  );
}
