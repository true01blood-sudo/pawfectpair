"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function becomeSeller() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("profiles").update({ role: "shop" }).eq("id", user.id);
  redirect("/magazin/produsele-mele");
}

export async function placeOrder(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: product } = await supabase
    .from("products")
    .select("price_cents, currency, stock")
    .eq("id", productId)
    .single();
  if (!product || product.stock < 1) throw new Error("Produs indisponibil.");

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({ buyer_id: user.id, total_cents: product.price_cents, currency: product.currency })
    .select("id")
    .single();
  if (orderErr) throw new Error(orderErr.message);

  await supabase.from("order_items").insert({
    order_id: order.id,
    product_id: productId,
    quantity: 1,
    unit_price_cents: product.price_cents,
  });

  revalidatePath(`/magazin/${productId}`);
}
