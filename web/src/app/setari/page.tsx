import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import { updateProfile, updatePassword } from "@/app/profil/actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Setări cont" };

export default async function SetariPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, bio, avatar_url, role")
    .eq("id", user.id)
    .single();

  const fullName = profile?.full_name ?? user.user_metadata?.full_name ?? "";
  const username = profile?.username ?? "";
  const bio = profile?.bio ?? "";

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 pb-24 md:pb-8">
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>Setări cont</h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Gestionează profilul și preferințele tale.</p>

          {/* Profile info */}
          <section className="rounded-2xl border p-5 mb-4" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
            <h2 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Informații profil</h2>
            <form action={updateProfile} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Nume complet</label>
                <input
                  name="full_name"
                  defaultValue={fullName}
                  maxLength={80}
                  className="w-full rounded-xl border px-3 py-2 text-sm bg-transparent"
                  style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Nume utilizator</label>
                <input
                  name="username"
                  defaultValue={username}
                  maxLength={30}
                  className="w-full rounded-xl border px-3 py-2 text-sm bg-transparent"
                  style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Bio</label>
                <textarea
                  name="bio"
                  defaultValue={bio}
                  rows={3}
                  maxLength={300}
                  className="w-full rounded-xl border px-3 py-2 text-sm bg-transparent resize-none"
                  style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                />
              </div>
              <button
                type="submit"
                className="self-start rounded-full px-5 py-2 text-sm font-semibold text-white"
                style={{ background: "var(--primary)" }}
              >
                Salvează
              </button>
            </form>
          </section>

          {/* Email (read-only) */}
          <section className="rounded-2xl border p-5 mb-4" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
            <h2 className="font-semibold mb-3" style={{ color: "var(--foreground)" }}>Email</h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{user.email}</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Adresa de email nu poate fi schimbată din această pagină.</p>
          </section>

          {/* Password change */}
          <section className="rounded-2xl border p-5 mb-4" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
            <h2 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Schimbă parola</h2>
            <form action={updatePassword} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Parolă nouă</label>
                <input
                  type="password"
                  name="password"
                  minLength={8}
                  placeholder="Minim 8 caractere"
                  className="w-full rounded-xl border px-3 py-2 text-sm bg-transparent"
                  style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Confirmă parola nouă</label>
                <input
                  type="password"
                  name="password_confirm"
                  placeholder="Repetă parola"
                  className="w-full rounded-xl border px-3 py-2 text-sm bg-transparent"
                  style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                />
              </div>
              <button
                type="submit"
                className="self-start rounded-full px-5 py-2 text-sm font-semibold text-white"
                style={{ background: "var(--primary)" }}
              >
                Actualizează parola
              </button>
            </form>
          </section>

          {/* Notifications */}
          <section className="rounded-2xl border p-5 mb-4" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
            <h2 className="font-semibold mb-3" style={{ color: "var(--foreground)" }}>Notificări</h2>
            <div className="flex flex-col gap-3">
              {[
                { label: "Notificări email", desc: "Primești emailuri despre activitate importantă" },
                { label: "Mementouri programări", desc: "Reamintire cu 24h înainte de programare" },
                { label: "Actualizări comunitate", desc: "Activitate din grupurile tale" },
              ].map((n) => (
                <label key={n.label} className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{n.label}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{n.desc}</p>
                  </div>
                  <div className="relative">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-10 h-6 rounded-full bg-gray-300 peer-checked:bg-primary transition-colors" />
                    <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Danger zone */}
          <section className="rounded-2xl border border-red-200 p-5" style={{ background: "var(--card-bg)" }}>
            <h2 className="font-semibold mb-3 text-red-500">Zonă periculoasă</h2>
            <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
              Ștergerea contului este ireversibilă. Toate datele vor fi eliminate permanent.
            </p>
            <button
              type="button"
              className="rounded-full border border-red-400 px-5 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
            >
              Șterge contul
            </button>
          </section>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
