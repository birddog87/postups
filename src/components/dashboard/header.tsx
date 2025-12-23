"use client";

import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface HeaderProps {
  userEmail: string;
}

export function Header({ userEmail }: HeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 bg-surface-raised/80 backdrop-blur-xl border-b border-surface-border">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Page title placeholder - can be customized per page */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white hidden lg:block">
            Dashboard
          </h1>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-overlay hover:bg-surface-border transition-colors border border-surface-border"
          >
            <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
              <User className="w-4 h-4 text-brand-500" />
            </div>
            <span className="text-sm text-white hidden sm:block">
              {userEmail}
            </span>
          </button>

          {/* Dropdown menu */}
          {isMenuOpen && (
            <>
              <div
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 z-30"
              />
              <div className="absolute right-0 mt-2 w-64 bg-surface-raised border border-surface-border rounded-xl shadow-2xl z-40 overflow-hidden">
                <div className="p-4 border-b border-surface-border">
                  <p className="text-sm font-medium text-white truncate">
                    {userEmail}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Signed in</p>
                </div>
                <div className="p-2">
                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    className="w-full justify-start"
                    loading={isSigningOut}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
