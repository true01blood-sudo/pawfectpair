"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addPolicy(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const provider = String(formData.get("provider") ?? "").trim();
  const policy_type = String(formData.get("policy_type") ?? "comprehensive");
  const policy_number = String(formData.get("policy_number") ?? "").trim() || null;
  const pet_id = String(formData.get("pet_id") ?? "").trim() || null;
  const premium_cents = Math.round(Number(formData.get("premium") ?? 0) * 100);
  const start_date = String(formData.get("start_date") ?? "");
  const end_date = String(formData.get("end_date") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!provider || !start_date || !end_date) {
    throw new Error("Asigurătorul și datele de valabilitate sunt obligatorii.");
  }

  const { data, error } = await supabase
    .from("insurance_policies")
    .insert({
      user_id: user.id,
      pet_id,
      provider,
      policy_number,
      policy_type,
      premium_cents,
      start_date,
      end_date,
      notes,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/asigurare");
  redirect(`/asigurare/${data.id}`);
}

export async function submitClaim(policyId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const description = String(formData.get("description") ?? "").trim();
  const amount_cents = Math.round(Number(formData.get("amount") ?? 0) * 100);
  const claim_date = String(formData.get("claim_date") ?? "");

  if (!description || !claim_date) {
    throw new Error("Descrierea și data daunei sunt obligatorii.");
  }

  const { error } = await supabase.from("insurance_claims").insert({
    policy_id: policyId,
    user_id: user.id,
    description,
    amount_cents,
    claim_date,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/asigurare/${policyId}`);
  revalidatePath("/asigurare");
  redirect(`/asigurare/${policyId}`);
}
