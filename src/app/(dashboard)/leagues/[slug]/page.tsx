import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from "@/components/ui";
import { ArrowLeft, Plus, Users, Calendar } from "lucide-react";
import Link from "next/link";
import type { LeagueSettings, Team, Game } from "@/lib/supabase/types";

interface LeaguePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function LeaguePage({ params }: LeaguePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch league with teams and games
  const { data: league, error } = await supabase
    .from("leagues")
    .select("*, teams(*), games(*)")
    .eq("slug", slug)
    .single();

  if (error || !league) {
    notFound();
  }

  const settings = league.settings as LeagueSettings;
  const teams = (league.teams || []) as Team[];
  const games = (league.games || []) as Game[];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/leagues"
          className="p-2 hover:bg-surface-raised rounded-lg transition-colors mt-1"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {league.name}
              </h1>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="capitalize">
                  {league.sport}
                </Badge>
                <span className="text-sm text-gray-400">
                  {teams.length} {teams.length === 1 ? "team" : "teams"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* League Settings */}
      <Card>
        <CardHeader>
          <CardTitle>League Settings</CardTitle>
          <CardDescription>Points and scoring configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-surface rounded-xl">
              <p className="text-sm text-gray-400 mb-1">Win Points</p>
              <p className="text-2xl font-bold text-white">
                {settings.points_win}
              </p>
            </div>
            <div className="p-4 bg-surface rounded-xl">
              <p className="text-sm text-gray-400 mb-1">Loss Points</p>
              <p className="text-2xl font-bold text-white">
                {settings.points_loss}
              </p>
            </div>
            <div className="p-4 bg-surface rounded-xl">
              <p className="text-sm text-gray-400 mb-1">Tie Points</p>
              <p className="text-2xl font-bold text-white">
                {settings.points_tie}
              </p>
            </div>
            <div className="p-4 bg-surface rounded-xl">
              <p className="text-sm text-gray-400 mb-1">Ties</p>
              <p className="text-2xl font-bold text-white">
                {settings.ties_allowed ? "Allowed" : "Not Allowed"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Teams Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Teams</CardTitle>
                <CardDescription>
                  {teams.length} {teams.length === 1 ? "team" : "teams"} in this
                  league
                </CardDescription>
              </div>
              <Link href={`/leagues/${slug}/teams/new`}>
                <Button size="sm" variant="secondary">
                  <Plus className="w-4 h-4" />
                  Add Team
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-xl bg-surface-overlay border border-surface-border flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-400">
                  No teams yet. Add your first team to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-3 bg-surface rounded-xl hover:bg-surface-overlay transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="text-white font-medium">
                        {team.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Schedule</CardTitle>
                <CardDescription>
                  {games.length} {games.length === 1 ? "game" : "games"}{" "}
                  scheduled
                </CardDescription>
              </div>
              <Link href={`/leagues/${slug}/games/new`}>
                <Button size="sm" variant="secondary">
                  <Plus className="w-4 h-4" />
                  Add Game
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {games.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-xl bg-surface-overlay border border-surface-border flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-400">
                  No games scheduled. Add a game to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {games.map((game) => (
                  <Link
                    key={game.id}
                    href={`/leagues/${slug}/games/${game.id}`}
                  >
                    <div className="p-3 bg-surface rounded-xl hover:bg-surface-overlay transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <Badge
                          variant={
                            game.status === "completed"
                              ? "success"
                              : game.status === "cancelled"
                                ? "error"
                                : "default"
                          }
                        >
                          {game.status}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(game.scheduled_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-white">
                        {game.location || "TBD"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Standings Section */}
      <Card>
        <CardHeader>
          <CardTitle>Standings</CardTitle>
          <CardDescription>Current league standings</CardDescription>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-gray-400">
                Add teams to view standings
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Pos
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Team
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                      GP
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                      W
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                      L
                    </th>
                    {settings.ties_allowed && (
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                        T
                      </th>
                    )}
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                      PTS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team, index) => (
                    <tr
                      key={team.id}
                      className="border-b border-surface-border hover:bg-surface-raised transition-colors"
                    >
                      <td className="py-3 px-4 text-white font-medium">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="text-white">{team.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 text-gray-400">
                        0
                      </td>
                      <td className="text-center py-3 px-4 text-gray-400">
                        0
                      </td>
                      <td className="text-center py-3 px-4 text-gray-400">
                        0
                      </td>
                      {settings.ties_allowed && (
                        <td className="text-center py-3 px-4 text-gray-400">
                          0
                        </td>
                      )}
                      <td className="text-center py-3 px-4 text-white font-semibold">
                        0
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
