"use server";

import { revalidatePath } from "next/cache";
import {
  deleteAccountAddress,
  setDefaultAccountAddress,
  updateAccountProfile,
} from "@/lib/db/account";
import {
  accountAddressIdSchema,
  updateAccountProfileSchema,
} from "@/lib/validations/account";

export type AccountActionResult =
  | { success: true }
  | { success: false; error: string };

export async function updateAccountProfileAction(
  input: unknown
): Promise<AccountActionResult> {
  const parsed = updateAccountProfileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Please check your details.",
    };
  }

  try {
    const result = await updateAccountProfile({
      fullName: parsed.data.fullName,
      phone: parsed.data.phone.trim() || null,
    });

    if ("error" in result) {
      return { success: false, error: result.error };
    }

    revalidatePath("/account");
    revalidatePath("/checkout");
    return { success: true };
  } catch (error) {
    console.error("Failed to update account profile:", error);
    return {
      success: false,
      error: "Something went wrong updating your profile. Please try again.",
    };
  }
}

export async function setDefaultAccountAddressAction(
  input: unknown
): Promise<AccountActionResult> {
  const parsed = accountAddressIdSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid address.",
    };
  }

  try {
    const result = await setDefaultAccountAddress(parsed.data.addressId);

    if ("error" in result) {
      return { success: false, error: result.error };
    }

    revalidatePath("/account");
    revalidatePath("/checkout");
    return { success: true };
  } catch (error) {
    console.error("Failed to set default address:", error);
    return {
      success: false,
      error: "Something went wrong updating your address. Please try again.",
    };
  }
}

export async function deleteAccountAddressAction(
  input: unknown
): Promise<AccountActionResult> {
  const parsed = accountAddressIdSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid address.",
    };
  }

  try {
    const result = await deleteAccountAddress(parsed.data.addressId);

    if ("error" in result) {
      return { success: false, error: result.error };
    }

    revalidatePath("/account");
    revalidatePath("/checkout");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete address:", error);
    return {
      success: false,
      error: "Something went wrong deleting your address. Please try again.",
    };
  }
}
