import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import Breadcrumb from "@/components/Breadcrumb";
import { updatePaymentProvider } from "./actions";

const PROVIDER_LABELS: Record<string, { name: string; hint: string }> = {
  stripe: { name: "Stripe", hint: "Carduri internaționale, cel mai simplu de integrat." },
  payu: { name: "PayU", hint: "Popular în România — carduri + transfer bancar local." },
  netopia: { name: "Netopia Payments", hint: "Procesator românesc, folosit frecvent de magazine locale." },
  revolut: { name: "Revolut Business", hint: "Plăți card prin Revolut Merchant API." },
};

export default async function AdminPlatiPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Nu selectăm niciodată secret_key / webhook_secret direct — doar dacă
  // sunt setate (boolean), ca să nu trimitem secretele către client la fiecare randare.
  const [
    { data: providers },
    { count: premiumCount },
    { count: freeCount },
    { data: expiringSoon },
    { data: recentSubs },
  ] = await Promise.all([
    supabase
      .from("subscription_payment_providers")
      .select("provider, enabled, test_mode, public_key, updated_at, secret_key, webhook_secret")
      .order("provider"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("plan", "premium"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("plan", "free"),
    supabase
      .from("profiles")
      .select("id, full_name, plan_expires_at, plan_source")
      .eq("plan", "premium")
      .not("plan_expires_at", "is", null)
      .lte("plan_expires_at", in7Days)
      .order("plan_expires_at", { ascending: true })
      .limit(20),
    supabase
      .from("profiles")
      .select("id, full_name, plan_purchased_at")
      .eq("plan_source", "purchased")
      .not("plan_purchased_at", "is", null)
      .order("plan_purchased_at", { ascending: false })
      .limit(10),
  ]);

  const rows = (providers ?? []).map((p) => ({
    ...p,
    has_secret: !!p.secret_key,
    has_webhook: !!p.webhook_secret,
    secret_key: undefined,
    webhook_secret: undefined,
  }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ href: "/admin", label: "Admin" }, { label: "Plăți abonamente" }]} />
      <h1 className="text-xl font-bold sm:text-2xl">Plăți abonamente</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
        Procesatori pentru abonamentele Premium (useri) și Pro (furnizori) — plata are loc doar pe web,
        nu în aplicația mobilă. Poți activa mai mulți procesatori simultan.
      </p>

      {/* Statistici rapide */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border p-4" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Useri Premium</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: "var(--foreground)" }}>💎 {premiumCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border p-4" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Useri Gratuit</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: "var(--foreground)" }}>🆓 {freeCount ?? 0}</p>
        </div>
      </div>

      {/* Expiră în curând */}
      <section className="mt-6 rounded-2xl border p-4 sm:p-6" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
        <h2 className="font-semibold">⏳ Expiră în următoarele 7 zile</h2>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Notificarea automată de reînnoire pleacă singură cu 5 zile înainte — lista de aici e doar pentru vizibilitate.
        </p>
        {expiringSoon && expiringSoon.length > 0 ? (
          <div className="mt-3 flex flex-col divide-y" style={{ borderColor: "var(--card-border)" }}>
            {expiringSoon.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p style={{ color: "var(--foreground)" }}>{u.full_name ?? u.id}</p>
                  {u.plan_source === "promo_launch" && (
                    <span className="text-xs" style={{ color: "var(--muted)" }}>promoție de lansare</span>
                  )}
                </div>
                <span style={{ color: "var(--muted)" }}>
                  {u.plan_expires_at && new Date(u.plan_expires_at).toLocaleDateString("ro-RO")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>Niciun abonament nu expiră în următoarele 7 zile.</p>
        )}
      </section>

      {/* Abonamente recente */}
      <section className="mt-4 rounded-2xl border p-4 sm:p-6" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
        <h2 className="font-semibold">💳 Ultimele abonamente plătite</h2>
        {recentSubs && recentSubs.length > 0 ? (
          <div className="mt-3 flex flex-col divide-y" style={{ borderColor: "var(--card-border)" }}>
            {recentSubs.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 text-sm">
                <p style={{ color: "var(--foreground)" }}>{u.full_name ?? u.id}</p>
                <span style={{ color: "var(--muted)" }}>
                  {u.plan_purchased_at && new Date(u.plan_purchased_at).toLocaleDateString("ro-RO")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>Niciun abonament plătit încă.</p>
        )}
      </section>

      <h2 className="mt-8 font-semibold">Procesatori</h2>
      <div className="mt-3 flex flex-col gap-4">
        {rows.map((p) => {
          const label = PROVIDER_LABELS[p.provider] ?? { name: p.provider, hint: "" };
          return (
            <section
              key={p.provider}
              className="rounded-2xl border p-4 sm:p-6"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{label.name}</h2>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{label.hint}</p>
                </div>
                {p.enabled && (
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ background: "var(--success-bg, #DCFCE7)", color: "var(--success, #16A34A)" }}
                  >
                    Activ{p.test_mode ? " (test)" : ""}
                  </span>
                )}
              </div>

              <form action={updatePaymentProvider} className="mt-4 flex flex-col gap-3">
                <input type="hidden" name="provider" value={p.provider} />

                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="enabled" defaultChecked={p.enabled} />
                  Activat
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="test_mode" defaultChecked={p.test_mode} />
                  Mod test (sandbox)
                </label>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Cheie publică</label>
                  <input
                    name="public_key"
                    defaultValue={p.public_key ?? ""}
                    placeholder="pk_live_..."
                    className="w-full rounded-xl border px-3 py-2 text-sm bg-transparent"
                    style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                    Cheie secretă {p.has_secret && <span style={{ color: "var(--success, #16A34A)" }}>(setată — lasă gol ca să nu o schimbi)</span>}
                  </label>
                  <input
                    name="secret_key"
                    type="password"
                    placeholder={p.has_secret ? "••••••••" : "sk_live_..."}
                    className="w-full rounded-xl border px-3 py-2 text-sm bg-transparent"
                    style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                    Secret webhook {p.has_webhook && <span style={{ color: "var(--success, #16A34A)" }}>(setat)</span>}
                  </label>
                  <input
                    name="webhook_secret"
                    type="password"
                    placeholder="whsec_..."
                    className="w-full rounded-xl border px-3 py-2 text-sm bg-transparent"
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
          );
        })}
      </div>

      <p className="mt-6 text-xs" style={{ color: "var(--muted)" }}>
        Activarea unui procesator aici doar salvează configurarea — procesarea efectivă a plăților
        (checkout, webhook-uri de confirmare) e un pas de implementare separat, per procesator.
      </p>
    </main>
  );
}
