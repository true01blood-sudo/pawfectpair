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

const roleLabels: Record<string, string> = {
  user: "Utilizator", vet: "Veterinar", shop: "Vânzător", shelter: "Centru/Asociație", admin: "Administrator",
};

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, avatar_url, role, is_verified")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "user";

  const { data: pets } = await supabase
    .from("pets")
    .select("id, name, species, breed, photo_url")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  // Role-specific data
  let vetData: { id: string; clinic_name: string | null; city: string | null } | null = null;
  let myProducts: { id: string; name: string; price_cents: number; stock: number; photo_url: string | null }[] = [];
  let myListings: { id: string; name: string; species: string; status: string; city: string | null; photo_url: string | null }[] = [];

  if (role === "vet") {
    const { data } = await supabase.from("vets").select("id, clinic_name, city").eq("user_id", user.id).single();
    vetData = data;
  }
  if (role === "shop") {
    const { data } = await supabase.from("products")
      .select("id, name, price_cents, stock, photo_url")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6);
    myProducts = data ?? [];
  }
  if (role === "shelter") {
    const { data } = await supabase.from("adoption_listings")
      .select("id, name, species, status, city, photo_url")
      .eq("posted_by", user.id)
      .order("created_at", { ascending: false })
      .limit(6);
    myListings = data ?? [];
  }

  return (
    <>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">

        {/* Avatar + name */}
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
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm" style={{ color: "var(--muted)" }}>{user.email}</p>
            {profile?.is_verified && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                ✓ Verificat
              </span>
            )}
          </div>
          <span className="mt-1 rounded-full px-3 py-0.5 text-xs font-medium"
            style={{ background: "var(--surface)", color: "var(--muted)" }}>
            {roleLabels[role] ?? role}
          </span>
        </div>

        {/* Quick nav */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {role === "admin" && (
            <Link href="/admin" className="flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-white">
              ⚙️ Panou Admin
            </Link>
          )}
          <Link href="/planificator" className="flex min-h-11 items-center rounded-full border px-4 text-sm"
            style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}>
            Planificator
          </Link>
          <Link href="/educatie" className="flex min-h-11 items-center rounded-full border px-4 text-sm"
            style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}>
            Sfaturi
          </Link>
          <Link href="/statistici" className="flex min-h-11 items-center rounded-full border px-4 text-sm"
            style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}>
            Statistici
          </Link>
        </div>

        {/* ── VET ROLE: clinic section ── */}
        {role === "vet" && (
          <section className="mt-8 rounded-2xl border p-4 shadow-sm"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Profilul meu veterinar</h2>
              <Link href="/veterinari/inregistrare" className="text-xs text-primary hover:underline">
                {vetData ? "Editează" : "Înregistrează-te"} →
              </Link>
            </div>
            {vetData ? (
              <div className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                <p className="font-medium" style={{ color: "var(--foreground)" }}>{vetData.clinic_name ?? "Clinică nenumită"}</p>
                <p>{vetData.city ?? "Localitate nespecificată"}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                Nu ai un profil veterinar înregistrat.{" "}
                <Link href="/veterinari/inregistrare" className="text-primary hover:underline">Înregistrează-te acum →</Link>
              </p>
            )}
          </section>
        )}

        {/* ── SHOP ROLE: products section ── */}
        {role === "shop" && (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Produsele mele</h2>
              <Link href="/magazin" className="text-xs text-primary hover:underline">Deschide magazinul →</Link>
            </div>
            {myProducts.length > 0 ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {myProducts.map((prod) => (
                  <li key={prod.id} className="rounded-2xl border p-3 shadow-sm"
                    style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
                    {prod.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={prod.photo_url} alt={prod.name} className="mb-2 aspect-square w-full rounded-xl object-cover" />
                    ) : (
                      <div className="mb-2 flex aspect-square w-full items-center justify-center rounded-xl text-2xl"
                        style={{ background: "var(--surface)" }}>📦</div>
                    )}
                    <p className="text-xs font-semibold truncate">{prod.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {prod.price_cents ? `${(prod.price_cents / 100).toFixed(2)} RON` : "Preț nesetat"} · stoc: {prod.stock}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Nu ai produse adăugate.{" "}
                <Link href="/magazin/adauga" className="text-primary hover:underline">Adaugă primul produs →</Link>
              </p>
            )}
          </section>
        )}

        {/* ── SHELTER ROLE: adoption listings ── */}
        {role === "shelter" && (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Anunțurile mele de adopție</h2>
              <Link href="/adoptii/adauga" className="text-xs text-primary hover:underline">Adaugă anunț →</Link>
            </div>
            {myListings.length > 0 ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {myListings.map((l) => (
                  <li key={l.id}>
                    <Link href={`/adoptii/${l.id}`}
                      className="card-hover block rounded-2xl border p-3 shadow-sm hover:border-primary"
                      style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
                      {l.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.photo_url} alt={l.name} className="mb-2 aspect-square w-full rounded-xl object-cover" />
                      ) : (
                        <PetPlaceholder className="mb-2 aspect-square w-full rounded-xl" />
                      )}
                      <p className="text-xs font-semibold truncate">{l.name}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>{l.species} · {l.city}</p>
                      <p className="mt-0.5 text-xs" style={{ color: l.status === "available" ? "#10b981" : "var(--muted)" }}>
                        {l.status === "available" ? "Disponibil" : l.status === "adopted" ? "Adoptat" : "Eliminat"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Nu ai anunțuri de adopție.{" "}
                <Link href="/adoptii/adauga" className="text-primary hover:underline">Adaugă acum →</Link>
              </p>
            )}
          </section>
        )}

        {/* ── PETS section (all roles) ── */}
        <section className="mt-8">
          <h2 className="mb-3 font-semibold">Animalele mele</h2>
          {pets && pets.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {pets.map((pet) => (
                <li key={pet.id}>
                  <Link href={`/animale/${pet.id}`}
                    className="card-hover block rounded-2xl border p-3 shadow-sm hover:border-primary"
                    style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
                    {pet.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pet.photo_url} alt={pet.name} className="mb-2 aspect-square w-full rounded-xl object-cover" />
                    ) : (
                      <PetPlaceholder className="mb-2 aspect-square w-full rounded-xl" />
                    )}
                    <p className="font-medium">{pet.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{pet.breed || pet.species}</p>
                    <p className="mt-1 text-xs text-primary">Fișă medicală →</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Nu ai încă animale adăugate.</p>
          )}

          <form action={addPet} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <input name="name" placeholder="Nume" required
              className="min-h-11 rounded-xl border px-3 text-sm"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
            <select name="species" required
              className="min-h-11 rounded-xl border px-3 text-sm"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}>
              <option value="">Specie</option>
              {SPECIES_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select name="sex"
              className="min-h-11 rounded-xl border px-3 text-sm"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}>
              <option value="unknown">Sex necunoscut</option>
              <option value="male">Mascul</option>
              <option value="female">Femelă</option>
            </select>
            <input name="breed" placeholder="Rasă (opțional)"
              className="min-h-11 rounded-xl border px-3 text-sm"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: "var(--muted)" }}>Data nașterii (opțional)</label>
              <input name="birth_date" type="date"
                className="min-h-11 rounded-xl border px-3 text-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
            </div>
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <ImageUpload name="photo_url" label="Poză (opțional)" />
            </div>
            <textarea name="notes" placeholder="Fișă medicală / carnet de vaccinare (opțional)" rows={2}
              className="col-span-2 rounded-xl border p-3 text-sm sm:col-span-3"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
            <button className="min-h-11 self-start rounded-full bg-primary px-5 text-sm font-semibold text-white">
              Adaugă animal
            </button>
          </form>
        </section>

        {/* ── PROFILE DATA section ── */}
        <section className="mt-8">
          <h2 className="mb-3 font-semibold">Datele mele</h2>
          <form action={updateProfile} className="flex flex-col gap-3 rounded-2xl border p-4 shadow-sm"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
            <div>
              <label className="text-xs" style={{ color: "var(--muted)" }}>Nume complet</label>
              <input name="full_name" defaultValue={profile?.full_name ?? ""} required
                className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
            </div>
            <div>
              <label className="text-xs" style={{ color: "var(--muted)" }}>Telefon</label>
              <input name="phone" type="tel" defaultValue={profile?.phone ?? ""} placeholder="07xx xxx xxx"
                className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
            </div>
            <div>
              <label className="text-xs" style={{ color: "var(--muted)" }}>Poză de profil</label>
              <div className="mt-1">
                <ImageUpload name="avatar_url" label="Schimbă poza" defaultValue={profile?.avatar_url ?? ""} />
              </div>
            </div>
            <button className="min-h-11 self-start rounded-full bg-primary px-5 text-sm font-semibold text-white">
              Salvează datele
            </button>
          </form>

          <form action={updatePassword} className="mt-4 flex flex-col gap-3 rounded-2xl border p-4 shadow-sm"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
            <p className="text-sm font-medium">Schimbă parola</p>
            <input name="password" type="password" placeholder="Parolă nouă" minLength={6} required
              className="min-h-11 rounded-xl border px-3 text-sm"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
            <input name="confirm" type="password" placeholder="Confirmă parola nouă" minLength={6} required
              className="min-h-11 rounded-xl border px-3 text-sm"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
            <button className="min-h-11 self-start rounded-full px-5 text-sm font-semibold" style={{ background: "#111827", color: "#fff" }}>
              Actualizează parola
            </button>
          </form>
        </section>

        {/* ── SETTINGS section ── */}
        <section className="mt-8">
          <h2 className="mb-3 font-semibold">Setări</h2>
          <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ borderColor: "var(--card-border)" }}>
            {settingsLinks.map((s, i) => (
              <Link key={s.href} href={s.href}
                className={`flex min-h-11 items-center gap-3 px-4 py-3 text-sm ${i > 0 ? "border-t" : ""}`}
                style={{ borderColor: "var(--card-border)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-base">
                  {s.icon}
                </span>
                <span className="flex-1">{s.label}</span>
                <span style={{ color: "var(--muted)" }}>›</span>
              </Link>
            ))}
          </div>

          <form action={signOut} className="mt-4">
            <button className="min-h-11 w-full rounded-full text-sm font-semibold" style={{ background: "#111827", color: "#fff" }}>
              Ieși din cont
            </button>
          </form>

          <a href="mailto:contact@pawfectpair.app?subject=Solicitare%20stergere%20cont"
            className="mt-3 block text-center text-sm text-red-500">
            Solicită ștergerea contului
          </a>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
