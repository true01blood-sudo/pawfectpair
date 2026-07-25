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

// Real pet-product data (names, brands, photos) from the free, open
// Open Pet Food Facts database. It has no retail price field (it's a
// nutrition database, not a shop), so imported items land with
// price_cents = 0 ("Preț de stabilit") until a seller sets a real price.
export async function importPetFoodFacts(formData: FormData) {
  const supabase = await requireAdmin();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const category = String(formData.get("category") ?? "dog-food");

  const res = await fetch(
    `https://world.openpetfoodfacts.org/facets/categories/${encodeURIComponent(category)}.json?page_size=12&fields=product_name,brands,image_front_small_url`,
    { cache: "no-store" },
  );
  if (!res.ok) return;
  const json = await res.json();
  type PoffProduct = { product_name?: string; brands?: string; image_front_small_url?: string };
  const items: PoffProduct[] = json.products ?? [];

  const rows = items
    .filter((p) => p.product_name)
    .map((p) => ({
      seller_id: user!.id,
      name: p.brands ? `${p.product_name} (${p.brands})` : p.product_name!,
      category,
      price_cents: 0,
      stock: 10,
      photo_url: p.image_front_small_url || null,
      source: "openpetfoodfacts",
    }));

  if (rows.length > 0) {
    await supabase.from("products").insert(rows);
  }

  revalidatePath("/magazin");
  revalidatePath("/admin");
}
