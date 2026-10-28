import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import BackLink from "@/components/BackLink";

function ageString(birthDate: string | null): string {
  if (!birthDate) return "Necunoscută";
  const years = Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  return `${years} an${years === 1 ? "" : "i"}`;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-b-0" style={{ borderColor: "var(--card-border)" }}>
      <span className="text-sm" style={{ color: "var(--muted)" }}>{label}</span>
      <span className="text-sm font-semibold text-right" style={{ color: "var(--foreground)" }}>{children}</span>
    </div>
  );
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-bold"
      style={
        ok
          ? { background: "color-mix(in srgb, #16a34a 14%, transparent)", color: "#16a34a" }
          : { background: "color-mix(in srgb, #6b7280 14%, transparent)", color: "#6b7280" }
      }
    >
      {ok ? "✓ Da" : "— Nu"}
    </span>
  );
}

export default async function PasaportPage({
  params,
}: {
  params: Promise<{ petId: string }>;
}) {
  const { petId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pet } = await supabase
    .from("pets")
    .select(
      "id, name, species, breed, sex, birth_date, photo_url, pedigree_registered, pedigree_registry, pedigree_number, oug50_microchip, oug50_registration, oug50_insurance, oug50_category"
    )
    .eq("id", petId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!pet) notFound();

  const { data: vaccinations } = await supabase
    .from("medical_records")
    .select("id, title, record_date, next_due_date, notes")
    .eq("pet_id", petId)
    .eq("type", "vaccination")
    .order("record_date", { ascending: false });

  const rabiesShots = (vaccinations ?? []).filter((v) => v.title.toLowerCase().includes("rab"));

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
          <BackLink href={`/sanatate/${petId}`} label={pet.name} />

          <div className="mt-2 mb-6 flex items-center gap-3">
            <span className="text-3xl">🛂</span>
            <div>
              <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--foreground)" }}>
                Pașaport & Travel Pack
              </h1>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{pet.name}</p>
            </div>
          </div>

          {/* Identity */}
          <section
            className="rounded-2xl border p-4 mb-6"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <h2 className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>
              Identificare
            </h2>
            <Row label="Specie / rasă">{pet.breed ? `${pet.breed} (${pet.species})` : pet.species}</Row>
            <Row label="Sex">{pet.sex === "male" ? "Mascul" : pet.sex === "female" ? "Femelă" : "Necunoscut"}</Row>
            <Row label="Vârstă">{ageString(pet.birth_date)}</Row>
            <Row label="Microchip implantat"><StatusBadge ok={pet.oug50_microchip} /></Row>
          </section>

          {/* Pedigree */}
          <section
            className="rounded-2xl border p-4 mb-6"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <h2 className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>
              Pedigree
            </h2>
            <Row label="Înregistrat în carte de origine"><StatusBadge ok={pet.pedigree_registered} /></Row>
            {pet.pedigree_registered && (
              <>
                <Row label="Registru">{pet.pedigree_registry ?? "—"}</Row>
                <Row label="Nr. pedigree">{pet.pedigree_number ?? "—"}</Row>
              </>
            )}
          </section>

          {/* OUG 55/2002 compliance, only if relevant */}
          {pet.oug50_category > 0 && (
            <section
              className="rounded-2xl border p-4 mb-6"
              style={{
                background: "color-mix(in srgb, #d97706 6%, transparent)",
                borderColor: "color-mix(in srgb, #d97706 20%, transparent)",
              }}
            >
              <h2 className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: "#d97706" }}>
                Conformitate OUG 55/2002 — Categoria {pet.oug50_category}
              </h2>
              <Row label="Înregistrare">{<StatusBadge ok={pet.oug50_registration} />}</Row>
              <Row label="Asigurare RC">{<StatusBadge ok={pet.oug50_insurance} />}</Row>
            </section>
          )}

          {/* Vaccinations */}
          <section
            className="rounded-2xl border p-4"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                Vaccinări {rabiesShots.length > 0 ? "(inclusiv antirabică)" : ""}
              </h2>
              <Link href={`/sanatate/${petId}/adauga`} className="text-xs font-semibold text-primary hover:underline">
                + Adaugă
              </Link>
            </div>
            {vaccinations && vaccinations.length > 0 ? (
              vaccinations.map((v) => (
                <Row key={v.id} label={new Date(v.record_date).toLocaleDateString("ro-RO")}>
                  {v.title}
                </Row>
              ))
            ) : (
              <p className="py-4 text-sm text-center" style={{ color: "var(--muted)" }}>
                Nicio vaccinare înregistrată încă.
              </p>
            )}
          </section>

          <p className="mt-6 text-xs text-center" style={{ color: "var(--muted)" }}>
            Pentru călătorii internaționale, pașaportul oficial UE pentru animale de companie se obține de la un
            medic veterinar autorizat — acest rezumat nu îl înlocuiește.
          </p>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
