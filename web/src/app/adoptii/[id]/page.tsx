import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import AdoptiiDetailClient from "./AdoptiiDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("adoption_listings")
    .select("name, breed, species")
    .eq("id", id)
    .single();
  return {
    title: data ? `Adoptă pe ${data.name} (${data.breed ?? data.species}) — PetCare` : "Adopție — PetCare",
  };
}

export default async function AdoptieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Anuntul si userul curent nu depind unul de altul — pornite in paralel
  const [{ data: listing }, user] = await Promise.all([
    supabase.from("adoption_listings").select("*").eq("id", id).single(),
    getUser(),
  ]);

  if (!listing) notFound();

  const isOwner = user?.id === listing.posted_by;

  const { data: myApplication } = user && !isOwner
    ? await supabase
        .from("adoption_applications")
        .select("id, status")
        .eq("listing_id", id)
        .eq("applicant_id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <>
      <AppShell>
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <AdoptiiDetailClient
            listing={listing as Parameters<typeof AdoptiiDetailClient>[0]["listing"]}
            isLoggedIn={!!user}
            isOwner={isOwner}
            myApplication={myApplication}
          />
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
