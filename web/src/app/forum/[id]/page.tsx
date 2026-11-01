import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addComment } from "../actions";
import BackLink from "@/components/BackLink";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";

export default async function ForumPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("forum_posts")
    .select("id, title, body, category, created_at, profiles(full_name)")
    .eq("id", id)
    .single();
  if (!post) notFound();

  const { data: comments } = await supabase
    .from("forum_comments")
    .select("id, body, created_at, profiles(full_name)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const author = post.profiles as unknown as { full_name: string } | null;

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
          <BackLink href="/forum" label="Forum" />
          {post.category && (
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">{post.category}</span>
          )}
          <h1 className="mt-1 text-2xl font-bold" style={{ color: "var(--foreground)" }}>{post.title}</h1>
          <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{author?.full_name || "Utilizator"}</p>
          <p className="mt-4 whitespace-pre-line text-sm" style={{ color: "var(--foreground)" }}>{post.body}</p>

          <section className="mt-8">
            <h2 className="mb-3 font-semibold" style={{ color: "var(--foreground)" }}>Comentarii ({comments?.length ?? 0})</h2>
            <ul className="flex flex-col gap-3">
              {comments?.map((c) => {
                const commenter = c.profiles as unknown as { full_name: string } | null;
                return (
                  <li
                    key={c.id}
                    className="rounded-xl border p-3 text-sm"
                    style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
                  >
                    <p className="font-medium" style={{ color: "var(--foreground)" }}>{commenter?.full_name || "Utilizator"}</p>
                    <p className="mt-1" style={{ color: "var(--muted)" }}>{c.body}</p>
                  </li>
                );
              })}
            </ul>

            {user ? (
              <form action={addComment.bind(null, id)} className="mt-4 flex gap-2">
                <input
                  name="body"
                  placeholder="Scrie un răspuns..."
                  required
                  className="min-h-11 flex-1 rounded-full border px-4 text-sm"
                  style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}
                />
                <button className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                  Trimite
                </button>
              </form>
            ) : (
              <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
                <a href="/login" className="text-primary hover:underline">Autentifică-te</a> pentru a comenta.
              </p>
            )}
          </section>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
