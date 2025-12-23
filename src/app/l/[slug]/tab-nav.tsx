"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface TabNavProps {
  slug: string;
}

export function TabNav({ slug }: TabNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      <TabLink
        href={`/l/${slug}/standings`}
        isActive={pathname.includes("/standings")}
      >
        Standings
      </TabLink>
      <TabLink
        href={`/l/${slug}/schedule`}
        isActive={pathname.includes("/schedule")}
      >
        Schedule
      </TabLink>
    </nav>
  );
}

function TabLink({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? "bg-surface-overlay text-white border border-surface-border"
          : "text-gray-400 hover:text-white hover:bg-surface-overlay"
      }`}
    >
      {children}
    </Link>
  );
}
