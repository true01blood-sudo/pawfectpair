import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import DeleteAccountClient from "./DeleteAccountClient";

export const metadata: Metadata = {
  title: "Șterge contul — PetCare",
};

export default async function DeleteAccountPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <AppShell>
      <DeleteAccountClient />
    </AppShell>
  );
}
