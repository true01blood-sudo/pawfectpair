"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function joinCircle(circleId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("circle_members").insert({ circle_id: circleId, user_id: user.id });
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);

  revalidatePath("/cercuri");
}

export async function leaveCircle(circleId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("circle_members")
    .delete()
    .eq("circle_id", circleId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/cercuri");
}

export async function createCircle(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const type = String(formData.get("type") ?? "club");
  const species = String(formData.get("species") ?? "general");
  const city = String(formData.get("city") ?? "").trim() || null;

  if (name.length < 3) throw new Error("Numele cercului trebuie să aibă cel puțin 3 caractere.");
  if (!["club", "rescue", "events"].includes(type)) throw new Error("Tip invalid.");
  if (!["general", "caine", "pisica", "altele"].includes(species)) throw new Error("Specie invalidă.");

  const { data, error } = await supabase
    .from("circles")
    .insert({ created_by: user.id, name, description, type, species, city, is_public: true })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("circle_members").insert({ circle_id: data.id, user_id: user.id, role: "admin" });

  revalidatePath("/cercuri");
  redirect("/cercuri");
}
