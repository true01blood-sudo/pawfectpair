import { requireAdminModule } from "@/lib/admin-access";
import Breadcrumb from "@/components/Breadcrumb";
import { updateMarkup, updateAppVersion, importDemoProducts, importPetFoodFacts, addArticle } from "../actions";

export default async function AdminSetariPage() {
  const { supabase } = await requireAdminModule("setari");

  const { data: settings } = await supabase
    .from("app_settings")
    .select("markup_percent, min_app_version, update_message, ios_store_url, android_store_url")
    .eq("id", true)
    .single();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ href: "/admin", label: "Admin" }, { label: "Setări platformă" }]} />
      <h1 className="text-xl font-bold sm:text-2xl">Setări platformă</h1>

      <section className="mt-6 rounded-2xl border p-4 sm:p-6" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
        <h2 className="mb-3 font-semibold">Adaos comercial (markup) magazin</h2>
        <p className="mb-3 text-sm" style={{ color: "var(--muted)" }}>
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
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}
          />
          <button className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-white">
            Salvează
          </button>
        </form>
      </section>

      <section className="mt-4 rounded-2xl border p-4 sm:p-6" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
        <h2 className="mb-3 font-semibold">Versiune minimă aplicație mobilă</h2>
        <p className="mb-3 text-sm" style={{ color: "var(--muted)" }}>
          Dacă un utilizator are instalată o versiune mai veche decât cea de aici, aplicația îi blochează
          ecranul la deschidere cu un mesaj de update obligatoriu. Lasă câmpul gol ca să dezactivezi blocarea.
        </p>
        <form action={updateAppVersion} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
              Versiune minimă obligatorie (ex: 1.2.0)
            </label>
            <input
              name="min_app_version"
              placeholder="ex: 1.2.0 — gol = fără blocare"
              defaultValue={settings?.min_app_version ?? ""}
              className="min-h-11 w-full rounded-xl border px-4 text-sm"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Mesaj afișat (opțional)</label>
            <textarea
              name="update_message"
              rows={2}
              placeholder="A apărut o versiune nouă cu îmbunătățiri importante. Actualizează aplicația ca să continui."
              defaultValue={settings?.update_message ?? ""}
              className="w-full rounded-xl border p-3 text-sm"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Link Google Play (opțional)</label>
              <input
                name="android_store_url"
                placeholder="https://play.google.com/store/apps/details?id=app.pawfectpair.mobile"
                defaultValue={settings?.android_store_url ?? ""}
                className="min-h-11 w-full rounded-xl border px-4 text-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Link App Store (opțional)</label>
              <input
                name="ios_store_url"
                placeholder="https://apps.apple.com/..."
                defaultValue={settings?.ios_store_url ?? ""}
                className="min-h-11 w-full rounded-xl border px-4 text-sm"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}
              />
            </div>
          </div>
          <button className="min-h-11 self-start rounded-full bg-primary px-5 text-sm font-semibold text-white">
            Salvează
          </button>
        </form>
      </section>

      <section className="mt-4 rounded-2xl border p-4 sm:p-6" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
        <h2 className="mb-2 font-semibold">Import produse demo</h2>
        <p className="mb-3 text-sm" style={{ color: "var(--muted)" }}>
          Importă produse dintr-un API public gratuit de test (DummyJSON) și aplică automat markup-ul curent.
        </p>
        <form action={importDemoProducts}>
          <button className="min-h-11 rounded-full border px-5 text-sm font-semibold"
            style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}>
            Importă produse demo
          </button>
        </form>
      </section>

      <section className="mt-4 rounded-2xl border p-4 sm:p-6" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
        <h2 className="mb-2 font-semibold">Import produse reale (Open Pet Food Facts)</h2>
        <p className="mb-3 text-sm" style={{ color: "var(--muted)" }}>
          Bază de date deschisă specifică animalelor de companie. Produsele apar cu &quot;Preț de stabilit&quot; până la actualizare.
        </p>
        <form action={importPetFoodFacts} className="flex flex-wrap items-center gap-3">
          <select name="category" className="min-h-11 rounded-xl border px-4 text-sm"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}>
            <option value="dog-food">Hrană câini</option>
            <option value="cat-food">Hrană pisici</option>
            <option value="dog-treats">Recompense câini</option>
          </select>
          <button className="min-h-11 rounded-full border px-5 text-sm font-semibold"
            style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}>
            Importă produse reale
          </button>
        </form>
      </section>

      <section className="mt-4 rounded-2xl border p-4 sm:p-6" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
        <h2 className="mb-3 font-semibold">Adaugă articol educațional (PetEdu)</h2>
        <form action={addArticle} className="flex flex-col gap-3">
          <input name="title" placeholder="Titlu" required
            className="min-h-11 rounded-xl border px-4 text-sm"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
          <div className="grid grid-cols-2 gap-3">
            <select name="species" className="min-h-11 rounded-xl border px-3 text-sm"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}>
              <option value="general">General</option>
              <option value="caine">Câini</option>
              <option value="pisica">Pisici</option>
              <option value="altele">Altele</option>
            </select>
            <input name="category" placeholder="Categorie (ex: nutriție)"
              className="min-h-11 rounded-xl border px-3 text-sm"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
          </div>
          <textarea name="body" placeholder="Conținut sfat/articol" rows={4} required
            className="rounded-xl border p-3 text-sm"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }} />
          <button className="min-h-11 self-start rounded-full bg-primary px-5 text-sm font-semibold text-white">
            Publică articolul
          </button>
        </form>
      </section>
    </main>
  );
}
