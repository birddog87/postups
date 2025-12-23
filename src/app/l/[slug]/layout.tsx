import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { TabNav } from "./tab-nav";
import type { ReactNode } from "react";

interface PublicLeagueLayoutProps {
  children: ReactNode;
  params: Promise<{
    slug: string;
  }>;
}

export default async function PublicLeagueLayout({
  children,
  params,
}: PublicLeagueLayoutProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: league, error } = await supabase
    .from("leagues")
    .select("name, slug, sport")
    .eq("slug", slug)
    .single();

  if (error || !league) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-surface-border bg-surface-raised">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {league.name}
            </h1>
            <Badge variant="secondary" className="capitalize">
              {league.sport}
            </Badge>
          </div>

          {/* Tab Navigation */}
          <TabNav slug={slug} />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
