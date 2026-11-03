import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import Breadcrumb from "@/components/Breadcrumb";
import { toggleTrainerVerified, deleteTrainer, updateTrainingPlanActive, deleteTrainingPlan } from "../actions";

export default async function AdminAntrenamentPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const [{ data: trainers }, { data: plans }] = await Promise.all([
    supabase
      .from("trainers")
      .select("id, display_name, city, rating, session_count, is_verified, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("training_plans")
      .select("id, title, level, species, price_cents, currency, is_active, created_at, trainers(display_name)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ href: "/", label: "Acasă" }, { href: "/profil", label: "Profil" }, { href: "/admin", label: "Panou Admin" }, { label: "Antrenament" }]} />
      <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--foreground)" }}>
        Training & Dresaj (admin)
      </h1>

      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
          Antrenori ({trainers?.length ?? 0})
        </h2>
        {trainers && trainers.length > 0 ? (
          <div className="flex flex-col gap-2">
            {trainers.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm shadow-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
              >
                <div className="min-w-0">
                  <p className="font-medium" style={{ color: "var(--foreground)" }}>
                    {t.display_name} {t.is_verified && <span title="Verificat">✅</span>}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {t.city ?? "Oraș nespecificat"} · ★ {t.rating} ({t.session_count} sesiuni) · {new Date(t.created_at).toLocaleDateString("ro-RO")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <form action={toggleTrainerVerified.bind(null, t.id, !t.is_verified)}>
                    <button className="min-h-8 rounded-full border px-3 text-xs hover:border-green-400 hover:text-green-600" style={{ borderColor: "var(--card-border)" }}>
                      {t.is_verified ? "Retrage verificarea" : "Verifică"}
                    </button>
                  </form>
                  <form action={deleteTrainer.bind(null, t.id)}>
                    <button className="text-xs text-red-500 hover:underline">Șterge</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Niciun antrenor înregistrat.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
          Planuri de antrenament ({plans?.length ?? 0})
        </h2>
        {plans && plans.length > 0 ? (
          <div className="flex flex-col gap-2">
            {plans.map((p) => {
              const trainer = p.trainers as unknown as { display_name: string } | null;
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm shadow-sm"
                  style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate" style={{ color: "var(--foreground)" }}>{p.title}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {trainer?.display_name ?? "?"} · {p.level} · {p.species} · {(p.price_cents / 100).toFixed(0)} {p.currency}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold" style={{ color: p.is_active ? "#16a34a" : "#6b7280" }}>
                      {p.is_active ? "Activ" : "Inactiv"}
                    </span>
                    <form action={updateTrainingPlanActive.bind(null, p.id, !p.is_active)}>
                      <button className="min-h-8 rounded-full border px-3 text-xs hover:border-green-400 hover:text-green-600" style={{ borderColor: "var(--card-border)" }}>
                        {p.is_active ? "Dezactivează" : "Activează"}
                      </button>
                    </form>
                    <form action={deleteTrainingPlan.bind(null, p.id)}>
                      <button className="text-xs text-red-500 hover:underline">Șterge</button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Niciun plan de antrenament.</p>
        )}
      </section>
    </main>
  );
}
