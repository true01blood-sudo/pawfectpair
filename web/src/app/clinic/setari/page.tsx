import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateClinicProfile } from "../actions";

export default async function ClinicSetariPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: vet } = await supabase
    .from("vets")
    .select("clinic_name, city, address, phone, bio")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!vet) redirect("/veterinari/adauga");

  const inputStyle = {
    borderColor: "var(--card-border)",
    color: "var(--foreground)",
    background: "var(--card-bg)",
  };

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--foreground)" }}>
        Setări clinică
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
        Informațiile publice afișate pe profilul tău din Veterinari.
      </p>

      <form action={updateClinicProfile} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
            Nume clinică <span className="text-red-500">*</span>
          </label>
          <input
            name="clinic_name"
            required
            defaultValue={vet.clinic_name ?? ""}
            className="w-full min-h-11 rounded-xl border px-4 text-sm"
            style={inputStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
              Oraș
            </label>
            <input name="city" defaultValue={vet.city ?? ""} className="w-full min-h-11 rounded-xl border px-4 text-sm" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
              Telefon
            </label>
            <input name="phone" defaultValue={vet.phone ?? ""} className="w-full min-h-11 rounded-xl border px-4 text-sm" style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
            Adresă
          </label>
          <input name="address" defaultValue={vet.address ?? ""} className="w-full min-h-11 rounded-xl border px-4 text-sm" style={inputStyle} />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
            Despre clinică
          </label>
          <textarea
            name="bio"
            rows={4}
            defaultValue={vet.bio ?? ""}
            placeholder="Descriere, specializări, program de lucru..."
            className="w-full rounded-xl border p-4 text-sm resize-none"
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          className="self-start rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--primary)" }}
        >
          Salvează modificările
        </button>
      </form>
    </main>
  );
}
