import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { addPet, signOut } from "./actions";

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const { data: pets } = await supabase
    .from("pets")
    .select("id, name, species, breed")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              {profile?.full_name || "Profilul meu"}
            </h1>
            <p className="text-sm text-zinc-500">{user.email}</p>
          </div>
          <div className="flex gap-2">
            {profile?.role === "admin" && (
              <a href="/admin" className="flex min-h-11 items-center rounded-full border px-4 text-sm">
                Admin
              </a>
            )}
          <form action={signOut}>
            <button className="min-h-11 rounded-full border px-4 text-sm">
              Ieși din cont
            </button>
          </form>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="mb-3 font-semibold">Animalele mele</h2>
          {pets && pets.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {pets.map((pet) => (
                <li key={pet.id}>
                  <Link href={`/animale/${pet.id}`} className="block rounded-2xl border p-3 hover:border-primary">
                    <div className="mb-2 aspect-square w-full rounded-xl bg-zinc-100" />
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

          <form action={addPet} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <input name="name" placeholder="Nume" required className="min-h-11 rounded-xl border px-3 text-sm" />
            <select name="species" required className="min-h-11 rounded-xl border px-3 text-sm">
              <option value="">Specie</option>
              <option value="Câine">Câine</option>
              <option value="Pisică">Pisică</option>
              <option value="Altele">Altele</option>
            </select>
            <input name="breed" placeholder="Rasă (opțional)" className="min-h-11 rounded-xl border px-3 text-sm" />
            <button className="min-h-11 rounded-full bg-primary text-sm font-semibold text-white">
              Adaugă animal
            </button>
          </form>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
