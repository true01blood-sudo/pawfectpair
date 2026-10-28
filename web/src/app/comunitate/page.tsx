import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { swipePet } from "./actions";
import { PetPlaceholder } from "@/components/PawPlaceholder";
import { SPECIES_OPTIONS } from "@/lib/species";
import PageBanner from "@/components/PageBanner";
import AppShell from "@/components/AppShell";

export default async function ComunitatePage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string; specie?: string; sex?: string }>;
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
      <AppShell>
        <main
        className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
          <PageBanner src="/images/pexels-comunitate.jpg" alt="Câine și pisică prieteni" title="Comunitate" subtitle="PetMatch — găsește companioni pentru animalul tău" />
          <p className="mt-4 text-sm text-muted">
            Adaugă mai întâi un animal în{" "}
            <Link href="/profil" className="text-primary underline">profilul tău</Link>{" "}
            pentru a începe să faci PetMatch.
          </p>
        </main>
      </AppShell>
      <BottomNav />
    </>
    );
  }

  const { pet: petParam, specie, sex } = await searchParams;
  const activePetId = petParam || myPets[0].id;

  const { data: alreadySwiped } = await supabase
    .from("pet_likes")
    .select("to_pet_id")
    .eq("from_pet_id", activePetId);
  const excludedIds = [
    activePetId,
    ...(alreadySwiped?.map((s) => s.to_pet_id) ?? []),
  ];

  let candidateQuery = supabase
    .from("pets")
    .select("id, name, species, breed, sex, photo_url, owner_id")
    .neq("owner_id", user.id)
    .not("id", "in", `(${excludedIds.join(",")})`);
  if (specie) candidateQuery = candidateQuery.eq("species", specie);
  if (sex) candidateQuery = candidateQuery.eq("sex", sex);
  const { data: candidates } = await candidateQuery.limit(1);

  const candidate = candidates?.[0];

  const { data: recentMatch } = await supabase
    .from("matches")
    .select("id")
    .or(`pet_a_id.eq.${activePetId},pet_b_id.eq.${activePetId}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  function buildHref(next: { specie?: string; sex?: string }) {
    const sp = new URLSearchParams();
    sp.set("pet", activePetId);
    if (next.specie) sp.set("specie", next.specie);
    if (next.sex) sp.set("sex", next.sex);
    return `/comunitate?${sp.toString()}`;
  }

  return (
    <>
      <AppShell>
        <main
        className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
        <PageBanner src="/images/pexels-comunitate.jpg" alt="Câine și pisică prieteni" title="PetMatch" subtitle="Descoperă companioni pentru animalul tău" />
        <div className="flex items-center justify-end">
          <Link href="/comunitate/mesaje" className="text-sm text-primary">
            Mesaje →
          </Link>
        </div>

        {myPets.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {myPets.map((p) => (
              <Link
                key={p.id}
                href={buildHref({ specie, sex })}
                className={`flex min-h-11 items-center rounded-full border px-4 text-sm ${
                  p.id === activePetId ? "border-primary bg-primary text-white" : "text-muted border-card-border"
                }`}
              >
                {p.name}
              </Link>
            ))}
          </div>
        )}

        <form method="get" className="mt-4 flex flex-wrap gap-2">
          <input type="hidden" name="pet" value={activePetId} />
          <select name="specie" defaultValue={specie ?? ""} className="min-h-11 rounded-full border px-4 text-sm">
            <option value="">Orice specie</option>
            {SPECIES_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select name="sex" defaultValue={sex ?? ""} className="min-h-11 rounded-full border px-4 text-sm">
            <option value="">Orice sex</option>
            <option value="male">Mascul</option>
            <option value="female">Femelă</option>
          </select>
          <button className="min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-white">
            Filtrează
          </button>
        </form>

        {recentMatch && (
          <div className="mt-4 rounded-2xl bg-primary/10 p-4 text-center text-sm text-primary">
            🎉 Ai un match nou! Vezi-l în{" "}
            <Link href="/comunitate/mesaje" className="underline">Mesaje</Link>.
          </div>
        )}

        <div className="mt-6">
          {candidate ? (
            <div className="rounded-2xl border border-card-border bg-card p-4">
              {candidate.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={candidate.photo_url} alt={candidate.name} className="aspect-square w-full rounded-xl object-cover" />
              ) : (
                <PetPlaceholder className="aspect-square w-full rounded-xl" />
              )}
              <p className="mt-3 text-lg font-semibold">{candidate.name}</p>
              <p className="text-sm text-muted">
                {candidate.breed || candidate.species}
                {candidate.sex === "male" ? " · mascul" : candidate.sex === "female" ? " · femelă" : ""}
              </p>

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
            <p className="rounded-2xl border border-dashed border-card-border p-8 text-center text-sm text-muted">
              Nu mai sunt animale noi de descoperit pentru acest filtru. Încearcă alte criterii sau revino mai
              târziu!
            </p>
          )}
        </div>
      </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
