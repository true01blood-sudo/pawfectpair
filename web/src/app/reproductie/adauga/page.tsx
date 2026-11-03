import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { createBreedingListing } from "../actions";
import BackLink from "@/components/BackLink";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import ImageUpload from "@/components/ImageUpload";

const inputClass = "min-h-11 rounded-xl border px-4 text-sm";
const inputStyle = { borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" };

export default async function AdaugaReproductiePage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
          <BackLink href="/reproductie" label="Reproducție" />
          <h1 className="text-xl font-bold sm:text-2xl mt-2" style={{ color: "var(--foreground)" }}>
            Adaugă anunț de reproducție
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Publică un partener de reproducție responsabilă — teste de sănătate și pedigree recomandate.
          </p>

          <form action={createBreedingListing} className="mt-6 flex flex-col gap-4">
            <input name="title" placeholder="Numele animalului (ex: Atlas)" required className={inputClass} style={inputStyle} />
            <textarea name="description" placeholder="Descriere — temperament, mediu de creștere, condiții..." rows={4} className="rounded-xl border p-4 text-sm" style={inputStyle} />

            <div className="grid grid-cols-2 gap-4">
              <select name="species" className={inputClass} style={inputStyle} defaultValue="caine">
                <option value="caine">🐶 Câine</option>
                <option value="pisica">🐱 Pisică</option>
                <option value="altele">🦜 Altele</option>
              </select>
              <select name="gender" className={inputClass} style={inputStyle} defaultValue="">
                <option value="">Gen nespecificat</option>
                <option value="mascul">Mascul ♂</option>
                <option value="femela">Femelă ♀</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input name="breed" placeholder="Rasă" className={inputClass} style={inputStyle} />
              <input name="age_years" type="number" min="0" max="30" placeholder="Vârstă (ani)" className={inputClass} style={inputStyle} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input name="city" placeholder="Oraș" className={inputClass} style={inputStyle} />
              <input name="price_info" placeholder="Preț (ex: 900 RON / montă)" className={inputClass} style={inputStyle} />
            </div>

            <input name="health_tests" placeholder="Teste de sănătate, separate prin virgulă (ex: HD-A, ED-0, DNA Clear)" className={inputClass} style={inputStyle} />
            <textarea name="pedigree_info" placeholder="Informații pedigree (părinți, titluri, registru)" rows={3} className="rounded-xl border p-4 text-sm" style={inputStyle} />

            <div className="rounded-2xl border p-4" style={{ borderColor: "var(--card-border)" }}>
              <label className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: "var(--foreground)" }}>
                <input type="checkbox" name="is_champion" /> 🏆 Câștigător de expoziții (show champion)
              </label>
              <input name="awards" placeholder="Premii/titluri, separate prin virgulă (opțional)" className={inputClass} style={inputStyle} />
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs" style={{ color: "var(--muted)" }}>Nr. litere anterioare</label>
                  <input name="litters_count" type="number" min="0" max="50" defaultValue="0" className={`${inputClass} w-full mt-1`} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs" style={{ color: "var(--muted)" }}>Nr. pui crescuți</label>
                  <input name="offspring_count" type="number" min="0" max="500" defaultValue="0" className={`${inputClass} w-full mt-1`} style={inputStyle} />
                </div>
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
              Publică anunțul
            </button>
          </form>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
