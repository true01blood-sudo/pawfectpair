"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setAppointmentStatus(
  appointmentId: string,
  status: "confirmed" | "cancelled" | "completed",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("vet_appointments")
    .update({ status })
    .eq("id", appointmentId);

  revalidatePath("/programari");
  revalidatePath("/clinic");
  revalidatePath("/clinic/cereri");
  revalidatePath("/clinic/program");
}

export async function setTrainerBookingStatus(
  bookingId: string,
  status: "confirmed" | "declined" | "cancelled" | "completed",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("trainer_bookings")
    .update({ status })
    .eq("id", bookingId);

  revalidatePath("/programari");
}
