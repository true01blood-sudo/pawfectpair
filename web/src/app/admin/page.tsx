import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateMarkup, importDemoProducts } from "./actions";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: settings } = await supabase
    .from("app_settings")
    .select("markup_percent")
    .eq("id", true)
    .single();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-xl font-bold sm:text-2xl">Panou Admin</h1>

      <section className="mt-6 rounded-2xl border p-4 sm:p-6">
        <h2 className="mb-3 font-semibold">Adaos comercial (markup) magazin</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Se aplică automat la produsele importate. Valoare curentă:{" "}
          <strong>{settings?.markup_percent ?? 15}%</strong>
        </p>
        <form action={updateMarkup} className="flex items-center gap-3">
          <input
            name="markup_percent"
            type="number"
            step="0.5"
            min="0"
            defaultValue={settings?.markup_percent ?? 15}
            className="min-h-11 w-32 rounded-xl border px-4"
          />
          <button className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-white">
            Salvează
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border p-4 sm:p-6">
        <h2 className="mb-2 font-semibold">Import produse demo</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Importă produse dintr-un API public gratuit de test (DummyJSON) și
          aplică automat markup-ul curent la preț. Nu este un furnizor real —
          util doar pentru a popula magazinul până la integrarea furnizorilor
          reali.
        </p>
        <form action={importDemoProducts}>
          <button className="min-h-11 rounded-full border px-5 text-sm font-semibold">
            Importă produse demo
          </button>
        </form>
      </section>
    </main>
  );
}
