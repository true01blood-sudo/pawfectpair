"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;

  if (!title || !body) throw new Error("Titlul și conținutul sunt obligatorii.");

  const { data, error } = await supabase
    .from("forum_posts")
    .insert({ author_id: user.id, title, body, category })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  redirect(`/forum/${data.id}`);
}

export async function addComment(postId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await supabase.from("forum_comments").insert({ post_id: postId, author_id: user.id, body });
  revalidatePath(`/forum/${postId}`);
}
