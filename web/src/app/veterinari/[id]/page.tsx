import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import VetDetailClient from "./VetDetailClient";

export default async function VetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vet } = await supabase
    .from("vets")
    .select("*")
    .eq("id", id)
    .single();

  if (!vet) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: myPets }, { data: reviews }, { data: services }] = await Promise.all([
    user
      ? supabase.from("pets").select("id, name").eq("owner_id", user.id)
      : Promise.resolve({ data: null }),
    supabase
      .from("vet_reviews")
      .select("user_id, rating, comment, profiles(full_name)")
      .eq("vet_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("vet_services")
      .select("id, name, duration_minutes, price_cents, currency")
      .eq("vet_id", id)
      .order("price_cents", { ascending: true }),
  ]);

  return (
    <>
      <AppShell>
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <VetDetailClient
            vet={vet as Record<string, unknown>}
            services={(services ?? []) as Array<{ id: string; name: string; duration_minutes: number | null; price_cents: number; currency: string }>}
            reviews={(reviews ?? []) as unknown as Array<{ user_id: string; rating: number; comment: string | null; profiles: { full_name: string } | null }>}
            myPets={myPets}
            isOwner={!!user && user.id === vet.user_id}
            isLoggedIn={!!user}
            currentUserId={user?.id ?? null}
          />
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
