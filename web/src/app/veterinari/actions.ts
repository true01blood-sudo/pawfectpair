"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function registerVet(formData: FormData) {
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

  if (!clinic_name) throw new Error("Numele cabinetului este obligatoriu.");

  const { error } = await supabase
    .from("vets")
    .insert({ user_id: user.id, clinic_name, city, address, phone, bio });
  if (error) throw new Error(error.message);

  await supabase.from("profiles").update({ role: "vet" }).eq("id", user.id);

  redirect("/veterinari");
}

export async function bookAppointment(vetId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const pet_id = String(formData.get("pet_id") ?? "");
  const starts_at = String(formData.get("starts_at") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!pet_id || !starts_at) throw new Error("Animalul și data sunt obligatorii.");

  const { error } = await supabase.from("vet_appointments").insert({
    vet_id: vetId,
    pet_id,
    owner_id: user.id,
    starts_at: new Date(starts_at).toISOString(),
    reason,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/programari");
  redirect("/programari");
}
