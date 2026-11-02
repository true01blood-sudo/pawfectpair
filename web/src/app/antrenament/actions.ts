"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function requestTrainerBooking(trainerId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const pet_id = String(formData.get("pet_id") ?? "");
  const requestedAt = String(formData.get("requested_at") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!pet_id || !requestedAt) throw new Error("Animalul și data sunt obligatorii.");

  const { error } = await supabase.from("trainer_bookings").insert({
    trainer_id: trainerId,
    pet_id,
    owner_id: user.id,
    requested_at: new Date(requestedAt).toISOString(),
    notes,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/antrenament/antrenori/${trainerId}`);
  revalidatePath("/programari");
}
