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

export type PostComment = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
};

export async function fetchComments(postId: string): Promise<PostComment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_post_comments")
    .select("id, body, created_at, author_id, profiles(full_name, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  return (data ?? []).map((c) => {
    const author = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
    return {
      id: c.id,
      body: c.body,
      createdAt: c.created_at,
      authorId: c.author_id,
      authorName: author?.full_name ?? "Utilizator",
      authorAvatar: author?.avatar_url ?? null,
    };
  });
}

export async function addComment(postId: string, body: string): Promise<PostComment> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = body.trim();
  if (trimmed.length < 1 || trimmed.length > 500) {
    throw new Error("Comentariul trebuie să aibă între 1 și 500 de caractere.");
  }

  const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single();

  const { data, error } = await supabase
    .from("social_post_comments")
    .insert({ post_id: postId, author_id: user.id, body: trimmed })
    .select("id, body, created_at")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/");

  return {
    id: data.id,
    body: data.body,
    createdAt: data.created_at,
    authorId: user.id,
    authorName: profile?.full_name ?? "Utilizator",
    authorAvatar: profile?.avatar_url ?? null,
  };
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
