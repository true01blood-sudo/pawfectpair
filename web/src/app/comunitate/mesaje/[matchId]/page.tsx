import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "../../actions";
import BackLink from "@/components/BackLink";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: match } = await supabase
    .from("matches")
    .select("id, user_a_id, user_b_id, pet_a:pet_a_id(name), pet_b:pet_b_id(name)")
    .eq("id", matchId)
    .single();
  if (!match || (match.user_a_id !== user.id && match.user_b_id !== user.id)) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, body, sender_id, created_at")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  const myPetIsA = match.user_a_id === user.id;
  const petA = match.pet_a as unknown as { name: string } | null;
  const petB = match.pet_b as unknown as { name: string } | null;
  const otherPetName = myPetIsA ? petB?.name : petA?.name;

  return (
    <>
      <AppShell>
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
          <BackLink href="/comunitate/mesaje" label="Mesaje" />
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--foreground)" }}>
            Chat cu stăpânul lui {otherPetName}
          </h1>

          <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
            {messages && messages.length > 0 ? (
              messages.map((m) => {
                const mine = m.sender_id === user.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[75%] rounded-2xl px-4 py-2 text-sm"
                      style={
                        mine
                          ? { background: "var(--primary)", color: "white" }
                          : { background: "var(--card-bg)", border: "1px solid var(--card-border)", color: "var(--foreground)" }
                      }
                    >
                      {m.body}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
                Aveți un match! Trimiteți primul mesaj.
              </p>
            )}
          </div>

          <form action={sendMessage.bind(null, matchId)} className="mt-4 flex gap-2">
            <input
              name="body"
              placeholder="Scrie un mesaj..."
              required
              className="min-h-11 flex-1 rounded-full border px-4 text-sm bg-transparent"
              style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
            />
            <button className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
              Trimite
            </button>
          </form>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
