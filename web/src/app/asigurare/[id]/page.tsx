import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import PolicyDetailClient from "./PolicyDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("insurance_policies")
    .select("provider, policy_type")
    .eq("id", id)
    .single();
  return {
    title: data ? `${data.provider} — Detalii poliță — PetCare` : "Detalii poliță — PetCare",
  };
}

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: policy } = await supabase
    .from("insurance_policies")
    .select("*, pets(name, species, breed)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!policy) notFound();

  const { data: claims } = await supabase
    .from("insurance_claims")
    .select("*")
    .eq("policy_id", id)
    .order("created_at", { ascending: false });

  return (
    <>
      <AppShell>
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <PolicyDetailClient
            policy={policy as Record<string, unknown>}
            claims={(claims ?? []) as Record<string, unknown>[]}
          />
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
