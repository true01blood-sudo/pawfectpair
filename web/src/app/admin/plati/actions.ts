"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  return supabase;
}

const KNOWN_PROVIDERS = ["stripe", "payu", "netopia", "revolut"] as const;

export async function updatePaymentProvider(formData: FormData) {
  const supabase = await requireAdmin();
  const provider = String(formData.get("provider") ?? "");
  if (!KNOWN_PROVIDERS.includes(provider as (typeof KNOWN_PROVIDERS)[number])) {
    throw new Error("Procesator necunoscut.");
  }

  const enabled = formData.get("enabled") === "on";
  const test_mode = formData.get("test_mode") === "on";
  const public_key = String(formData.get("public_key") ?? "").trim() || null;
  const secret_key_input = String(formData.get("secret_key") ?? "").trim();
  const webhook_secret = String(formData.get("webhook_secret") ?? "").trim() || null;

  const patch: Record<string, unknown> = {
    enabled,
    test_mode,
    public_key,
    webhook_secret,
    updated_at: new Date().toISOString(),
  };
  // Cheia secretă nu e pre-completată în formular (nu o retrimitem niciodată
  // către client) — o actualizăm doar dacă adminul a scris ceva nou în câmp.
  if (secret_key_input) patch.secret_key = secret_key_input;

  const { error } = await supabase
    .from("subscription_payment_providers")
    .update(patch)
    .eq("provider", provider);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/plati");
}
