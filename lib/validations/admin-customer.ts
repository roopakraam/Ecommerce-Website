import { z } from "zod";

export const updateCustomerNotesSchema = z.object({
  customerId: z.string().uuid("Invalid customer id"),
  adminNotes: z.string().max(5000, "Notes must be 5000 characters or fewer"),
});

export type UpdateCustomerNotesInput = z.infer<typeof updateCustomerNotesSchema>;
