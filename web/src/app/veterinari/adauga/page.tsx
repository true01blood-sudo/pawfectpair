import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerVet } from "../actions";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import BackLink from "@/components/BackLink";
import ImageUpload from "@/components/ImageUpload";

const inputClass = "min-h-11 rounded-xl border px-4 text-sm";
const inputStyle = { borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" };

export default async function AdaugaVetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
          <BackLink href="/veterinari" label="Veterinari" />
          <h1 className="text-xl font-bold sm:text-2xl mt-2" style={{ color: "var(--foreground)" }}>
            Înregistrează cabinetul veterinar
          </h1>

          <form action={registerVet} className="mt-6 flex flex-col gap-4">
            <input name="clinic_name" placeholder="Numele cabinetului" required className={inputClass} style={inputStyle} />
            <div className="grid grid-cols-2 gap-4">
              <input name="city" placeholder="Oraș" required className={inputClass} style={inputStyle} />
              <input name="phone" placeholder="Telefon" required className={inputClass} style={inputStyle} />
            </div>
            <input name="address" placeholder="Adresă completă" required className={inputClass} style={inputStyle} />
            <textarea name="bio" placeholder="Despre cabinet, specializări..." rows={4} className="rounded-xl border p-4 text-sm" style={inputStyle} />

            <div className="rounded-2xl border p-4" style={{ borderColor: "var(--card-border)" }}>
              <p className="mb-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>Insigne de încredere</p>
              <div className="flex flex-col gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                <label className="flex items-center gap-2"><input type="checkbox" name="is_licensed" /> ✅ Cabinet autorizat</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="experienced_team" /> 👥 Echipă cu experiență</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="modern_facility" /> 🏢 Facilitate modernă</label>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>Poze</p>
              <div className="flex flex-col gap-3">
                <ImageUpload name="photo_url" label="Poză de copertă" />
                <ImageUpload name="photos" label="Poză galerie" />
                <ImageUpload name="photos" label="Poză galerie" />
                <ImageUpload name="photos" label="Poză galerie" />
              </div>
            </div>

            <button className="min-h-11 self-start rounded-full bg-primary px-5 font-semibold text-white">
              Publică cabinetul
            </button>
          </form>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
