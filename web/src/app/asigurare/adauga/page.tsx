import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import BackLink from "@/components/BackLink";
import { addPolicy } from "../actions";

const POLICY_TYPES = [
  { value: "accident", label: "Accident" },
  { value: "illness", label: "Boală" },
  { value: "comprehensive", label: "Comprehensive" },
  { value: "liability", label: "Răspundere civilă" },
];

export default async function AdaugaPolitaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pets } = await supabase.from("pets").select("id, name").eq("owner_id", user.id);

  const inputStyle = {
    borderColor: "var(--card-border)",
    color: "var(--foreground)",
    background: "var(--card-bg)",
  };

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
          <BackLink href="/asigurare" label="Asigurare" />
          <h1 className="text-xl font-bold sm:text-2xl mt-2" style={{ color: "var(--foreground)" }}>
            Adaugă poliță
          </h1>

          <form action={addPolicy} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                Asigurător <span className="text-red-500">*</span>
              </label>
              <input
                name="provider"
                required
                placeholder="Ex: Omniasig, Groupama..."
                className="w-full min-h-11 rounded-xl border px-4 text-sm"
                style={inputStyle}
              />
            </div>

            {pets && pets.length > 0 && (
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                  Animal asigurat
                </label>
                <select name="pet_id" className="w-full min-h-11 rounded-xl border px-4 text-sm" style={inputStyle}>
                  <option value="">Selectează...</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                  Tip poliță
                </label>
                <select name="policy_type" defaultValue="comprehensive" className="w-full min-h-11 rounded-xl border px-4 text-sm" style={inputStyle}>
                  {POLICY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                  Nr. poliță
                </label>
                <input name="policy_number" className="w-full min-h-11 rounded-xl border px-4 text-sm" style={inputStyle} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                Primă anuală (RON)
              </label>
              <input
                name="premium"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                className="w-full min-h-11 rounded-xl border px-4 text-sm"
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                  Valabilă de la <span className="text-red-500">*</span>
                </label>
                <input name="start_date" type="date" required className="w-full min-h-11 rounded-xl border px-4 text-sm" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                  Valabilă până la <span className="text-red-500">*</span>
                </label>
                <input name="end_date" type="date" required className="w-full min-h-11 rounded-xl border px-4 text-sm" style={inputStyle} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                Note
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Detalii suplimentare despre acoperire..."
                className="w-full rounded-xl border p-4 text-sm resize-none"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              className="self-start rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--primary)" }}
            >
              Salvează polița
            </button>
          </form>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
