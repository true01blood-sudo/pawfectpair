import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { logSosEvent } from "./actions";
import PageBanner from "@/components/PageBanner";

export default async function SosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myPets } = await supabase
    .from("pets")
    .select("id, name, emergency_contact_name, emergency_contact_phone")
    .eq("owner_id", user.id);

  const { data: vets } = await supabase
    .from("vets")
    .select("id, clinic_name, city, phone")
    .not("phone", "is", null)
    .limit(10);

  return (
    <>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
        <PageBanner src="/images/pexels-sos.jpg" alt="Urgență veterinară" title="🆘 PetSOS" subtitle="Ajutor imediat pentru animalul tău" />
        <p className="mt-1 text-sm text-zinc-500">
          Pentru urgențe reale, sună imediat cea mai apropiată clinică veterinară de mai jos.
        </p>

        {(!myPets || myPets.length === 0) ? (
          <p className="mt-4 text-sm text-zinc-600">
            Adaugă mai întâi un animal în <a href="/profil" className="text-primary underline">profilul tău</a>.
          </p>
        ) : (
          <form action={logSosEvent} className="mt-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <select name="pet_id" required className="min-h-11 rounded-xl border px-3 text-sm">
              <option value="">Alege animalul</option>
              {myPets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select name="type" required className="min-h-11 rounded-xl border px-3 text-sm">
              <option value="medical">Urgență medicală</option>
              <option value="danger">Animal în pericol / blocat</option>
              <option value="lost">Animal pierdut</option>
            </select>
            <input name="notes" placeholder="Ce s-a întâmplat? (opțional)" className="min-h-11 rounded-xl border px-3 text-sm" />
            <button className="min-h-11 rounded-full bg-red-600 px-5 text-sm font-semibold text-white">
              Activează SOS
            </button>
          </form>
        )}

        <section className="mt-8">
          <h2 className="mb-3 font-semibold">Ghid rapid de prim ajutor</h2>
          <div className="flex flex-col gap-3 text-sm">
            <div className="rounded-xl border p-3">
              <p className="font-medium">Sângerare</p>
              <p className="text-zinc-600">Apasă ferm cu un material curat pe rană timp de 3 minute continuu. Nu folosi garou pe coadă/labe fără instrucțiuni medicale.</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="font-medium">Suspiciune de otrăvire</p>
              <p className="text-zinc-600">Nu induce voma fără indicația unui veterinar. Sună imediat clinica și, dacă poți, ia ambalajul substanței cu tine.</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="font-medium">Convulsii</p>
              <p className="text-zinc-600">Îndepărtează obiectele din jur, nu-i ține botul, nu pune mâna în gura animalului. Cronometrează durata și sună veterinarul.</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="font-medium">Căldură excesivă / insolație</p>
              <p className="text-zinc-600">Mută animalul la umbră, oferă apă puțină și des, răcorește cu prosop umed (nu apă rece ca gheața). Mergi de urgență la veterinar.</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            Acest ghid este orientativ și nu înlocuiește consultul veterinar de urgență.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 font-semibold">Clinici cu telefon disponibil</h2>
          {vets && vets.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {vets.map((v) => (
                <li key={v.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                  <span>{v.clinic_name} {v.city && `· ${v.city}`}</span>
                  <a href={`tel:${v.phone}`} className="min-h-11 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white">
                    Sună acum
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Niciun cabinet cu telefon înregistrat momentan.</p>
          )}
        </section>
      </main>
      <BottomNav />
    </>
  );
}
