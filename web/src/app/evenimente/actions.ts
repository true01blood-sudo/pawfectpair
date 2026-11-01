"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const VALID_TYPES = ["meetup", "adoption", "competition", "training", "expo", "charity", "other"];
const VALID_AUDIENCE = ["all", "dogs", "cats", "small_pets"];

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const event_type = String(formData.get("event_type") ?? "meetup");
  const audience = String(formData.get("audience") ?? "all");
  const city = String(formData.get("city") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim() || null;
  const starts_at = String(formData.get("starts_at") ?? "");
  const ends_at = String(formData.get("ends_at") ?? "");
  const max_participants = formData.get("max_participants") ? Number(formData.get("max_participants")) : null;
  const contact_phone = String(formData.get("contact_phone") ?? "").trim() || null;
  const photo_url = String(formData.get("photo_url") ?? "").trim() || null;

  if (!title || title.length < 3) throw new Error("Titlul evenimentului e obligatoriu (minim 3 caractere).");
  if (!city) throw new Error("Orașul e obligatoriu.");
  if (!starts_at || !ends_at) throw new Error("Perioada evenimentului e obligatorie.");
  if (!VALID_TYPES.includes(event_type)) throw new Error("Tip de eveniment invalid.");
  if (!VALID_AUDIENCE.includes(audience)) throw new Error("Audiență invalidă.");

  const { data, error } = await supabase
    .from("pet_events")
    .insert({
      organizer_id: user.id,
      title,
      description,
      event_type,
      audience,
      city,
      location,
      starts_at: new Date(starts_at).toISOString(),
      ends_at: new Date(ends_at).toISOString(),
      max_participants,
      contact_phone,
      photo_url,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/evenimente");
  redirect(`/evenimente/${data.id}`);
}

export async function setRsvp(eventId: string, status: "going" | "maybe" | "cancelled") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("event_participants")
    .upsert({ event_id: eventId, user_id: user.id, status }, { onConflict: "event_id,user_id" });
  if (error) throw new Error(error.message);

  revalidatePath(`/evenimente/${eventId}`);
  revalidatePath("/evenimente");
  revalidatePath("/");
}
