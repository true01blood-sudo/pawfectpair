import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { SearchIcon, FilterIcon, PawIcon, VetIcon, BagIcon, ChatIcon } from "@/components/icons";
import ShareButton from "@/components/ShareButton";
import { PetPlaceholder } from "@/components/PawPlaceholder";

const valueProps = [
  { title: "Adopții verificate", text: "Anunțuri reale de la centre și asociații, fără intermediari care comercializează animale." },
  { title: "Veterinari la un click", text: "Programează o vizită direct din aplicație, fără telefoane și așteptare." },
  { title: "Comunitate activă", text: "Sfaturi, povești și susținere de la alți stăpâni care chiar înțeleg." },
];

const categories = [
  { href: "/adoptii", label: "Adopții", Icon: PawIcon },
  { href: "/veterinari", label: "Veterinari", Icon: VetIcon },
  { href: "/magazin", label: "Magazin", Icon: BagIcon },
  { href: "/comunitate", label: "Comunitate", Icon: ChatIcon },
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
    .limit(8);

  return (
    <>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 pb-24 sm:px-6 lg:px-8 md:pb-8">
        <div className="flex min-h-11 items-center gap-2 rounded-full bg-zinc-100 px-5 py-2 shadow-sm">
          <SearchIcon className="h-5 w-5 shrink-0 text-zinc-400" />
          <input
            type="search"
            placeholder="Caută animale, servicii, produse..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <FilterIcon className="h-5 w-5 shrink-0 text-primary" />
        </div>

        <section className="mt-6 flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-dark p-6 text-white sm:p-8">
          <div>
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              Adoptă, nu cumpăra
            </p>
            <h2 className="mt-1 max-w-xs text-xl font-bold sm:text-2xl md:text-3xl">
              Ai grijă de un animal fără stăpân
            </h2>
            <Link
              href="/adoptii"
              className="mt-4 flex min-h-11 w-fit items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold"
            >
              Vezi adopțiile
            </Link>
          </div>
          <Image
            src="/images/hero-pets.png"
            alt="Cățel și pisică"
            width={150}
            height={165}
            className="hidden shrink-0 rounded-full sm:block"
          />
        </section>

        <section className="mt-8">
          <h3 className="mb-3 font-semibold">Explorează</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="card-hover flex min-h-11 flex-col items-center gap-2 rounded-2xl border p-4 text-center shadow-sm hover:border-primary"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </span>
                <span className="text-xs text-zinc-600 sm:text-sm">{label}</span>
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {listings.map((pet) => (
                <div key={pet.id} className="card-hover rounded-2xl border p-3 shadow-sm">
                  {pet.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pet.photo_url} alt={pet.name} className="mb-2 aspect-square w-full rounded-xl object-cover" />
                  ) : (
                    <PetPlaceholder className="mb-2 aspect-square w-full rounded-xl" />
                  )}
                  <p className="truncate font-medium">{pet.name}</p>
                  <p className="truncate text-xs text-zinc-500">
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

        <section className="mt-10">
          <h3 className="mb-3 font-semibold">De ce PawfectPair</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {valueProps.map((v) => (
              <div key={v.title} className="rounded-2xl border p-4 shadow-sm">
                <p className="font-medium">{v.title}</p>
                <p className="mt-1 text-sm text-zinc-500">{v.text}</p>
              </div>
            ))}
          </div>
        </section>

        {!user && (
          <div className="mt-8 rounded-2xl border p-4 text-center sm:p-6">
            <p className="mb-3 text-sm text-zinc-600">
              Creează un cont pentru a adăuga animale, programa vizite la
              veterinar și mai mult.
            </p>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white"
            >
              Autentificare / Cont nou
            </Link>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <ShareButton />
        </div>
      </main>
      <BottomNav />
    </>
  );
}
