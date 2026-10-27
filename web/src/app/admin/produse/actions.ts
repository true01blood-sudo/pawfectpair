"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");
  return { supabase, userId: user.id };
}

export async function addProduct(formData: FormData) {
  const { supabase, userId } = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "general").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const price_str = String(formData.get("price") ?? "0");
  const stock_str = String(formData.get("stock") ?? "0");
  const photo_url = String(formData.get("photo_url") ?? "").trim() || null;
  const external_url = String(formData.get("external_url") ?? "").trim() || null;

  if (!name) throw new Error("Numele produsului este obligatoriu.");

  const price_cents = Math.round(parseFloat(price_str) * 100);
  const stock = parseInt(stock_str, 10) || 0;

  await supabase.from("products").insert({
    seller_id: userId,
    name,
    category,
    description,
    price_cents,
    base_price_cents: price_cents,
    stock,
    photo_url,
    external_url,
    source: "admin",
  });

  revalidatePath("/admin/produse");
  revalidatePath("/magazin");
}

export async function updateProduct(id: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "general").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const price_str = String(formData.get("price") ?? "0");
  const stock_str = String(formData.get("stock") ?? "0");
  const photo_url = String(formData.get("photo_url") ?? "").trim() || null;
  const external_url = String(formData.get("external_url") ?? "").trim() || null;

  if (!name) throw new Error("Numele produsului este obligatoriu.");

  const price_cents = Math.round(parseFloat(price_str) * 100);
  const stock = parseInt(stock_str, 10) || 0;

  await supabase.from("products").update({
    name, category, description, price_cents, stock, photo_url, external_url,
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  revalidatePath("/admin/produse");
  revalidatePath("/magazin");
}

export async function deleteProduct(id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/admin/produse");
  revalidatePath("/magazin");
}
