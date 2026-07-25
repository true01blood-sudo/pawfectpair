import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerVet } from "../actions";

export default async function AdaugaVetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-xl font-bold sm:text-2xl">Înregistrează cabinetul veterinar</h1>

      <form action={registerVet} className="mt-6 flex flex-col gap-4">
        <input name="clinic_name" placeholder="Numele cabinetului" required className="min-h-11 rounded-xl border px-4" />
        <div className="grid grid-cols-2 gap-4">
          <input name="city" placeholder="Oraș" className="min-h-11 rounded-xl border px-4" />
          <input name="phone" placeholder="Telefon" className="min-h-11 rounded-xl border px-4" />
        </div>
        <input name="address" placeholder="Adresă" className="min-h-11 rounded-xl border px-4" />
        <textarea name="bio" placeholder="Despre cabinet, specializări..." rows={4} className="rounded-xl border p-4" />
        <button className="min-h-11 rounded-full bg-primary px-5 font-semibold text-white">
          Publică cabinetul
        </button>
      </form>
    </main>
  );
}
