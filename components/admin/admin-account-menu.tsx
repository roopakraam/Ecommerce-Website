"use client";

import { useRouter } from "next/navigation";
import { LogOut, Settings, Store } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminAccountMenuProps {
  email: string;
  role: string;
}

function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "A";
  return local.slice(0, 2).toUpperCase();
}

export function AdminAccountMenu({ email, role }: AdminAccountMenuProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 gap-2 px-2 data-[state=open]:bg-accent"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary/20 text-[11px] text-primary">
              {initialsFromEmail(email)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[10rem] truncate text-sm font-medium md:inline">
            {email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{email}</p>
          <p className="text-xs capitalize text-muted-foreground">{role}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => router.push("/admin/settings")}
        >
          <Settings />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/")}>
          <Store />
          Storefront
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleSignOut()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
