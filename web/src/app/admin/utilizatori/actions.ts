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

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  return { supabase, adminId: user.id };
}

export async function changeRole(userId: string, formData: FormData) {
  const { supabase, adminId } = await requireAdmin();
  if (userId === adminId) throw new Error("Nu îți poți schimba propriul rol de aici.");

  const role = String(formData.get("role") ?? "user");
  await supabase.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/admin/utilizatori");
}

// We can't delete auth.users without a service-role key (not available to this app),
// so "remove" clears the user's public-facing content instead of the login itself.
export async function removeUserContent(userId: string) {
  const { supabase, adminId } = await requireAdmin();
  if (userId === adminId) throw new Error("Nu-ți poți șterge propriul cont de aici.");

  await Promise.all([
    supabase.from("pets").delete().eq("owner_id", userId),
    supabase.from("adoption_listings").delete().eq("posted_by", userId),
    supabase.from("products").delete().eq("seller_id", userId),
    supabase.from("vets").delete().eq("user_id", userId),
    supabase.from("forum_posts").delete().eq("author_id", userId),
    supabase.from("resq_cases").delete().eq("reporter_id", userId),
  ]);

  revalidatePath("/admin/utilizatori");
}
