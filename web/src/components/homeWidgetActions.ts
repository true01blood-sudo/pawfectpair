"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function rsvpEvent(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("event_participants")
    .upsert({ event_id: eventId, user_id: user.id, status: "going" }, { onConflict: "event_id,user_id" });

  if (error) throw new Error(error.message);
  revalidatePath("/");
}
