"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createListing(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const species = String(formData.get("species") ?? "").trim();
  const breed = String(formData.get("breed") ?? "").trim() || null;
  const ageYearsRaw = formData.get("age_years");
  const age_years = ageYearsRaw ? Number(ageYearsRaw) : null;
  const sex = String(formData.get("sex") ?? "unknown");
  const size = String(formData.get("size") ?? "medium");
  const city = String(formData.get("city") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const photo_url = String(formData.get("photo_url") ?? "").trim() || null;

  if (!name || !species) {
    throw new Error("Numele și specia sunt obligatorii.");
  }

  const { data, error } = await supabase
    .from("adoption_listings")
    .insert({
      posted_by: user.id,
      name,
      species,
      breed,
      age_years,
      sex,
      size,
      city,
      description,
      photo_url,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/adoptii/${data.id}`);
}
