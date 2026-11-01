"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const VALID_SERVICES = [
  "dog_walking", "home_visits", "sitting_at_owner", "sitting_at_sitter",
  "daycare", "boarding", "transport",
];

const VALID_AMENITIES = [
  "curte", "climatizare", "webcam_live", "supraveghere_24_7", "plimbari_zilnice",
  "ingrijire_medicala", "grooming_inclus", "transport_inclus", "camere_individuale",
  "zona_joaca",
];

export async function registerPensiune(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const price_from = formData.get("price_from") ? Number(formData.get("price_from")) : null;
  const price_unit = String(formData.get("price_unit") ?? "day");
  const max_pets = formData.get("max_pets") ? Number(formData.get("max_pets")) : null;
  const accepts_dogs = formData.get("accepts_dogs") === "on";
  const accepts_cats = formData.get("accepts_cats") === "on";
  const accepts_other = formData.get("accepts_other") === "on";
  const services = formData.getAll("services").map(String).filter((s) => VALID_SERVICES.includes(s));
  const amenities = formData.getAll("amenities").map(String).filter((a) => VALID_AMENITIES.includes(a));
  const photo_url = String(formData.get("photo_url") ?? "").trim() || null;
  const photos = formData.getAll("photos").map(String).filter(Boolean).slice(0, 6);

  if (!title || title.length < 3) throw new Error("Numele unității e obligatoriu (minim 3 caractere).");
  if (!city) throw new Error("Orașul e obligatoriu.");
  if (services.length === 0) throw new Error("Alege cel puțin un serviciu oferit.");

  const { error } = await supabase.from("petday_listings").insert({
    user_id: user.id,
    provider_type: "center",
    title,
    description,
    services,
    amenities,
    city,
    address,
    phone,
    price_from,
    price_unit,
    max_pets,
    accepts_dogs,
    accepts_cats,
    accepts_other,
    photo_url,
    photos,
  });
  if (error) throw new Error(error.message);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role === "user") {
    await supabase.from("profiles").update({ role: "pensiune" }).eq("id", user.id);
  }

  revalidatePath("/pensiuni");
  redirect("/pensiuni");
}

export async function submitPensiuneReview(listingId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim() || null;
  if (rating < 1 || rating > 5) throw new Error("Alege o notă între 1 și 5 stele.");

  const { error } = await supabase
    .from("petday_reviews")
    .upsert({ listing_id: listingId, user_id: user.id, rating, comment }, { onConflict: "listing_id,user_id" });
  if (error) throw new Error(error.message);

  revalidatePath(`/pensiuni/${listingId}`);
}

export async function createBooking(listingId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const pet_id = String(formData.get("pet_id") ?? "") || null;
  const starts_at = String(formData.get("starts_at") ?? "");
  const ends_at = String(formData.get("ends_at") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!starts_at || !ends_at) throw new Error("Perioada este obligatorie.");

  const { error } = await supabase.from("petday_bookings").insert({
    listing_id: listingId,
    owner_id: user.id,
    pet_id,
    starts_at: new Date(starts_at).toISOString(),
    ends_at: new Date(ends_at).toISOString(),
    note,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/pensiuni/${listingId}`);
}
