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

export async function updatePet(petId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const species = String(formData.get("species") ?? "").trim();
  const breed = String(formData.get("breed") ?? "").trim() || null;
  const sex = String(formData.get("sex") ?? "unknown");
  const birth_date = String(formData.get("birth_date") ?? "").trim() || null;
  const photo_url = String(formData.get("photo_url") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name || !species) throw new Error("Numele și specia sunt obligatorii.");

  const { error } = await supabase
    .from("pets")
    .update({ name, species, breed, sex, birth_date, photo_url, notes })
    .eq("id", petId)
    .eq("owner_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath(`/animale/${petId}`);
  revalidatePath("/profil");
}

export async function deletePet(petId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("pets").delete().eq("id", petId).eq("owner_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/profil");
  redirect("/profil");
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
