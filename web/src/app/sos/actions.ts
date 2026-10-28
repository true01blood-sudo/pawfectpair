"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const TYPE_LABELS: Record<string, string> = {
  medical: "urgență medicală",
  danger: "animal în pericol / blocat",
};

export async function logSosEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const pet_id = String(formData.get("pet_id") ?? "");
  const type = String(formData.get("type") ?? "medical");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!pet_id) throw new Error("Selectează animalul.");

  await supabase.from("sos_events").insert({ pet_id, owner_id: user.id, type, notes });

  if (type === "lost") {
    redirect(`/resq/nou?pet=${pet_id}`);
  }

  // Broadcast către toate cabinetele înregistrate — inspirat de modelul
  // UrgentPet (alerta ajunge simultan la clinici, oricare poate răspunde),
  // adaptat la scara noastră: fără rază geografică (nu avem coordonate
  // pe cabinete), deci notificăm toate cabinetele active.
  if (type === "medical" || type === "danger") {
    const { data: pet } = await supabase.from("pets").select("name, species").eq("id", pet_id).maybeSingle();
    const { data: vets } = await supabase.from("vets").select("user_id");

    if (vets && vets.length > 0) {
      const petLabel = pet?.name ? `${pet.name}${pet.species ? ` (${pet.species})` : ""}` : "un animal";
      const rows = vets
        .filter((v) => v.user_id)
        .map((v) => ({
          user_id: v.user_id as string,
          type: "emergency",
          title: `🆘 Urgență: ${petLabel}`,
          body: `${TYPE_LABELS[type] ?? type}${notes ? ` — ${notes}` : ""}`,
          link: "/sos",
        }));
      if (rows.length > 0) await supabase.from("notifications").insert(rows);
    }
  }
}
