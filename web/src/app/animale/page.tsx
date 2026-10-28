import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Animalele mele — PetCare",
  description: "Gestionează profilurile animalelor tale de companie.",
};

function ageString(birthDate: string | null): string {
  if (!birthDate) return "";
  const diff = Date.now() - new Date(birthDate).getTime();
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
  if (years > 0) return `${years} an${years > 1 ? "i" : ""} ${months > 0 ? `${months} lun${months > 1 ? "i" : "ă"}` : ""}`.trim();
  return `${months} lun${months > 1 ? "i" : "ă"}`;
}

const SPECIES_EMOJI: Record<string, string> = {
  dog: "🐕", cat: "🐈", bird: "🐦", rabbit: "🐇", hamster: "🐹",
  fish: "🐠", turtle: "🐢", other: "🐾",
};

export default async function AnimelePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pets } = await supabase
    .from("pets")
    .select("id, name, species, breed, birth_date, photo_url, sex")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
    <AppShell>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              Animalele mele
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {pets?.length ?? 0} animal{(pets?.length ?? 0) !== 1 ? "e" : ""}
            </p>
          </div>
          <Link
            href="/animale/adauga"
            className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark transition-colors"
          >
            + Adaugă
          </Link>
        </div>

        {/* Pet list */}
        {pets && pets.length > 0 ? (
          <div className="flex flex-col gap-4">
            {pets.map((pet) => {
              const emoji = SPECIES_EMOJI[pet.species as string] ?? "🐾";
              return (
                <div
                  key={pet.id}
                  className="group flex items-center gap-4 rounded-2xl border p-4 transition-all hover:shadow-md hover:border-primary/40"
                  style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                >
                  <Link href={`/sanatate/${pet.id}`} className="flex flex-1 min-w-0 items-center gap-4">
                    {/* Photo or emoji */}
                    <div
                      className="relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden flex items-center justify-center"
                      style={{ background: "color-mix(in srgb, var(--primary) 8%, transparent)" }}
                    >
                      {pet.photo_url ? (
                        <Image
                          src={pet.photo_url}
                          alt={pet.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <span className="text-3xl">{emoji}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base" style={{ color: "var(--foreground)" }}>
                        {pet.name}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                        {[pet.breed, ageString(pet.birth_date)].filter(Boolean).join(" · ")}
                      </p>
                      {(pet.sex === "male" || pet.sex === "female") && (
                        <span
                          className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                            color: "var(--primary)",
                          }}
                        >
                          {pet.sex === "male" ? "Mascul" : "Femelă"}
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <Link
                      href={`/sanatate/${pet.id}`}
                      className="rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                      style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
                    >
                      Dosar medical
                    </Link>
                    <Link
                      href={`/gps?petId=${pet.id}`}
                      className="rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                      style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
                    >
                      GPS
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="rounded-2xl border-2 border-dashed p-16 text-center"
            style={{ borderColor: "var(--card-border)" }}
          >
            <div className="text-6xl mb-4">🐾</div>
            <p className="font-bold text-lg" style={{ color: "var(--foreground)" }}>
              Niciun animal adăugat
            </p>
            <p className="text-sm mt-2 mb-6" style={{ color: "var(--muted)" }}>
              Adaugă primul tău animal de companie pentru a-i gestiona sănătatea, programările și mai mult.
            </p>
            <Link
              href="/animale/adauga"
              className="inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark transition-colors"
            >
              Adaugă primul animal
            </Link>
          </div>
        )}

        {/* Quick actions */}
        {pets && pets.length > 0 && (
          <div
            className="mt-6 rounded-2xl border p-4"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
              Acces rapid
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/sanatate", label: "Sănătate", emoji: "🏥" },
                { href: "/programari", label: "Programări", emoji: "📅" },
                { href: "/asigurare", label: "Asigurare", emoji: "🛡️" },
                { href: "/gps", label: "GPS Live", emoji: "📍" },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                  style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                >
                  <span>{a.emoji}</span>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </AppShell>
    <BottomNav />
    </>
  );
}
