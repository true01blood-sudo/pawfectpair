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

export async function updateMarkup(formData: FormData) {
  const supabase = await requireAdmin();
  const markup_percent = Number(formData.get("markup_percent") ?? 15);

  await supabase
    .from("app_settings")
    .update({ markup_percent, updated_at: new Date().toISOString() })
    .eq("id", true);

  revalidatePath("/admin");
}

// Demo product import from a free public sample-data API (DummyJSON).
// Not a real pet-supplier feed — used to demonstrate the import + markup pipeline
// until real supplier integrations are connected.
export async function importDemoProducts() {
  const supabase = await requireAdmin();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("app_settings")
    .select("markup_percent")
    .eq("id", true)
    .single();
  const markup = settings?.markup_percent ?? 15;

  const res = await fetch("https://dummyjson.com/products/category/pet-supplies", {
    cache: "no-store",
  });
  let items: { title: string; price: number; thumbnail: string; category: string; stock: number }[] = [];
  if (res.ok) {
    const json = await res.json();
    items = json.products ?? [];
  }
  // Fallback: general products if the pet-supplies category is empty on the demo API
  if (items.length === 0) {
    const fallback = await fetch("https://dummyjson.com/products?limit=10", { cache: "no-store" });
    const json = await fallback.json();
    items = json.products ?? [];
  }

  const rows = items.map((p) => {
    const base_price_cents = Math.round(p.price * 100);
    return {
      seller_id: user!.id,
      name: p.title,
      category: p.category,
      base_price_cents,
      price_cents: Math.round(base_price_cents * (1 + markup / 100)),
      stock: p.stock ?? 10,
      photo_url: p.thumbnail,
      source: "dummyjson-demo",
    };
  });

  if (rows.length > 0) {
    await supabase.from("products").insert(rows);
  }

  revalidatePath("/magazin");
  revalidatePath("/admin");
}
