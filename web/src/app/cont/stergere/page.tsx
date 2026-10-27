import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import DeleteAccountClient from "./DeleteAccountClient";

export const metadata: Metadata = {
  title: "Șterge contul — PetCare",
};

export default async function DeleteAccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell>
      <DeleteAccountClient />
    </AppShell>
  );
}
