"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function reportCase(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const type = String(formData.get("type") ?? "lost");
  const name = String(formData.get("name") ?? "").trim();
  const species = String(formData.get("species") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const city = String(formData.get("city") ?? "").trim() || null;
  const last_seen_location = String(formData.get("last_seen_location") ?? "").trim() || null;
  const contact_phone = String(formData.get("contact_phone") ?? "").trim() || null;
  const pet_id = String(formData.get("pet_id") ?? "").trim() || null;

  if (!name || !species) throw new Error("Numele și specia sunt obligatorii.");

  const { data, error } = await supabase
    .from("resq_cases")
    .insert({
      reporter_id: user.id,
      pet_id,
      type,
      name,
      species,
      description,
      city,
      last_seen_location,
      contact_phone,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  redirect(`/resq/${data.id}`);
}

export async function resolveCase(caseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("resq_cases").update({ status: "resolved" }).eq("id", caseId);
  revalidatePath(`/resq/${caseId}`);
  revalidatePath("/resq");
}
