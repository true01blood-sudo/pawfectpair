"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addMedicalRecord(petId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const type = String(formData.get("type") ?? "other");
  const title = String(formData.get("title") ?? "").trim();
  const record_date =
    String(formData.get("record_date") ?? "").trim() || new Date().toISOString().slice(0, 10);
  const next_due_date = String(formData.get("next_due_date") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!title) throw new Error("Titlul este obligatoriu.");

  const { error } = await supabase.from("medical_records").insert({
    pet_id: petId,
    created_by: user.id,
    type,
    title,
    record_date,
    next_due_date,
    notes,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/animale/${petId}`);
}

export async function addWeightLog(petId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const weight_kg = Number(formData.get("weight_kg") ?? 0);
  if (weight_kg <= 0) throw new Error("Greutatea trebuie să fie mai mare ca 0.");

  const { error } = await supabase.from("weight_logs").insert({ pet_id: petId, weight_kg });
  if (error) throw new Error(error.message);

  await supabase.from("pets").update({ weight_kg }).eq("id", petId);

  revalidatePath(`/animale/${petId}`);
}
