"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function applyToListing(listingId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const message = String(formData.get("message") ?? "").trim() || null;

  const { error } = await supabase
    .from("adoption_applications")
    .insert({ listing_id: listingId, applicant_id: user.id, message });

  if (error && !error.message.includes("duplicate")) {
    throw new Error(error.message);
  }

  revalidatePath(`/adoptii/${listingId}`);
}

export async function acceptApplication(
  listingId: string,
  applicationId: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("adoption_applications")
    .update({ status: "accepted" })
    .eq("id", applicationId);

  await supabase
    .from("adoption_listings")
    .update({ status: "pending" })
    .eq("id", listingId);

  revalidatePath(`/adoptii/${listingId}`);
}
