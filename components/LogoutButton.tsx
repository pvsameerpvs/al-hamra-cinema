"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";

type LogoutButtonProps = {
  className?: string;
  title?: string;
};

export function LogoutButton({ className, title = "Sign Out" }: LogoutButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  const doLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout failed");
      router.replace("/login");
      return true;
    } catch (err: unknown) {
      toast({
        title: "Logout failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={title}
        aria-label={title}
        className={className}
      >
        <LogOut className="w-4 h-4" />
      </button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Log out?"
        description="You will be signed out and returned to the login page."
        confirmText="Yes, log out"
        cancelText="No"
        confirmVariant="destructive"
        onConfirm={doLogout}
      />
    </>
  );
}
