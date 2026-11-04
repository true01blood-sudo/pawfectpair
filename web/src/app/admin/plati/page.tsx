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

  // Nu selectăm niciodată secret_key / webhook_secret direct — doar dacă
  // sunt setate (boolean), ca să nu trimitem secretele către client la fiecare randare.
  const { data: providers } = await supabase
    .from("subscription_payment_providers")
    .select("provider, enabled, test_mode, public_key, updated_at, secret_key, webhook_secret")
    .order("provider");

  const rows = (providers ?? []).map((p) => ({
    ...p,
    has_secret: !!p.secret_key,
    has_webhook: !!p.webhook_secret,
    secret_key: undefined,
    webhook_secret: undefined,
  }));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ href: "/admin", label: "Admin" }, { label: "Plăți abonamente" }]} />
      <h1 className="text-xl font-bold sm:text-2xl">Plăți abonamente</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
        Procesatori pentru abonamentele Premium (useri) și Pro (furnizori) — plata are loc doar pe web,
        nu în aplicația mobilă. Poți activa mai mulți procesatori simultan.
      </p>

      <div className="mt-6 flex flex-col gap-4">
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
