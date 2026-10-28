import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import MemorialClient from "./MemorialClient";

export const metadata: Metadata = {
  title: "Memorial — PetCare",
  description: "Memoriale digitale pentru animalele dragi care au plecat.",
};

export default async function MemorialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myMemorials } = await supabase
    .from("pet_memorials")
    .select("*")
    .eq("user_id", user.id)
    .order("passed_at", { ascending: false });

  const { data: publicMemorials } = await supabase
    .from("pet_memorials")
    .select("id, pet_name, species, photo_url, tribute, passed_at, resting_place")
    .eq("is_public", true)
    .neq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <>
      <AppShell>
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <MemorialClient
            myMemorials={(myMemorials ?? []) as Record<string, unknown>[]}
            publicMemorials={(publicMemorials ?? []) as Record<string, unknown>[]}
            userId={user.id}
          />
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
