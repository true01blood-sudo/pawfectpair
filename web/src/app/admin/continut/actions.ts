"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");
  return supabase;
}

export async function updateListingStatus(id: string, status: string) {
  const supabase = await requireAdmin();
  await supabase.from("adoption_listings").update({ status }).eq("id", id);
  revalidatePath("/admin/continut");
  revalidatePath("/adoptii");
}

export async function deleteListing(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("adoption_listings").delete().eq("id", id);
  revalidatePath("/admin/continut");
  revalidatePath("/adoptii");
}

export async function deleteForumPost(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("forum_posts").delete().eq("id", id);
  revalidatePath("/admin/continut");
}

export async function updateResqStatus(id: string, status: string) {
  const supabase = await requireAdmin();
  await supabase.from("resq_cases").update({ status }).eq("id", id);
  revalidatePath("/admin/continut");
}

export async function deleteResqCase(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("resq_cases").delete().eq("id", id);
  revalidatePath("/admin/continut");
}
