import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ContactMessage,
  ContactMessageInsert,
  ContactMessageStatus,
} from "@/types";

function mapContactError(message: string | undefined): string {
  const lower = (message ?? "").toLowerCase();
  if (lower.includes("contact_messages") && lower.includes("does not exist")) {
    return "Contact messages require migration 20260723093000_contact_messages.sql.";
  }
  return message || "Failed to save contact message.";
}

export async function insertContactMessage(
  input: Pick<ContactMessageInsert, "name" | "email" | "message"> & {
    status?: ContactMessageStatus;
  }
): Promise<ContactMessage> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("contact_messages")
    .insert({
      name: input.name,
      email: input.email,
      message: input.message,
      status: input.status ?? "new",
    })
    .select("id, name, email, message, status, created_at")
    .single();

  if (error || !data) {
    throw new Error(mapContactError(error?.message));
  }

  return data as ContactMessage;
}

export async function updateContactMessageStatus(
  id: string,
  status: ContactMessageStatus
): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("contact_messages")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Failed to update contact message status:", error.message);
  }
}
