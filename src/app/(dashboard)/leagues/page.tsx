import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from "@/components/ui";
import { Trophy, Plus, Users } from "lucide-react";
import Link from "next/link";

export default async function LeaguesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user's leagues with team count
  const { data: leagues, error } = await supabase
    .from("leagues")
    .select("*, teams(count)")
    .eq("owner_id", user?.id);

  if (error) {
    console.error("Error fetching leagues:", error);
  }

  const leaguesWithCount = leagues?.map((league) => ({
    ...league,
    teamCount: league.teams?.[0]?.count || 0,
  })) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Leagues</h1>
          <p className="text-gray-400">
            Manage and organize your sports leagues
          </p>
        </div>
        <Link href="/leagues/new">
          <Button size="lg">
            <Plus className="w-5 h-5" />
            Create League
          </Button>
        </Link>
      </div>

      {/* Main content */}
      {leaguesWithCount.length === 0 ? (
        // Empty state - no leagues
        <Card className="text-center py-12">
          <CardContent>
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-brand-500" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  Create your first league
                </h2>
                <p className="text-gray-400">
                  Get started by creating a league for your sports team or
                  community. Manage games, track scores, and keep everyone in
                  the loop.
                </p>
              </div>

              <Link href="/leagues/new">
                <Button size="lg" className="w-full sm:w-auto">
                  <Plus className="w-5 h-5" />
                  Create League
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Has leagues - show list
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {leaguesWithCount.map((league) => (
            <Link key={league.id} href={`/leagues/${league.slug}`}>
              <Card hover className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate">{league.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="capitalize shrink-0">
                      {league.sport}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>
                      {league.teamCount} {league.teamCount === 1 ? "team" : "teams"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
