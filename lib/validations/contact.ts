import { z } from "zod";

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120, "Name is too long"),
  email: z.string().trim().email("Enter a valid email"),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a bit more (at least 10 characters)")
    .max(2000, "Message is too long"),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
