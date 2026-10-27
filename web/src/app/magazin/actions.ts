"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CartCheckoutInput = {
  items: { productId: string; quantity: number }[];
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_county: string;
  payment_method: "cod" | "card" | "bank_transfer";
  notes?: string;
};

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

export async function placeCartOrder(
  input: CartCheckoutInput
): Promise<{ orderId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Trebuie să fii autentificat." };
  if (!input.items.length) return { error: "Coșul este gol." };

  let totalCents = 0;
  let currency = "RON";
  const validItems: {
    productId: string;
    quantity: number;
    unit_price_cents: number;
  }[] = [];

  for (const item of input.items) {
    const { data: product } = await supabase
      .from("products")
      .select("price_cents, currency, stock")
      .eq("id", item.productId)
      .single();
    if (!product || product.stock < item.quantity) {
      return { error: "Un produs nu mai este disponibil în cantitatea solicitată." };
    }
    totalCents += product.price_cents * item.quantity;
    currency = product.currency ?? "RON";
    validItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unit_price_cents: product.price_cents,
    });
  }

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      buyer_id: user.id,
      total_cents: totalCents,
      currency,
      shipping_name: input.shipping_name,
      shipping_phone: input.shipping_phone,
      shipping_address: input.shipping_address,
      shipping_city: input.shipping_city,
      shipping_county: input.shipping_county,
      payment_method: input.payment_method,
      payment_status: "pending",
      notes: input.notes ?? null,
    })
    .select("id")
    .single();
  if (orderErr) return { error: orderErr.message };

  const { error: itemsErr } = await supabase.from("order_items").insert(
    validItems.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      quantity: i.quantity,
      unit_price_cents: i.unit_price_cents,
    }))
  );
  if (itemsErr) return { error: itemsErr.message };

  revalidatePath("/magazin");
  revalidatePath("/magazin/comenzile-mele");
  return { orderId: order.id };
}
