"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { CustomerAuthForm } from "@/components/storefront/customer-auth-form";
import { useAuthModalStore } from "@/lib/store/auth-modal";

export function AuthModal() {
  const router = useRouter();
  const isOpen = useAuthModalStore((s) => s.isOpen);
  const mode = useAuthModalStore((s) => s.mode);
  const close = useAuthModalStore((s) => s.close);
  const setMode = useAuthModalStore((s) => s.setMode);

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[90] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-bone/10 bg-surface p-6 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:p-8"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">
            {mode === "login" ? "Sign in" : "Create account"}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {mode === "login"
              ? "Sign in to your BOOK MY TEES account."
              : "Create a BOOK MY TEES account."}
          </DialogPrimitive.Description>

          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-full p-1.5 text-dust transition hover:bg-surface2 hover:text-bone focus:outline-none"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>

          <CustomerAuthForm
            mode={mode}
            nextPath="/"
            variant="modal"
            onSwitchMode={setMode}
            onSuccess={() => {
              close();
              router.refresh();
            }}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
