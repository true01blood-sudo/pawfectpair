import { notFound } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import TrainerDetailClient from "./TrainerDetailClient";

export default async function TrainerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trainer } = await supabase
    .from("edu_trainers")
    .select("id, display_name, bio, specialties, city, phone, photo_url, price_range, experience_years, verified")
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();

  if (!trainer) notFound();

  const user = await getUser();

  const { data: myPets } = user
    ? await supabase.from("pets").select("id, name, photo_url").eq("owner_id", user.id)
    : { data: null };

  return (
    <>
      <AppShell>
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <TrainerDetailClient
            trainer={trainer}
            myPets={myPets}
            isLoggedIn={!!user}
          />
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
