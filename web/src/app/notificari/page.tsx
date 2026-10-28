import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import NotificariClient from "./NotificariClient";

export const metadata: Metadata = {
  title: "Notificări — PetCare",
  description: "Notificările tale din PetCare.",
};

export default async function NotificariPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const unreadCount = (notifications ?? []).filter((n) => !n.is_read).length;

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
          <NotificariClient
            notifications={(notifications ?? []) as Record<string, unknown>[]}
            unreadCount={unreadCount}
          />
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
