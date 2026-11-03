import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { registerPensiune } from "../actions";
import BackLink from "@/components/BackLink";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import ImageUpload from "@/components/ImageUpload";

const SERVICES = [
  { id: "boarding", label: "🌙 Cazare peste noapte" },
  { id: "daycare", label: "☀️ Grădiniță de zi" },
  { id: "sitting_at_sitter", label: "🏠 Sitting la pensiune" },
  { id: "sitting_at_owner", label: "🛋️ Sitting la proprietar" },
  { id: "home_visits", label: "🏡 Vizite acasă" },
  { id: "dog_walking", label: "🐕 Plimbări" },
  { id: "transport", label: "🚗 Transport" },
];

const AMENITIES = [
  { id: "curte", label: "🌳 Curte" },
  { id: "climatizare", label: "❄️ Climatizare" },
  { id: "webcam_live", label: "📹 Webcam live" },
  { id: "supraveghere_24_7", label: "👁️ Supraveghere 24/7" },
  { id: "plimbari_zilnice", label: "🚶 Plimbări zilnice" },
  { id: "ingrijire_medicala", label: "💊 Îngrijire medicală" },
  { id: "grooming_inclus", label: "✂️ Grooming inclus" },
  { id: "transport_inclus", label: "🚐 Transport inclus" },
  { id: "camere_individuale", label: "🚪 Camere individuale" },
  { id: "zona_joaca", label: "🎾 Zonă de joacă" },
];

const inputClass = "min-h-11 rounded-xl border px-4 text-sm";
const inputStyle = { borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" };

export default async function AdaugaPensiunePage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
          <BackLink href="/pensiuni" label="Pensiuni" />
          <h1 className="text-xl font-bold sm:text-2xl mt-2" style={{ color: "var(--foreground)" }}>
            Adaugă pensiunea ta
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Publică unitatea de cazare — va apărea în catalogul Pensiuni, vizibilă tuturor utilizatorilor.
          </p>

          <form action={registerPensiune} className="mt-6 flex flex-col gap-4">
            <input name="title" placeholder="Numele unității (ex: Pensiunea Lăbuțe Fericite)" required className={inputClass} style={inputStyle} />
            <textarea name="description" placeholder="Descriere — spune-le stăpânilor ce oferi, experiența ta, programul..." rows={4} className="rounded-xl border p-4 text-sm" style={inputStyle} />

            <div className="grid grid-cols-2 gap-4">
              <input name="city" placeholder="Oraș" required className={inputClass} style={inputStyle} />
              <input name="phone" placeholder="Telefon" className={inputClass} style={inputStyle} />
            </div>
            <input name="address" placeholder="Adresă completă (opțional)" className={inputClass} style={inputStyle} />

            <div className="grid grid-cols-2 gap-4">
              <input name="price_from" type="number" min="0" step="1" placeholder="Preț de la (RON)" className={inputClass} style={inputStyle} />
              <select name="price_unit" className={inputClass} style={inputStyle} defaultValue="day">
                <option value="day">/ zi</option>
                <option value="night">/ noapte</option>
                <option value="hour">/ oră</option>
                <option value="visit">/ vizită</option>
                <option value="walk">/ plimbare</option>
              </select>
            </div>
            <input name="max_pets" type="number" min="1" max="50" placeholder="Nr. maxim de animale acceptate simultan (opțional)" className={inputClass} style={inputStyle} />

            <div className="flex flex-wrap gap-4 text-sm" style={{ color: "var(--foreground)" }}>
              <label className="flex items-center gap-2"><input type="checkbox" name="accepts_dogs" defaultChecked /> 🐶 Câini</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="accepts_cats" defaultChecked /> 🐱 Pisici</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="accepts_other" /> 🐾 Alte animale</label>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>Servicii oferite *</p>
              <div className="flex flex-wrap gap-3 text-sm" style={{ color: "var(--foreground)" }}>
                {SERVICES.map((s) => (
                  <label key={s.id} className="flex items-center gap-2">
                    <input type="checkbox" name="services" value={s.id} /> {s.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>Facilități</p>
              <div className="flex flex-wrap gap-3 text-sm" style={{ color: "var(--foreground)" }}>
                {AMENITIES.map((a) => (
                  <label key={a.id} className="flex items-center gap-2">
                    <input type="checkbox" name="amenities" value={a.id} /> {a.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>Poze</p>
              <div className="flex flex-col gap-3">
                <ImageUpload name="photo_url" label="Poză de copertă" />
                <ImageUpload name="photos" label="Poză galerie" />
                <ImageUpload name="photos" label="Poză galerie" />
                <ImageUpload name="photos" label="Poză galerie" />
                <ImageUpload name="photos" label="Poză galerie" />
                <ImageUpload name="photos" label="Poză galerie" />
              </div>
            </div>

            <button className="min-h-11 self-start rounded-full bg-primary px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90">
              Publică pensiunea
            </button>
          </form>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
