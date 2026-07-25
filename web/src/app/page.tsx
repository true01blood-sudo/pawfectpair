import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

const categories = [
  { href: "/adoptii", label: "Adopții", icon: "🐾" },
  { href: "/programari", label: "Veterinari", icon: "🩺" },
  { href: "/magazin", label: "Magazin", icon: "🛍️" },
  { href: "/comunitate", label: "Comunitate", icon: "💬" },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listings } = await supabase
    .from("adoption_listings")
    .select("id, name, species, breed, city, photo_url")
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <>
      <main className="flex-1 mx-auto w-full max-w-5xl p-4 pb-24">
        <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-5 py-3">
          <span>🔍</span>
          <input
            type="search"
            placeholder="Caută animale, servicii, produse..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        <section className="mt-6 rounded-2xl bg-dark p-6 text-white">
          <p className="text-xs font-semibold uppercase text-primary">
            Adoptă, nu cumpăra
          </p>
          <h2 className="mt-1 text-xl font-bold">
            Ai grijă de un animal fără stăpân
          </h2>
          <Link
            href="/adoptii"
            className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold"
          >
            Vezi adopțiile
          </Link>
        </section>

        <section className="mt-8">
          <h3 className="mb-3 font-semibold">Explorează</h3>
          <div className="grid grid-cols-4 gap-3">
            {categories.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="flex flex-col items-center gap-2 rounded-2xl border p-3 text-center"
              >
                <span className="text-2xl">{c.icon}</span>
                <span className="text-xs text-zinc-600">{c.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Adopții recente</h3>
            <Link href="/adoptii" className="text-sm text-primary">
              Vezi toate
            </Link>
          </div>
          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {listings.map((pet) => (
                <div key={pet.id} className="rounded-2xl border p-3">
                  <div className="mb-2 aspect-square rounded-xl bg-zinc-100" />
                  <p className="font-medium">{pet.name}</p>
                  <p className="text-xs text-zinc-500">
                    {pet.breed || pet.species} · {pet.city}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-zinc-500">
              Nu există încă anunțuri de adopție. Fii primul care adaugă unul!
            </p>
          )}
        </section>

        {!user && (
          <div className="mt-8 rounded-2xl border p-4 text-center">
            <p className="mb-3 text-sm text-zinc-600">
              Creează un cont pentru a adăuga animale, programa vizite la
              veterinar și mai mult.
            </p>
            <Link
              href="/login"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white"
            >
              Autentificare / Cont nou
            </Link>
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
