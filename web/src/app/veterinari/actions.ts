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
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const photo_url = String(formData.get("photo_url") ?? "").trim() || null;
  const photos = formData.getAll("photos").map(String).filter(Boolean).slice(0, 6);
  const is_licensed = formData.get("is_licensed") === "on";
  const experienced_team = formData.get("experienced_team") === "on";
  const modern_facility = formData.get("modern_facility") === "on";

  if (!clinic_name || !address || !phone) {
    throw new Error("Numele, adresa și telefonul cabinetului sunt obligatorii.");
  }

  const { data, error } = await supabase
    .from("vets")
    .insert({
      user_id: user.id, clinic_name, city, address, phone, bio,
      photo_url, photos, is_licensed, experienced_team, modern_facility,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("profiles").update({ role: "vet" }).eq("id", user.id);

  redirect(`/veterinari/${data.id}`);
}

export async function updateVetProfile(vetId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const clinic_name = String(formData.get("clinic_name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const photo_url = String(formData.get("photo_url") ?? "").trim() || null;
  const photos = formData.getAll("photos").map(String).filter(Boolean).slice(0, 6);
  const is_licensed = formData.get("is_licensed") === "on";
  const experienced_team = formData.get("experienced_team") === "on";
  const modern_facility = formData.get("modern_facility") === "on";

  if (!clinic_name || !address || !phone) {
    throw new Error("Numele, adresa și telefonul cabinetului sunt obligatorii.");
  }

  const { error } = await supabase
    .from("vets")
    .update({
      clinic_name, city, address, phone, bio,
      photo_url, photos, is_licensed, experienced_team, modern_facility,
    })
    .eq("id", vetId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/veterinari/${vetId}`);
  redirect(`/veterinari/${vetId}`);
}

export async function addVetService(vetId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const duration_minutes = formData.get("duration_minutes") ? Number(formData.get("duration_minutes")) : null;
  const price_cents = Math.round(Number(formData.get("price") ?? 0) * 100);

  if (!name) throw new Error("Numele serviciului e obligatoriu.");

  const { error } = await supabase.from("vet_services").insert({
    vet_id: vetId,
    name,
    duration_minutes,
    price_cents,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/veterinari/${vetId}`);
}

export async function deleteVetService(vetId: string, serviceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("vet_services").delete().eq("id", serviceId);
  if (error) throw new Error(error.message);

  revalidatePath(`/veterinari/${vetId}`);
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
  const service_id = String(formData.get("service_id") ?? "").trim() || null;

  if (!pet_id || !starts_at) throw new Error("Animalul și data sunt obligatorii.");

  const { data, error } = await supabase
    .from("vet_appointments")
    .insert({
      vet_id: vetId,
      pet_id,
      owner_id: user.id,
      starts_at: new Date(starts_at).toISOString(),
      reason,
      service_id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/programari");
  redirect(`/programari/${data.id}/confirmat`);
}

export async function submitReview(vetId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim() || null;
  if (rating < 1 || rating > 5) throw new Error("Alege o notă între 1 și 5 stele.");

  const { error } = await supabase
    .from("vet_reviews")
    .upsert({ vet_id: vetId, user_id: user.id, rating, comment }, { onConflict: "vet_id,user_id" });
  if (error) throw new Error(error.message);

  revalidatePath(`/veterinari/${vetId}`);
}
