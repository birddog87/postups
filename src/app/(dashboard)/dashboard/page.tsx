import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
} from "@/components/ui";
import { Trophy, Plus } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user's leagues from database
  const { data: leagues } = await supabase
    .from("leagues")
    .select(`
      *,
      teams:teams(count)
    `)
    .eq("owner_id", user?.id || "")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
        </h1>
        <p className="text-gray-400">
          Manage your leagues and stay up to date with your teams
        </p>
      </div>

      {/* Main content */}
      {!leagues || leagues.length === 0 ? (
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
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Your Leagues</h2>
            <Link href="/leagues/new">
              <Button>
                <Plus className="w-4 h-4" />
                New League
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leagues.map((league) => (
              <Link key={league.id} href={`/leagues/${league.slug}`}>
                <Card hover>
                  <CardHeader>
                    <CardTitle>{league.name}</CardTitle>
                    <CardDescription className="capitalize">{league.sport}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Trophy className="w-4 h-4" />
                      <span>{league.teams?.[0]?.count || 0} teams</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick stats - placeholder for future */}
      {leagues && leagues.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-4xl">0</CardTitle>
              <CardDescription>Upcoming Games</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-4xl">0</CardTitle>
              <CardDescription>Active Leagues</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-4xl">0</CardTitle>
              <CardDescription>Total Teams</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}
