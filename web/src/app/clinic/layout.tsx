import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ClinicSidebar from "@/components/ClinicSidebar";
import AppHeader from "@/components/AppHeader";

export default async function ClinicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "";
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: vet } = await supabase
    .from("vets")
    .select("id, clinic_name, city")
    .eq("user_id", user.id)
    .maybeSingle();

  let pendingCount = 0;
  if (vet) {
    const { count } = await supabase
      .from("vet_appointments")
      .select("id", { count: "exact", head: true })
      .eq("vet_id", vet.id)
      .eq("status", "requested");
    pendingCount = count ?? 0;
  }

  // If no vet profile, show registration prompt
  if (!vet) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <AppHeader userName={userName} avatarUrl={avatarUrl} isAdmin={profile?.role === "admin"} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>Workspace profesional</h1>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
              Înregistrează-ți clinica sau cabinetul veterinar pentru a accesa workspace-ul profesional cu gestionarea programărilor, clienților și evidențelor.
            </p>
            <Link
              href="/veterinari/adauga"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white"
              style={{ background: "var(--primary)" }}
            >
              Înregistrează clinica
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AppHeader userName={userName} avatarUrl={avatarUrl} isAdmin={profile?.role === "admin"} clinicName={vet.clinic_name} />
      <div className="flex-1 flex overflow-hidden min-h-0">
        <ClinicSidebar vetId={vet.id} pendingCount={pendingCount} />
        <div className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
