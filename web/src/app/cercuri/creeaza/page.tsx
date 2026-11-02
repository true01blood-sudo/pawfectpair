import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import BackLink from "@/components/BackLink";
import { createCircle } from "../actions";

export const metadata: Metadata = {
  title: "Creează un cerc — PetCare",
};

export default async function CreeazaCercPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
          <BackLink href="/cercuri" label="Cercuri" />
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
            Creează un cerc
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            Un club, o echipă rescue sau un grup de organizare de events.
          </p>

          <form action={createCircle} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Nume *</label>
              <input
                name="name"
                required
                minLength={3}
                maxLength={80}
                placeholder="Ex: Prietenii Golden Retriever"
                className="min-h-11 w-full rounded-xl border px-3 text-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Tip</label>
              <select
                name="type"
                defaultValue="club"
                className="min-h-11 w-full rounded-xl border px-3 text-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}
              >
                <option value="club">Club</option>
                <option value="rescue">Rescue</option>
                <option value="events">Events</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Specie</label>
              <select
                name="species"
                defaultValue="general"
                className="min-h-11 w-full rounded-xl border px-3 text-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}
              >
                <option value="general">General</option>
                <option value="caine">Câini</option>
                <option value="pisica">Pisici</option>
                <option value="altele">Altele</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Oraș (opțional)</label>
              <input
                name="city"
                maxLength={60}
                placeholder="Ex: Cluj-Napoca"
                className="min-h-11 w-full rounded-xl border px-3 text-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Descriere (opțional)</label>
              <textarea
                name="description"
                rows={3}
                maxLength={500}
                placeholder="Despre ce e acest cerc..."
                className="w-full rounded-xl border p-3 text-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}
              />
            </div>

            <button
              type="submit"
              className="min-h-11 self-start rounded-full bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              Creează cercul
            </button>
          </form>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
