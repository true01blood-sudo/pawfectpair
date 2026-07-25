import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createListing } from "./actions";

export default async function AdaugaAdoptiePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-xl font-bold sm:text-2xl">Adaugă un anunț de adopție</h1>

      <form action={createListing} className="mt-6 flex flex-col gap-4">
        <input
          name="name"
          placeholder="Nume animal"
          required
          className="min-h-11 rounded-xl border px-4"
        />

        <div className="grid grid-cols-2 gap-4">
          <select name="species" required className="min-h-11 rounded-xl border px-4">
            <option value="">Specie</option>
            <option value="Câine">Câine</option>
            <option value="Pisică">Pisică</option>
            <option value="Altele">Altele</option>
          </select>
          <input
            name="breed"
            placeholder="Rasă (opțional)"
            className="min-h-11 rounded-xl border px-4"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <input
            name="age_years"
            type="number"
            min="0"
            step="0.5"
            placeholder="Vârstă (ani)"
            className="min-h-11 rounded-xl border px-4"
          />
          <select name="sex" className="min-h-11 rounded-xl border px-4">
            <option value="unknown">Sex necunoscut</option>
            <option value="male">Mascul</option>
            <option value="female">Femelă</option>
          </select>
          <select name="size" className="min-h-11 rounded-xl border px-4">
            <option value="small">Mic</option>
            <option value="medium">Mediu</option>
            <option value="large">Mare</option>
          </select>
        </div>

        <input
          name="city"
          placeholder="Oraș"
          className="min-h-11 rounded-xl border px-4"
        />

        <textarea
          name="description"
          placeholder="Descriere: personalitate, stare de sănătate, poveste..."
          rows={5}
          className="rounded-xl border p-4"
        />

        <button
          type="submit"
          className="min-h-11 rounded-full bg-primary px-5 font-semibold text-white"
        >
          Publică anunțul
        </button>
      </form>
    </main>
  );
}
