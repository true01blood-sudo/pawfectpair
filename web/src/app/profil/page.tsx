import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { addPet, signOut, updateProfile, updatePassword } from "./actions";
import { PetPlaceholder } from "@/components/PawPlaceholder";
import { UserIcon } from "@/components/icons";
import ImageUpload from "@/components/ImageUpload";
import { SPECIES_OPTIONS } from "@/lib/species";

const settingsLinks = [
  { href: "/legal/termeni", label: "Termeni și condiții", icon: "📜" },
  { href: "/legal/confidentialitate", label: "Confidențialitate", icon: "🔒" },
  { href: "/legal/gdpr", label: "Drepturile tale (GDPR)", icon: "🛡️" },
  { href: "/suport", label: "Suport", icon: "🎧" },
];

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, avatar_url, role")
    .eq("id", user.id)
    .single();

  const { data: pets } = await supabase
    .from("pets")
    .select("id, name, species, breed, photo_url")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
        <div className="flex flex-col items-center text-center">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={profile.full_name || "Avatar"} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <UserIcon className="h-9 w-9 text-primary" />
            </div>
          )}
          <h1 className="mt-3 text-xl font-bold sm:text-2xl">
            {profile?.full_name || "Profilul meu"}
          </h1>
          <p className="text-sm text-zinc-500">{user.email}</p>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {profile?.role === "admin" && (
            <a href="/admin" className="flex min-h-11 items-center rounded-full border px-4 text-sm">
              Admin
            </a>
          )}
          <Link href="/planificator" className="flex min-h-11 items-center rounded-full border px-4 text-sm">
            Planificator
          </Link>
          <Link href="/educatie" className="flex min-h-11 items-center rounded-full border px-4 text-sm">
            Sfaturi
          </Link>
          <Link href="/statistici" className="flex min-h-11 items-center rounded-full border px-4 text-sm">
            Statistici
          </Link>
        </div>

        <section className="mt-8">
          <h2 className="mb-3 font-semibold">Animalele mele</h2>
          {pets && pets.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {pets.map((pet) => (
                <li key={pet.id}>
                  <Link href={`/animale/${pet.id}`} className="card-hover block rounded-2xl border p-3 shadow-sm hover:border-primary">
                    {pet.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pet.photo_url} alt={pet.name} className="mb-2 aspect-square w-full rounded-xl object-cover" />
                    ) : (
                      <PetPlaceholder className="mb-2 aspect-square w-full rounded-xl" />
                    )}
                    <p className="font-medium">{pet.name}</p>
                    <p className="text-xs text-zinc-500">{pet.breed || pet.species}</p>
                    <p className="mt-1 text-xs text-primary">Fișă medicală →</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Nu ai încă animale adăugate.</p>
          )}

          <form action={addPet} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <input name="name" placeholder="Nume" required className="min-h-11 rounded-xl border px-3 text-sm" />
            <select name="species" required className="min-h-11 rounded-xl border px-3 text-sm">
              <option value="">Specie</option>
              {SPECIES_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select name="sex" className="min-h-11 rounded-xl border px-3 text-sm">
              <option value="unknown">Sex necunoscut</option>
              <option value="male">Mascul</option>
              <option value="female">Femelă</option>
            </select>
            <input name="breed" placeholder="Rasă (opțional)" className="min-h-11 rounded-xl border px-3 text-sm" />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Data nașterii (opțional)</label>
              <input name="birth_date" type="date" className="min-h-11 rounded-xl border px-3 text-sm" />
            </div>
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <ImageUpload name="photo_url" label="Poză (opțional)" />
            </div>
            <textarea
              name="notes"
              placeholder="Fișă medicală / carnet de vaccinare (opțional)"
              rows={2}
              className="col-span-2 rounded-xl border p-3 text-sm sm:col-span-3"
            />
            <button className="min-h-11 self-start rounded-full bg-primary px-5 text-sm font-semibold text-white">
              Adaugă animal
            </button>
          </form>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 font-semibold">Datele mele</h2>
          <form action={updateProfile} className="flex flex-col gap-3 rounded-2xl border p-4 shadow-sm">
            <div>
              <label className="text-xs text-zinc-500">Nume complet</label>
              <input
                name="full_name"
                defaultValue={profile?.full_name ?? ""}
                required
                className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500">Telefon</label>
              <input
                name="phone"
                type="tel"
                defaultValue={profile?.phone ?? ""}
                placeholder="07xx xxx xxx"
                className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500">Poză de profil</label>
              <div className="mt-1">
                <ImageUpload name="avatar_url" label="Schimbă poza" defaultValue={profile?.avatar_url ?? ""} />
              </div>
            </div>
            <button className="min-h-11 self-start rounded-full bg-primary px-5 text-sm font-semibold text-white">
              Salvează datele
            </button>
          </form>

          <form action={updatePassword} className="mt-4 flex flex-col gap-3 rounded-2xl border p-4 shadow-sm">
            <p className="text-sm font-medium">Schimbă parola</p>
            <input
              name="password"
              type="password"
              placeholder="Parolă nouă"
              minLength={6}
              required
              className="min-h-11 rounded-xl border px-3 text-sm"
            />
            <input
              name="confirm"
              type="password"
              placeholder="Confirmă parola nouă"
              minLength={6}
              required
              className="min-h-11 rounded-xl border px-3 text-sm"
            />
            <button className="min-h-11 self-start rounded-full bg-dark px-5 text-sm font-semibold text-white">
              Actualizează parola
            </button>
          </form>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 font-semibold">Setări</h2>
          <div className="overflow-hidden rounded-2xl border shadow-sm">
            {settingsLinks.map((s, i) => (
              <Link
                key={s.href}
                href={s.href}
                className={`flex min-h-11 items-center gap-3 px-4 py-3 text-sm hover:bg-zinc-50 ${i > 0 ? "border-t" : ""}`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-base">
                  {s.icon}
                </span>
                <span className="flex-1">{s.label}</span>
                <span className="text-zinc-300">›</span>
              </Link>
            ))}
          </div>

          <form action={signOut} className="mt-4">
            <button className="min-h-11 w-full rounded-full bg-dark text-sm font-semibold text-white">
              Ieși din cont
            </button>
          </form>

          <a
            href="mailto:contact@pawfectpair.app?subject=Solicitare%20stergere%20cont"
            className="mt-3 block text-center text-sm text-red-500"
          >
            Solicită ștergerea contului
          </a>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
