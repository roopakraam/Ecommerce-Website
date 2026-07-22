"use server";

import { revalidatePath } from "next/cache";
import { updateAdminCustomerNotes } from "@/lib/db/admin-customers";
import { ADMIN_CUSTOMERS_PATH } from "@/lib/admin/customers";
import { updateCustomerNotesSchema } from "@/lib/validations/admin-customer";

export type UpdateCustomerNotesResult =
  | { success: true }
  | { success: false; error: string };

export async function updateCustomerNotesAction(input: {
  customerId: string;
  adminNotes: string;
}): Promise<UpdateCustomerNotesResult> {
  const parsed = updateCustomerNotesSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid notes.",
    };
  }

  try {
    const customer = await updateAdminCustomerNotes(
      parsed.data.customerId,
      parsed.data.adminNotes
    );

    revalidatePath(ADMIN_CUSTOMERS_PATH);
    revalidatePath(`${ADMIN_CUSTOMERS_PATH}/${customer.id}`);
    revalidatePath("/admin/dashboard/customers");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update admin notes.",
    };
  }
}
