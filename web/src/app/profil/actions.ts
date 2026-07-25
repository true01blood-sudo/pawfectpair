"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

  if (!name || !species) throw new Error("Numele și specia sunt obligatorii.");

  const { error } = await supabase
    .from("pets")
    .insert({ owner_id: user.id, name, species, breed });

  if (error) throw new Error(error.message);
  revalidatePath("/profil");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
