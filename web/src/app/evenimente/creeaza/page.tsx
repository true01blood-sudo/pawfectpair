import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { createEvent } from "../actions";
import BackLink from "@/components/BackLink";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import ImageUpload from "@/components/ImageUpload";

const inputClass = "min-h-11 rounded-xl border px-4 text-sm";
const inputStyle = { borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" };

export default async function CreeazaEvenimentPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
          <BackLink href="/evenimente" label="Evenimente" />
          <h1 className="text-xl font-bold sm:text-2xl mt-2" style={{ color: "var(--foreground)" }}>
            Creează un eveniment
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Organizează un meetup, o competiție sau orice întâlnire pentru comunitate.
          </p>

          <form action={createEvent} className="mt-6 flex flex-col gap-4">
            <input name="title" placeholder="Titlul evenimentului" required className={inputClass} style={inputStyle} />
            <textarea name="description" placeholder="Descriere — ce se întâmplă, ce trebuie să aducă participanții..." rows={4} className="rounded-xl border p-4 text-sm" style={inputStyle} />

            <div className="grid grid-cols-2 gap-4">
              <select name="event_type" className={inputClass} style={inputStyle} defaultValue="meetup">
                <option value="meetup">👋 Meetup</option>
                <option value="adoption">🐾 Adopție</option>
                <option value="competition">🏆 Competiție</option>
                <option value="training">🎓 Training</option>
                <option value="expo">🎪 Expo</option>
                <option value="charity">❤️ Caritabil</option>
                <option value="other">📌 Altele</option>
              </select>
              <select name="audience" className={inputClass} style={inputStyle} defaultValue="all">
                <option value="all">Toate animalele</option>
                <option value="dogs">🐶 Doar câini</option>
                <option value="cats">🐱 Doar pisici</option>
                <option value="small_pets">🐹 Animale mici</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input name="city" placeholder="Oraș" required className={inputClass} style={inputStyle} />
              <input name="location" placeholder="Locație exactă (opțional)" className={inputClass} style={inputStyle} />
            </div>

            <div>
              <p className="mb-1 text-xs font-medium" style={{ color: "var(--muted)" }}>Start</p>
              <input name="starts_at" type="datetime-local" required className={`${inputClass} w-full`} style={inputStyle} />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium" style={{ color: "var(--muted)" }}>Sfârșit</p>
              <input name="ends_at" type="datetime-local" required className={`${inputClass} w-full`} style={inputStyle} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input name="max_participants" type="number" min="2" max="5000" placeholder="Nr. maxim participanți (opțional)" className={inputClass} style={inputStyle} />
              <input name="contact_phone" placeholder="Telefon de contact (opțional)" className={inputClass} style={inputStyle} />
            </div>

            <ImageUpload name="photo_url" label="Poză eveniment (opțional)" />

            <button className="min-h-11 self-start rounded-full bg-primary px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90">
              Publică evenimentul
            </button>
          </form>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
