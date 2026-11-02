"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function toggleReaction(postId: string, reaction: "heart" | "thumbup" | "smile" = "heart") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("social_post_reactions")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .eq("reaction", reaction)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("social_post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .eq("reaction", reaction);
  } else {
    await supabase
      .from("social_post_reactions")
      .insert({ post_id: postId, user_id: user.id, reaction });
  }

  revalidatePath("/");
}

export async function createPost(body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = body.trim();
  if (trimmed.length < 1 || trimmed.length > 2000) {
    throw new Error("Textul postării trebuie să aibă între 1 și 2000 de caractere.");
  }

  const { error } = await supabase.from("social_posts").insert({
    author_id: user.id,
    post_type: "update",
    body: trimmed,
    is_public: true,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/");
}
