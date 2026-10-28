import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";

export default async function NotificariPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
          <h1 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>Notificări</h1>
          <div className="space-y-3">
            {[
              { icon: "🩺", title: "Programare confirmată", desc: "Vizita cu Dr. Ionescu a fost confirmată pentru mâine la 14:00", time: "acum 2 ore", read: false },
              { icon: "💉", title: "Reminder vaccinare", desc: "Vaccinul antirabic al lui Max expiră în 12 zile", time: "ieri", read: false },
              { icon: "🐾", title: "Cerere adopție", desc: "Cineva a trimis o cerere pentru animalul tău", time: "2 zile", read: true },
              { icon: "🔔", title: "Eveniment în zona ta", desc: "Plimbare câini în Parcul Cișmigiu — Sâmbătă, 10:00", time: "3 zile", read: true },
            ].map((n, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-2xl border p-4"
                style={{
                  background: n.read ? "var(--card-bg)" : "color-mix(in srgb, var(--primary) 6%, var(--card-bg))",
                  borderColor: n.read ? "var(--card-border)" : "color-mix(in srgb, var(--primary) 25%, transparent)",
                }}
              >
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-xl shrink-0"
                  style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)" }}>
                  {n.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{n.title}</p>
                    <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>{n.time}</span>
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>{n.desc}</p>
                </div>
                {!n.read && (
                  <div className="h-2 w-2 rounded-full mt-2 shrink-0" style={{ background: "var(--primary)" }} />
                )}
              </div>
            ))}
          </div>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
