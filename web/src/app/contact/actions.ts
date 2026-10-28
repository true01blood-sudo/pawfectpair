"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function sendContactMessage(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const subject = String(formData.get("subject") ?? "").trim().slice(0, 200);
  const message = String(formData.get("message") ?? "").trim().slice(0, 2000);

  if (!name || !email || !message) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

  const supabase = await createClient();
  await supabase.from("contact_messages").insert({
    name,
    email,
    subject,
    message,
    created_at: new Date().toISOString(),
  });

  redirect("/contact?sent=1");
}
