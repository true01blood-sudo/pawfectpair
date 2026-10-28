"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addPet(formData: FormData) {
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
    .insert({ owner_id: user.id, name, species, breed, sex, birth_date, photo_url, notes });

  if (error) throw new Error(error.message);

  revalidatePath("/animale");
  revalidatePath("/profil");
  redirect("/animale");
}
