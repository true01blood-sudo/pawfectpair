import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import BackLink from "@/components/BackLink";
import ImageUpload from "@/components/ImageUpload";
import { SPECIES_OPTIONS } from "@/lib/species";
import { addPet } from "../actions";

export default async function AdaugaAnimalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const inputStyle = {
    borderColor: "var(--card-border)",
    color: "var(--foreground)",
    background: "var(--card-bg)",
  };

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
          <BackLink href="/animale" label="Animalele mele" />
          <h1 className="text-xl font-bold sm:text-2xl mt-2" style={{ color: "var(--foreground)" }}>
            Adaugă animal
          </h1>

          <form action={addPet} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                Nume <span className="text-red-500">*</span>
              </label>
              <input name="name" required placeholder="Ex: Luna" className="w-full min-h-11 rounded-xl border px-4 text-sm" style={inputStyle} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                  Specie <span className="text-red-500">*</span>
                </label>
                <select name="species" required className="w-full min-h-11 rounded-xl border px-4 text-sm" style={inputStyle}>
                  <option value="">Selectează...</option>
                  {SPECIES_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                  Sex
                </label>
                <select name="sex" defaultValue="unknown" className="w-full min-h-11 rounded-xl border px-4 text-sm" style={inputStyle}>
                  <option value="unknown">Necunoscut</option>
                  <option value="male">Mascul</option>
                  <option value="female">Femelă</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                  Rasă
                </label>
                <input name="breed" placeholder="Opțional" className="w-full min-h-11 rounded-xl border px-4 text-sm" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                  Data nașterii
                </label>
                <input name="birth_date" type="date" className="w-full min-h-11 rounded-xl border px-4 text-sm" style={inputStyle} />
              </div>
            </div>

            <ImageUpload name="photo_url" label="Poză (opțional)" />

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                Note
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Fișă medicală / carnet de vaccinare (opțional)"
                className="w-full rounded-xl border p-4 text-sm resize-none"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              className="self-start rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--primary)" }}
            >
              Adaugă animal
            </button>
          </form>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
