"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function swipePet(
  fromPetId: string,
  toPetId: string,
  liked: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("pet_likes").insert({
    from_pet_id: fromPetId,
    to_pet_id: toPetId,
    from_user_id: user.id,
    liked,
  });

  revalidatePath("/comunitate");
}

export async function sendMessage(matchId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await supabase.from("messages").insert({ match_id: matchId, sender_id: user.id, body });
  revalidatePath(`/comunitate/mesaje/${matchId}`);
}
