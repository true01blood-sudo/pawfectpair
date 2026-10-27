import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateMarkup, importDemoProducts, importPetFoodFacts, addArticle } from "./actions";
import Breadcrumb from "@/components/Breadcrumb";

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
      <Breadcrumb items={[{ href: "/", label: "Acasă" }, { href: "/profil", label: "Profil" }, { label: "Panou Admin" }]} />
      <h1 className="text-xl font-bold sm:text-2xl">Panou Admin</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/admin/utilizatori" className="flex min-h-11 items-center rounded-full border px-4 text-sm">
          Utilizatori
        </Link>
        <Link href="/admin/comenzi" className="flex min-h-11 items-center rounded-full border px-4 text-sm">
          Comenzi
        </Link>
      </div>

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

      <section className="mt-6 rounded-2xl border p-4 sm:p-6">
        <h2 className="mb-2 font-semibold">Import produse reale (Open Pet Food Facts)</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Bază de date deschisă și gratuită, specifică animalelor de companie
          (nume, brand, poză). Nu conține prețuri de retail — produsele
          importate apar cu &quot;Preț de stabilit&quot; până când le
          actualizezi din Produsele mele.
        </p>
        <form action={importPetFoodFacts} className="flex flex-wrap items-center gap-3">
          <select name="category" className="min-h-11 rounded-xl border px-4 text-sm">
            <option value="dog-food">Hrană câini</option>
            <option value="cat-food">Hrană pisici</option>
            <option value="dog-treats">Recompense câini</option>
          </select>
          <button className="min-h-11 rounded-full border px-5 text-sm font-semibold">
            Importă produse reale
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border p-4 sm:p-6">
        <h2 className="mb-3 font-semibold">Adaugă articol educațional (PetEdu)</h2>
        <form action={addArticle} className="flex flex-col gap-3">
          <input name="title" placeholder="Titlu" required className="min-h-11 rounded-xl border px-4 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <select name="species" className="min-h-11 rounded-xl border px-3 text-sm">
              <option value="general">General</option>
              <option value="caine">Câini</option>
              <option value="pisica">Pisici</option>
              <option value="altele">Altele</option>
            </select>
            <input name="category" placeholder="Categorie (ex: nutriție)" className="min-h-11 rounded-xl border px-3 text-sm" />
          </div>
          <textarea name="body" placeholder="Conținut sfat/articol" rows={4} required className="rounded-xl border p-3 text-sm" />
          <button className="min-h-11 self-start rounded-full bg-primary px-5 text-sm font-semibold text-white">
            Publică articolul
          </button>
        </form>
      </section>
    </main>
  );
}
