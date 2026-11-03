import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import { PetPlaceholder } from "@/components/PawPlaceholder";

export default async function CautarePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim();
  const supabase = await createClient();

  const hasQuery = q.length >= 2;
  const like = `%${q}%`;

  const [
    { data: people },
    { data: pets },
    { data: vets },
    { data: products },
  ] = hasQuery
    ? await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, role").ilike("full_name", like).limit(10),
        supabase.from("pets").select("id, name, species, breed, photo_url, owner_id").ilike("name", like).limit(10),
        supabase.from("vets").select("id, clinic_name, city, address").ilike("clinic_name", like).limit(10),
        supabase.from("products").select("id, name, price_cents, currency, photo_url").eq("status", "active").ilike("name", like).limit(10),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const totalResults = (people?.length ?? 0) + (pets?.length ?? 0) + (vets?.length ?? 0) + (products?.length ?? 0);

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
          <form method="get" action="/cautare" className="mb-6">
            <div
              className="flex items-center gap-2 rounded-full px-4 py-2.5"
              style={{ background: "var(--surface)", border: "1px solid var(--card-border)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)", flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Caută persoane, animale, servicii sau produse..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--foreground)" }}
                autoFocus
              />
            </div>
          </form>

          {!hasQuery ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Scrie cel puțin 2 caractere pentru a căuta.
            </p>
          ) : totalResults === 0 ? (
            <div className="rounded-2xl border-2 border-dashed p-10 text-center" style={{ borderColor: "var(--card-border)" }}>
              <p className="text-3xl mb-2">🔍</p>
              <p className="font-semibold" style={{ color: "var(--foreground)" }}>
                Niciun rezultat pentru &quot;{q}&quot;
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {people && people.length > 0 && (
                <ResultSection title="Persoane">
                  {people.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl p-2">
                      {p.avatar_url ? (
                        <Image src={p.avatar_url} alt={p.full_name ?? ""} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "var(--primary)" }}>
                          {(p.full_name ?? "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{p.full_name}</span>
                    </div>
                  ))}
                </ResultSection>
              )}

              {pets && pets.length > 0 && (
                <ResultSection title="Animale">
                  {pets.map((pet) => (
                    <Link key={pet.id} href={`/animale/${pet.id}`} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-primary/5">
                      {pet.photo_url ? (
                        <Image src={pet.photo_url} alt={pet.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <PetPlaceholder className="h-10 w-10 rounded-full" />
                      )}
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{pet.name}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>{pet.breed ?? pet.species}</p>
                      </div>
                    </Link>
                  ))}
                </ResultSection>
              )}

              {vets && vets.length > 0 && (
                <ResultSection title="Servicii — veterinari">
                  {vets.map((v) => (
                    <Link key={v.id} href={`/veterinari/${v.id}`} className="flex flex-col rounded-xl p-2 transition-colors hover:bg-primary/5">
                      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{v.clinic_name}</span>
                      {(v.city || v.address) && (
                        <span className="text-xs" style={{ color: "var(--muted)" }}>{[v.address, v.city].filter(Boolean).join(", ")}</span>
                      )}
                    </Link>
                  ))}
                </ResultSection>
              )}

              {products && products.length > 0 && (
                <ResultSection title="Produse">
                  {products.map((prod) => (
                    <Link key={prod.id} href={`/magazin/${prod.id}`} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-primary/5">
                      {prod.photo_url ? (
                        <Image src={prod.photo_url} alt={prod.name} width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg" style={{ background: "var(--surface)" }} />
                      )}
                      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{prod.name}</span>
                    </Link>
                  ))}
                </ResultSection>
              )}
            </div>
          )}
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{title}</h2>
      <div className="rounded-2xl border p-1.5" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
        {children}
      </div>
    </section>
  );
}
