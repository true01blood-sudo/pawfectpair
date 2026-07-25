import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

export default async function MesajePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: matches } = await supabase
    .from("matches")
    .select("id, created_at, pet_a:pet_a_id(id,name), pet_b:pet_b_id(id,name), user_a_id, user_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  type MatchRow = {
    id: string;
    pet_a: { id: string; name: string } | null;
    pet_b: { id: string; name: string } | null;
    user_a_id: string;
  };

  return (
    <>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
        <h1 className="text-xl font-bold sm:text-2xl">Mesaje</h1>

        {matches && matches.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {(matches as unknown as MatchRow[]).map((m) => {
              const myPetIsA = m.user_a_id === user.id;
              const myPet = myPetIsA ? m.pet_a : m.pet_b;
              const otherPet = myPetIsA ? m.pet_b : m.pet_a;
              return (
                <li key={m.id}>
                  <Link
                    href={`/comunitate/mesaje/${m.id}`}
                    className="card-hover flex min-h-11 items-center justify-between rounded-xl border p-3 text-sm shadow-sm hover:border-primary"
                  >
                    <span>
                      <strong>{myPet?.name}</strong> ↔ {otherPet?.name}
                    </span>
                    <span className="text-primary">Deschide</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed p-8 text-center text-sm text-zinc-500">
            Niciun match încă. Mergi la{" "}
            <Link href="/comunitate" className="text-primary underline">PetMatch</Link>{" "}
            pentru a descoperi animale compatibile.
          </p>
        )}
      </main>
      <BottomNav />
    </>
  );
}
