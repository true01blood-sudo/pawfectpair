import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";

export default async function MesajePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
          <h1 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>Mesaje</h1>
          <div className="space-y-2">
            {[
              { name: "Dr. Ionescu", avatar: "🩺", last: "Programarea dvs. este confirmată pentru mâine.", time: "14:32", unread: 1 },
              { name: "Maria P.", avatar: "🐾", last: "Mulțumesc pentru sfaturi! Luna s-a refăcut bine.", time: "ieri", unread: 0 },
              { name: "PetMarket", avatar: "🛒", last: "Comanda #1234 a fost expediată.", time: "luni", unread: 0 },
            ].map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition-colors hover:border-primary/40"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                <div className="h-11 w-11 rounded-full flex items-center justify-center text-2xl shrink-0"
                  style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)" }}>
                  {m.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{m.name}</p>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{m.time}</span>
                  </div>
                  <p className="text-sm truncate mt-0.5" style={{ color: "var(--muted)" }}>{m.last}</p>
                </div>
                {m.unread > 0 && (
                  <span className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: "var(--primary)" }}>
                    {m.unread}
                  </span>
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
