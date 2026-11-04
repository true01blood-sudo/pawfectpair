import { requireFullAdmin, STAFF_ASSIGNABLE_MODULES } from "@/lib/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import Breadcrumb from "@/components/Breadcrumb";
import { changeRole, banUser, verifyUser, removeUserContent } from "./actions";

// Email-ul nu există pe public.profiles (doar pe auth.users) — citit o
// singură dată prin clientul de service_role, separat de RLS-ul normal.
// "doar în admin": nicio altă pagină din aplicație nu face acest query.
async function fetchEmailsById(): Promise<Record<string, string> | null> {
  try {
    const admin = createAdminClient();
    const emails: Record<string, string> = {};
    let page = 1;
    for (;;) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      for (const u of data.users) {
        if (u.email) emails[u.id] = u.email;
      }
      if (data.users.length < 1000) break;
      page += 1;
    }
    return emails;
  } catch {
    return null; // SUPABASE_SERVICE_ROLE_KEY lipsă sau eroare — afișăm lista fără email în loc să stricăm pagina
  }
}

const roleLabels: Record<string, string> = {
  user: "Utilizator",
  admin: "Admin",
  vet: "Veterinar",
  shop: "Magazin",
  shelter: "Centru/Asociație",
  pensiune: "Pensiune/Hotel",
  trainer: "Trainer",
  staff: "Staff (acces parțial admin)",
};

export default async function AdminUtilizatoriPage() {
  const { supabase, user } = await requireFullAdmin();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role, admin_modules, created_at, is_banned, is_verified")
    .order("created_at", { ascending: false });
  // is_banned / is_verified added by migration 0039 — safe: null if not yet applied

  const emailsById = await fetchEmailsById();
  const emailCounts: Record<string, number> = {};
  if (emailsById) {
    for (const email of Object.values(emailsById)) {
      emailCounts[email] = (emailCounts[email] ?? 0) + 1;
    }
  }

  const total = profiles?.length ?? 0;
  const banned = profiles?.filter((p) => p.is_banned).length ?? 0;
  const verified = profiles?.filter((p) => p.is_verified).length ?? 0;

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ href: "/admin", label: "Admin" }, { label: "Utilizatori" }]} />
      <h1 className="text-xl font-bold sm:text-2xl">Gestionare utilizatori</h1>

      <div className="mt-3 flex flex-wrap gap-3">
        <div className="rounded-xl border px-4 py-2 text-center" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <p className="text-xl font-bold text-primary">{total}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Total</p>
        </div>
        <div className="rounded-xl border px-4 py-2 text-center" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <p className="text-xl font-bold" style={{ color: "#10b981" }}>{verified}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Verificați</p>
        </div>
        <div className="rounded-xl border px-4 py-2 text-center" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <p className="text-xl font-bold" style={{ color: "#ef4444" }}>{banned}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Banați</p>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {profiles?.map((p) => (
          <li
            key={p.id}
            className="rounded-xl border p-3 text-sm shadow-sm"
            style={{
              borderColor: p.is_banned ? "#ef444430" : "var(--card-border)",
              background: p.is_banned ? "#ef444408" : "var(--card-bg)",
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{p.full_name || "(fără nume)"}</p>
                  {p.is_verified && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      ✓ Verificat
                    </span>
                  )}
                  {p.is_banned && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      Banat
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                  {roleLabels[p.role] ?? p.role} · din {new Date(p.created_at).toLocaleDateString("ro-RO")}
                  {p.role === "staff" && (p.admin_modules?.length ?? 0) > 0 && (
                    <> — module: {p.admin_modules!.join(", ")}</>
                  )}
                </p>
                {emailsById ? (
                  emailsById[p.id] ? (
                    <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                      {emailsById[p.id]}
                      {emailCounts[emailsById[p.id]] > 1 && (
                        <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                          ⚠ email duplicat
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs italic" style={{ color: "var(--muted)" }}>fără email (cont OAuth/telefon)</p>
                  )
                ) : (
                  <p className="mt-0.5 text-xs italic" style={{ color: "var(--muted)" }}>
                    email indisponibil — configurează SUPABASE_SERVICE_ROLE_KEY
                  </p>
                )}
              </div>

              {p.id !== user.id && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Role change + module access (pentru staff) */}
                  <form action={changeRole.bind(null, p.id)} className="flex flex-wrap items-center gap-1">
                    <select name="role" defaultValue={p.role}
                      className="min-h-9 rounded-lg border px-2 text-xs"
                      style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}>
                      <option value="user">Utilizator</option>
                      <option value="admin">Admin</option>
                      <option value="vet">Veterinar</option>
                      <option value="shop">Magazin</option>
                      <option value="shelter">Centru/Asociație</option>
                      <option value="pensiune">Pensiune/Hotel</option>
                      <option value="trainer">Trainer</option>
                      <option value="staff">Staff (acces parțial admin)</option>
                    </select>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]" style={{ color: "var(--muted)" }}>
                      {STAFF_ASSIGNABLE_MODULES.map((m) => (
                        <label key={m.key} className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            name="admin_modules"
                            value={m.key}
                            defaultChecked={p.admin_modules?.includes(m.key)}
                          />
                          {m.icon} {m.label}
                        </label>
                      ))}
                    </div>
                    <button className="min-h-9 rounded-full border px-3 text-xs"
                      style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}>
                      Salvează rol
                    </button>
                  </form>

                  {/* Verify toggle */}
                  <form action={verifyUser.bind(null, p.id, !p.is_verified)}>
                    <button
                      className="min-h-9 rounded-full border px-3 text-xs"
                      style={{
                        borderColor: p.is_verified ? "#10b981" : "var(--card-border)",
                        color: p.is_verified ? "#10b981" : "var(--muted)",
                      }}
                    >
                      {p.is_verified ? "✓ Verificat" : "Verifică"}
                    </button>
                  </form>

                  {/* Ban toggle */}
                  <form action={banUser.bind(null, p.id, !p.is_banned)}>
                    <button
                      className="min-h-9 rounded-full border px-3 text-xs"
                      style={{
                        borderColor: p.is_banned ? "#ef4444" : "var(--card-border)",
                        color: p.is_banned ? "#ef4444" : "var(--muted)",
                      }}
                    >
                      {p.is_banned ? "Deban" : "Ban"}
                    </button>
                  </form>

                  {/* Remove content */}
                  <form action={removeUserContent.bind(null, p.id)}>
                    <button className="min-h-9 rounded-full border border-red-200 px-3 text-xs text-red-500 hover:border-red-400">
                      Șterge conținut
                    </button>
                  </form>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
