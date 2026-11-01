import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";

export default async function ProgramareConfirmataPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: appt } = await supabase
    .from("vet_appointments")
    .select("id, starts_at, reason, pets(name, photo_url), vets(clinic_name, address), vet_services(name, price_cents, currency)")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!appt) notFound();

  const pet = appt.pets as unknown as { name: string; photo_url: string | null } | null;
  const vet = appt.vets as unknown as { clinic_name: string; address: string | null } | null;
  const service = appt.vet_services as unknown as { name: string; price_cents: number; currency: string } | null;

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-md flex-1 px-4 py-10 flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full flex items-center justify-center text-3xl" style={{ background: "color-mix(in srgb, #16a34a 14%, transparent)" }}>
            ✓
          </div>
          <h1 className="text-xl font-bold mt-4" style={{ color: "var(--foreground)" }}>Cerere de programare trimisă!</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {vet?.clinic_name} te va contacta pentru confirmare.
          </p>

          <div className="mt-6 w-full rounded-2xl border p-4 text-left" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
            <div className="flex items-center gap-3">
              {pet?.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pet.photo_url} alt={pet.name} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-lg" style={{ background: "var(--surface)" }}>🐾</div>
              )}
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{pet?.name}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{vet?.clinic_name}{vet?.address ? ` · ${vet.address}` : ""}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 text-sm" style={{ borderTop: "1px solid var(--card-border)" }}>
              <p style={{ color: "var(--foreground)" }}>
                📅 {new Date(appt.starts_at).toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
              </p>
              {appt.reason && <p className="mt-1" style={{ color: "var(--muted)" }}>{appt.reason}</p>}
              {service && (
                <div className="mt-2 flex items-center justify-between font-bold">
                  <span style={{ color: "var(--foreground)" }}>{service.name}</span>
                  <span style={{ color: "var(--primary)" }}>{(service.price_cents / 100).toFixed(0)} {service.currency}</span>
                </div>
              )}
            </div>
          </div>

          <Link href="/programari" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-white">
            Vezi programările mele
          </Link>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
