"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { logoutAction } from "@/app/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";

export function UserMenu({
  user,
}: {
  user: { name: string | null; email: string };
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="shrink-0 cursor-pointer rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <UserAvatar name={user.name} email={user.email} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <DropdownMenuItem
          render={<Link href="/settings" />}
          className="items-start gap-3 py-2"
        >
          <div className="min-w-0 flex-1">
            {user.name && (
              <p className="truncate text-sm font-medium text-stone-700">
                {user.name}
              </p>
            )}
            <p className="truncate text-xs text-stone-500">{user.email}</p>
          </div>
          <Settings className="size-4 shrink-0 text-stone-400" />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <form action={logoutAction}>
          <DropdownMenuItem
            variant="destructive"
            nativeButton
            render={<button type="submit" className="w-full" />}
          >
            <LogOut />
            Log out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
