import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { swipePet } from "./actions";

export default async function ComunitatePage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myPets } = await supabase
    .from("pets")
    .select("id, name")
    .eq("owner_id", user.id);

  if (!myPets || myPets.length === 0) {
    return (
      <>
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
          <h1 className="text-xl font-bold sm:text-2xl">Comunitate</h1>
          <p className="mt-4 text-sm text-zinc-600">
            Adaugă mai întâi un animal în{" "}
            <Link href="/profil" className="text-primary underline">profilul tău</Link>{" "}
            pentru a începe să faci PetMatch.
          </p>
        </main>
        <BottomNav />
      </>
    );
  }

  const { pet: petParam } = await searchParams;
  const activePetId = petParam || myPets[0].id;

  const { data: alreadySwiped } = await supabase
    .from("pet_likes")
    .select("to_pet_id")
    .eq("from_pet_id", activePetId);
  const excludedIds = [
    activePetId,
    ...(alreadySwiped?.map((s) => s.to_pet_id) ?? []),
  ];

  const { data: candidates } = await supabase
    .from("pets")
    .select("id, name, species, breed, owner_id")
    .neq("owner_id", user.id)
    .not("id", "in", `(${excludedIds.join(",")})`)
    .limit(1);

  const candidate = candidates?.[0];

  const { data: recentMatch } = await supabase
    .from("matches")
    .select("id")
    .or(`pet_a_id.eq.${activePetId},pet_b_id.eq.${activePetId}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold sm:text-2xl">PetMatch</h1>
          <Link href="/comunitate/mesaje" className="text-sm text-primary">
            Mesaje
          </Link>
        </div>

        {myPets.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {myPets.map((p) => (
              <Link
                key={p.id}
                href={`/comunitate?pet=${p.id}`}
                className={`flex min-h-11 items-center rounded-full border px-4 text-sm ${
                  p.id === activePetId ? "border-primary bg-primary text-white" : "text-zinc-600"
                }`}
              >
                {p.name}
              </Link>
            ))}
          </div>
        )}

        {recentMatch && (
          <div className="mt-4 rounded-2xl bg-primary/10 p-4 text-center text-sm text-primary">
            🎉 Ai un match nou! Vezi-l în{" "}
            <Link href="/comunitate/mesaje" className="underline">Mesaje</Link>.
          </div>
        )}

        <div className="mt-6">
          {candidate ? (
            <div className="rounded-2xl border p-4">
              <div className="aspect-square w-full rounded-xl bg-zinc-100" />
              <p className="mt-3 text-lg font-semibold">{candidate.name}</p>
              <p className="text-sm text-zinc-500">{candidate.breed || candidate.species}</p>

              <div className="mt-4 flex gap-3">
                <form action={swipePet.bind(null, activePetId, candidate.id, false)} className="flex-1">
                  <button className="min-h-11 w-full rounded-full border font-semibold">
                    ✕ Nu, mulțumesc
                  </button>
                </form>
                <form action={swipePet.bind(null, activePetId, candidate.id, true)} className="flex-1">
                  <button className="min-h-11 w-full rounded-full bg-primary font-semibold text-white">
                    ❤️ Îmi place
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-zinc-500">
              Nu mai sunt animale noi de descoperit momentan. Revino mai
              târziu!
            </p>
          )}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
