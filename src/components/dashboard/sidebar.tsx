"use client";

import { Home, Trophy, Plus, Settings, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "My Leagues", href: "/leagues", icon: Trophy },
  { name: "Create League", href: "/leagues/new", icon: Plus },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl bg-surface-raised border border-surface-border text-white hover:bg-surface-overlay transition-colors"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-surface-raised border-r border-surface-border transition-transform duration-300",
          "lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-surface-border">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center font-bold">
                P
              </div>
              <span className="text-xl font-bold">PostUps</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors",
                    isActive
                      ? "bg-brand-500/10 text-brand-500 border border-brand-500/20"
                      : "text-gray-400 hover:text-white hover:bg-surface-overlay"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-surface-border">
            <p className="text-xs text-gray-500 text-center">
              PostUps &copy; 2025
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
