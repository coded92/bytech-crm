"use client";

import { useTransition } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  async function handleLogout() {
    startTransition(async () => {
      await signOutAction();
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isPending}
      className="h-11 gap-2 rounded-2xl border-white/80 bg-white/92 px-3 text-sm text-slate-700 shadow-sm shadow-indigo-100 hover:bg-white"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">Logout</span>
    </Button>
  );
}
