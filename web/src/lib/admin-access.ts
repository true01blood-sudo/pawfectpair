import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";

export type AdminModuleKey =
  | "utilizatori"
  | "continut"
  | "produse"
  | "comenzi"
  | "dovezi"
  | "veterinari"
  | "antrenament"
  | "cercuri"
  | "pensiuni"
  | "evenimente"
  | "plati"
  | "setari";

export const ADMIN_MODULES: { key: AdminModuleKey; href: string; label: string; icon: string }[] = [
  { key: "utilizatori", href: "/admin/utilizatori", label: "Utilizatori", icon: "👥" },
  { key: "continut", href: "/admin/continut", label: "Moderare", icon: "🛡️" },
  { key: "produse", href: "/admin/produse", label: "Produse", icon: "📦" },
  { key: "comenzi", href: "/admin/comenzi", label: "Comenzi", icon: "🛒" },
  { key: "dovezi", href: "/admin/dovezi", label: "Dovezi", icon: "📋" },
  { key: "veterinari", href: "/admin/veterinari", label: "Veterinari", icon: "🏥" },
  { key: "antrenament", href: "/admin/antrenament", label: "Antrenament", icon: "🎓" },
  { key: "cercuri", href: "/admin/cercuri", label: "Cercuri", icon: "🧑‍🤝‍🧑" },
  { key: "pensiuni", href: "/admin/pensiuni", label: "Pensiuni", icon: "🏠" },
  { key: "evenimente", href: "/admin/evenimente", label: "Evenimente", icon: "📅" },
  { key: "plati", href: "/admin/plati", label: "Plăți", icon: "💳" },
  { key: "setari", href: "/admin/setari", label: "Setări", icon: "⚙️" },
];

type AdminProfile = { role: string; admin_modules: string[] | null };

/**
 * Doar 'admin' are acces necondiționat la tot. Un cont 'staff' intră
 * doar dacă moduleKey e în admin_modules — orice alt rol e respins.
 */
export async function requireAdminModule(moduleKey: AdminModuleKey) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, admin_modules")
    .eq("id", user.id)
    .single<AdminProfile>();

  const isFullAdmin = profile?.role === "admin";
  const isAuthorizedStaff = profile?.role === "staff" && (profile.admin_modules ?? []).includes(moduleKey);
  if (!isFullAdmin && !isAuthorizedStaff) redirect("/");

  return { supabase, user, profile: profile!, isFullAdmin };
}

/** Module delegabile unui cont 'staff'. "utilizatori" exclus intenționat —
 * schimbarea rolurilor (inclusiv promovare la 'admin') ar fi o cale de
 * escaladare a privilegiilor dacă ar fi delegabilă unui staff. */
export const STAFF_ASSIGNABLE_MODULES = ADMIN_MODULES.filter((m) => m.key !== "utilizatori");

/** Pagini sensibile (management roluri) — strict 'admin', niciodată staff. */
export async function requireFullAdmin() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");
  return { supabase, user };
}

/** Pentru layout/dashboard: orice admin, sau staff cu cel puțin un modul permis. */
export async function requireAdminPanelAccess() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, admin_modules")
    .eq("id", user.id)
    .single<AdminProfile>();

  const isFullAdmin = profile?.role === "admin";
  const allowedModules = profile?.role === "staff" ? (profile.admin_modules ?? []) : [];
  if (!isFullAdmin && allowedModules.length === 0) redirect("/");

  return { supabase, user, profile: profile!, isFullAdmin, allowedModules };
}
