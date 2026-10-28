import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  const { data: { user } } = await supabase.auth.getUser();

  const { data: listing } = await supabase
    .from("breeding_listings")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (!listing) notFound();

  // Fetch owner profile
  const { data: owner } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, is_verified")
    .eq("id", listing.owner_id)
    .single();

  return (
    <>
      <AppShell>
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <BreedingDetailClient
            listing={listing as Record<string, unknown>}
            owner={owner as Record<string, unknown> | null}
            isLoggedIn={!!user}
          />
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
