import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PetPlaceholder } from "@/components/PawPlaceholder";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "acum";
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "ieri";
  if (diffD < 7) return `${diffD} zile`;
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
}

export default async function MesajePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: matches } = await supabase
    .from("matches")
    .select("id, user_a_id, user_b_id, pet_a:pet_a_id(name, photo_url), pet_b:pet_b_id(name, photo_url)")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const conversations = await Promise.all(
    (matches ?? []).map(async (m) => {
      const myPetIsA = m.user_a_id === user.id;
      const otherPet = (myPetIsA ? m.pet_b : m.pet_a) as unknown as { name: string; photo_url: string | null } | null;

      const { data: lastMsg } = await supabase
        .from("messages")
        .select("body, created_at, sender_id")
        .eq("match_id", m.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        matchId: m.id as string,
        petName: otherPet?.name ?? "Utilizator",
        petPhoto: otherPet?.photo_url ?? null,
        lastBody: lastMsg?.body ?? null,
        lastAt: lastMsg?.created_at ?? null,
      };
    })
  );

  conversations.sort((a, b) => {
    const ta = a.lastAt ? new Date(a.lastAt).getTime() : 0;
    const tb = b.lastAt ? new Date(b.lastAt).getTime() : 0;
    return tb - ta;
  });

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
          <h1 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>Mesaje</h1>

          {conversations.length > 0 ? (
            <div className="space-y-2">
              {conversations.map((c) => (
                <Link
                  key={c.matchId}
                  href={`/comunitate/mesaje/${c.matchId}`}
                  className="flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:border-primary/40"
                  style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                >
                  {c.petPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.petPhoto} alt={c.petName} className="h-11 w-11 rounded-full object-cover shrink-0" />
                  ) : (
                    <PetPlaceholder className="h-11 w-11 rounded-full shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{c.petName}</p>
                      {c.lastAt && (
                        <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>{relativeTime(c.lastAt)}</span>
                      )}
                    </div>
                    <p className="text-sm truncate mt-0.5" style={{ color: "var(--muted)" }}>
                      {c.lastBody ?? "Aveți un match! Trimiteți primul mesaj."}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed p-8 text-center text-sm" style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}>
              Nicio conversație încă. Fă un match în PetMatch din Comunitate ca să începi să discuți.
            </p>
          )}
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
