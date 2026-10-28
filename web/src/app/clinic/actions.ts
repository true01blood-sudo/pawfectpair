"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateClinicProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const clinic_name = String(formData.get("clinic_name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;

  if (!clinic_name) throw new Error("Numele clinicii este obligatoriu.");

  const { error } = await supabase
    .from("vets")
    .update({ clinic_name, city, address, phone, bio })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/clinic");
  revalidatePath("/clinic/setari");
  revalidatePath("/clinic/profil");
  revalidatePath("/veterinari");
}

export async function addClinicDocument(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: vet } = await supabase
    .from("vets")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!vet) throw new Error("Nu ai un cabinet înregistrat.");

  const title = String(formData.get("title") ?? "").trim();
  const file_url = String(formData.get("file_url") ?? "").trim();

  if (!title || !file_url) throw new Error("Titlul și fișierul sunt obligatorii.");

  const { error } = await supabase
    .from("clinic_documents")
    .insert({ vet_id: vet.id, title, file_url });

  if (error) throw new Error(error.message);

  revalidatePath("/clinic/dovezi");
  revalidatePath("/clinic");
}
