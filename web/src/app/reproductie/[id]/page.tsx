import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import BreedingDetailClient from "./BreedingDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("breeding_listings")
    .select("title, breed")
    .eq("id", id)
    .single();
  return {
    title: data ? `${data.title} — PetCare Reproducție` : "Partener reproducție — PetCare",
  };
}

export default async function BreedingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Anuntul si userul curent nu depind unul de altul — pornite in paralel
  const [{ data: listing }, user] = await Promise.all([
    supabase.from("breeding_listings").select("*").eq("id", id).eq("status", "active").single(),
    getUser(),
  ]);

  if (!listing) notFound();

  // Profilul proprietarului si recenziile nu depind unul de altul — paralel
  const [{ data: owner }, { data: reviews }] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url, is_verified").eq("id", listing.owner_id).single(),
    supabase
      .from("breeding_reviews")
      .select("user_id, rating, comment, created_at, profiles(full_name)")
      .eq("listing_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <AppShell>
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <BreedingDetailClient
            listing={listing as Record<string, unknown>}
            owner={owner as Record<string, unknown> | null}
            reviews={(reviews ?? []) as unknown as Array<{ user_id: string; rating: number; comment: string | null; created_at: string; profiles: { full_name: string } | null }>}
            currentUserId={user?.id ?? null}
            isLoggedIn={!!user}
          />
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
