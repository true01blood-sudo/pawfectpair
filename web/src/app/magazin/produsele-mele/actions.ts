"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  const priceRaw = Number(formData.get("price") ?? 0);
  const stock = Number(formData.get("stock") ?? 0);
  const photo_url = String(formData.get("photo_url") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name || priceRaw <= 0) throw new Error("Numele și prețul sunt obligatorii.");

  const { error } = await supabase.from("products").insert({
    seller_id: user.id,
    name,
    category,
    price_cents: Math.round(priceRaw * 100),
    stock,
    photo_url,
    description,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/magazin/produsele-mele");
}

export async function updatePrice(productId: string, formData: FormData) {
  const supabase = await createClient();
  const price = Number(formData.get("price") ?? 0);
  if (price <= 0) throw new Error("Prețul trebuie să fie mai mare ca 0.");
  await supabase
    .from("products")
    .update({ price_cents: Math.round(price * 100) })
    .eq("id", productId);
  revalidatePath("/magazin/produsele-mele");
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", productId);
  revalidatePath("/magazin/produsele-mele");
}
