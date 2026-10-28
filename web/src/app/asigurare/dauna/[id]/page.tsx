import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import BackLink from "@/components/BackLink";
import { submitClaim } from "../../actions";

export default async function DepuneDaunaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: policy } = await supabase
    .from("insurance_policies")
    .select("id, provider, pets(name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!policy) notFound();
  const pet = policy.pets as unknown as { name: string } | null;

  const inputStyle = {
    borderColor: "var(--card-border)",
    color: "var(--foreground)",
    background: "var(--card-bg)",
  };

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
          <BackLink href={`/asigurare/${id}`} label="Detalii poliță" />
          <h1 className="text-xl font-bold sm:text-2xl mt-2" style={{ color: "var(--foreground)" }}>
            Depune daună
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {policy.provider}{pet ? ` · ${pet.name}` : ""}
          </p>

          <form action={submitClaim.bind(null, id)} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                Descriere <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                required
                rows={4}
                placeholder="Ce s-a întâmplat, ce cheltuieli vrei să recuperezi..."
                className="w-full rounded-xl border p-4 text-sm resize-none"
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                  Sumă (RON) <span className="text-red-500">*</span>
                </label>
                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0"
                  className="w-full min-h-11 rounded-xl border px-4 text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                  Data daunei <span className="text-red-500">*</span>
                </label>
                <input name="claim_date" type="date" required className="w-full min-h-11 rounded-xl border px-4 text-sm" style={inputStyle} />
              </div>
            </div>

            <button
              type="submit"
              className="self-start rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--primary)" }}
            >
              Trimite dosarul
            </button>
          </form>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
