"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const VALID_SPECIES = ["caine", "pisica", "altele"];
const VALID_GENDER = ["mascul", "femela"];

export async function createBreedingListing(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const species = String(formData.get("species") ?? "caine");
  const breed = String(formData.get("breed") ?? "").trim() || null;
  const gender = String(formData.get("gender") ?? "") || null;
  const age_years = formData.get("age_years") ? Number(formData.get("age_years")) : null;
  const pedigree_info = String(formData.get("pedigree_info") ?? "").trim() || null;
  const price_info = String(formData.get("price_info") ?? "").trim() || null;
  const city = String(formData.get("city") ?? "").trim() || null;
  const photo_url = String(formData.get("photo_url") ?? "").trim() || null;
  const photos = formData.getAll("photos").map(String).filter(Boolean).slice(0, 6);
  const health_tests = String(formData.get("health_tests") ?? "")
    .split(",").map((t) => t.trim()).filter(Boolean);
  const is_champion = formData.get("is_champion") === "on";
  const awards = String(formData.get("awards") ?? "")
    .split(",").map((a) => a.trim()).filter(Boolean).slice(0, 10);
  const litters_count = formData.get("litters_count") ? Number(formData.get("litters_count")) : 0;
  const offspring_count = formData.get("offspring_count") ? Number(formData.get("offspring_count")) : 0;

  if (!title || title.length < 3) throw new Error("Titlul anunțului e obligatoriu (minim 3 caractere).");
  if (!VALID_SPECIES.includes(species)) throw new Error("Specie invalidă.");
  if (gender && !VALID_GENDER.includes(gender)) throw new Error("Gen invalid.");

  const { data, error } = await supabase
    .from("breeding_listings")
    .insert({
      owner_id: user.id,
      title,
      description,
      species,
      breed,
      gender,
      age_years,
      pedigree_info,
      price_info,
      city,
      photo_url,
      photos,
      health_tests,
      is_champion,
      awards,
      litters_count,
      offspring_count,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/reproductie");
  redirect(`/reproductie/${data.id}`);
}

export async function submitBreedingReview(listingId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim() || null;
  if (rating < 1 || rating > 5) throw new Error("Alege o notă între 1 și 5 stele.");

  const { error } = await supabase
    .from("breeding_reviews")
    .upsert({ listing_id: listingId, user_id: user.id, rating, comment }, { onConflict: "listing_id,user_id" });
  if (error) throw new Error(error.message);

  revalidatePath(`/reproductie/${listingId}`);
}
