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
  const sex = String(formData.get("sex") ?? "unknown");
  const birth_date = String(formData.get("birth_date") ?? "").trim() || null;
  const photo_url = String(formData.get("photo_url") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name || !species) throw new Error("Numele și specia sunt obligatorii.");

  const { error } = await supabase
    .from("pets")
    .insert({ owner_id: user.id, name, species, breed, sex, birth_date, photo_url, notes });

  if (error) throw new Error(error.message);
  revalidatePath("/profil");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const avatar_url = String(formData.get("avatar_url") ?? "").trim() || null;

  if (!full_name) throw new Error("Numele este obligatoriu.");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, phone, avatar_url, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/profil");
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 6) throw new Error("Parola trebuie să aibă minimum 6 caractere.");
  if (password !== confirm) throw new Error("Parolele nu coincid.");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
  revalidatePath("/profil");
}
