import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import BackLink from "@/components/BackLink";
import ImageUpload from "@/components/ImageUpload";
import { updateVetProfile, addVetService, deleteVetService } from "../../actions";

const inputClass = "min-h-11 rounded-xl border px-4 text-sm";
const inputStyle = { borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" };

export default async function EditeazaVetPage({
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

  const { data: vet } = await supabase.from("vets").select("*").eq("id", id).single();
  if (!vet) notFound();
  if (vet.user_id !== user.id) redirect(`/veterinari/${id}`);

  const { data: services } = await supabase
    .from("vet_services")
    .select("id, name, duration_minutes, price_cents, currency")
    .eq("vet_id", id)
    .order("price_cents", { ascending: true });

  return (
    <>
      <AppShell>
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-10">
          <BackLink href={`/veterinari/${id}`} label={vet.clinic_name} />
          <h1 className="text-xl font-bold sm:text-2xl mt-2" style={{ color: "var(--foreground)" }}>
            Editează cabinetul
          </h1>

          <form action={updateVetProfile.bind(null, id)} className="mt-6 flex flex-col gap-4">
            <input name="clinic_name" defaultValue={vet.clinic_name} placeholder="Numele cabinetului" required className={inputClass} style={inputStyle} />
            <div className="grid grid-cols-2 gap-4">
              <input name="city" defaultValue={vet.city ?? ""} placeholder="Oraș" required className={inputClass} style={inputStyle} />
              <input name="phone" defaultValue={vet.phone ?? ""} placeholder="Telefon" required className={inputClass} style={inputStyle} />
            </div>
            <input name="address" defaultValue={vet.address ?? ""} placeholder="Adresă completă" required className={inputClass} style={inputStyle} />
            <textarea name="bio" defaultValue={vet.bio ?? ""} placeholder="Despre cabinet, specializări..." rows={4} className="rounded-xl border p-4 text-sm" style={inputStyle} />

            <div className="rounded-2xl border p-4" style={{ borderColor: "var(--card-border)" }}>
              <p className="mb-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>Insigne de încredere</p>
              <div className="flex flex-col gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                <label className="flex items-center gap-2"><input type="checkbox" name="is_licensed" defaultChecked={vet.is_licensed} /> ✅ Cabinet autorizat</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="experienced_team" defaultChecked={vet.experienced_team} /> 👥 Echipă cu experiență</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="modern_facility" defaultChecked={vet.modern_facility} /> 🏢 Facilitate modernă</label>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>Poze</p>
              <div className="flex flex-col gap-3">
                <ImageUpload name="photo_url" label="Poză de copertă" defaultValue={vet.photo_url ?? ""} />
                <ImageUpload name="photos" label="Poză galerie" defaultValue={(vet.photos as string[] | null)?.[0] ?? ""} />
                <ImageUpload name="photos" label="Poză galerie" defaultValue={(vet.photos as string[] | null)?.[1] ?? ""} />
                <ImageUpload name="photos" label="Poză galerie" defaultValue={(vet.photos as string[] | null)?.[2] ?? ""} />
              </div>
            </div>

            <button className="min-h-11 self-start rounded-full bg-primary px-6 text-sm font-semibold text-white">
              Salvează modificările
            </button>
          </form>

          <section className="mt-10">
            <h2 className="mb-3 font-semibold" style={{ color: "var(--foreground)" }}>Servicii</h2>
            <div className="flex flex-col gap-2 mb-4">
              {services && services.length > 0 ? (
                services.map((srv) => (
                  <div key={srv.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
                    <div>
                      <p className="font-medium" style={{ color: "var(--foreground)" }}>{srv.name}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {srv.duration_minutes ? `${srv.duration_minutes} min · ` : ""}{(srv.price_cents / 100).toFixed(0)} {srv.currency}
                      </p>
                    </div>
                    <form action={deleteVetService.bind(null, id, srv.id)}>
                      <button className="text-xs text-red-500 hover:underline">Șterge</button>
                    </form>
                  </div>
                ))
              ) : (
                <p className="text-sm" style={{ color: "var(--muted)" }}>Niciun serviciu adăugat încă.</p>
              )}
            </div>

            <form action={addVetService.bind(null, id)} className="flex flex-col gap-3 rounded-2xl border p-4" style={{ borderColor: "var(--card-border)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Adaugă serviciu</p>
              <input name="name" placeholder="Nume serviciu (ex: Consultație generală)" required className={inputClass} style={inputStyle} />
              <div className="grid grid-cols-2 gap-4">
                <input name="duration_minutes" type="number" min="5" max="480" placeholder="Durată (minute)" className={inputClass} style={inputStyle} />
                <input name="price" type="number" min="0" step="1" placeholder="Preț (RON)" required className={inputClass} style={inputStyle} />
              </div>
              <button className="min-h-10 self-start rounded-full border px-4 text-sm font-semibold" style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}>
                + Adaugă
              </button>
            </form>
          </section>
        </main>
      </AppShell>
      <BottomNav />
    </>
  );
}
