"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addTask(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const pet_id = String(formData.get("pet_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "other");
  const recurrence = String(formData.get("recurrence") ?? "none");
  const due_at_raw = String(formData.get("due_at") ?? "").trim();

  if (!pet_id || !title || !due_at_raw) {
    throw new Error("Animalul, titlul și data sunt obligatorii.");
  }

  const { error } = await supabase.from("planner_tasks").insert({
    pet_id,
    owner_id: user.id,
    title,
    category,
    recurrence,
    due_at: new Date(due_at_raw).toISOString(),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/planificator");
}

export async function completeTask(taskId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: task } = await supabase
    .from("planner_tasks")
    .select("due_at, recurrence")
    .eq("id", taskId)
    .single();

  await supabase.from("planner_tasks").update({ done: true }).eq("id", taskId);

  // Roll a recurring task forward instead of losing the reminder.
  if (task?.recurrence && task.recurrence !== "none") {
    const next = new Date(task.due_at);
    next.setDate(next.getDate() + (task.recurrence === "daily" ? 1 : 7));

    const { data: original } = await supabase
      .from("planner_tasks")
      .select("pet_id, owner_id, title, category, recurrence")
      .eq("id", taskId)
      .single();

    if (original) {
      await supabase.from("planner_tasks").insert({
        ...original,
        due_at: next.toISOString(),
        done: false,
      });
    }
  }

  revalidatePath("/planificator");
}
