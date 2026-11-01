import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import BookingWizard from "./BookingWizard";

export default async function RezervaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ serviciu?: string }>;
}) {
  const { id } = await params;
  const { serviciu } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: vet } = await supabase.from("vets").select("id, clinic_name").eq("id", id).single();
  if (!vet) notFound();

  const [{ data: pets }, { data: services }] = await Promise.all([
    supabase.from("pets").select("id, name, photo_url").eq("owner_id", user.id),
    supabase.from("vet_services").select("id, name, duration_minutes, price_cents, currency").eq("vet_id", id).order("price_cents", { ascending: true }),
  ]);

  if (!pets || pets.length === 0) redirect("/profil");

  return (
    <>
      <AppShell>
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <BookingWizard
            vetId={id}
            clinicName={vet.clinic_name}
            pets={pets}
            services={services ?? []}
            initialServiceId={serviciu ?? null}
          />
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
