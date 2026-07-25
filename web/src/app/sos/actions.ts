"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logSosEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const pet_id = String(formData.get("pet_id") ?? "");
  const type = String(formData.get("type") ?? "medical");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!pet_id) throw new Error("Selectează animalul.");

  await supabase.from("sos_events").insert({ pet_id, owner_id: user.id, type, notes });

  if (type === "lost") {
    redirect(`/resq/nou?pet=${pet_id}`);
  }
}
