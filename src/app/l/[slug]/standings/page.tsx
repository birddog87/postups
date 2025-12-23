import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Team, Game, LeagueSettings } from "@/lib/supabase/types";

interface StandingsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface TeamStanding {
  team: Team;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  differential: number;
}

function calculateStandings(
  teams: Team[],
  games: Game[],
  settings: LeagueSettings
): TeamStanding[] {
  const stats = teams.map((team) => {
    const teamGames = games.filter(
      (g) =>
        g.status === "completed" &&
        (g.home_team_id === team.id || g.away_team_id === team.id)
    );

    let wins = 0,
      losses = 0,
      ties = 0,
      goalsFor = 0,
      goalsAgainst = 0;

    teamGames.forEach((game) => {
      const isHome = game.home_team_id === team.id;
      const teamScore = isHome ? game.home_score! : game.away_score!;
      const oppScore = isHome ? game.away_score! : game.home_score!;

      goalsFor += teamScore;
      goalsAgainst += oppScore;

      if (teamScore > oppScore) wins++;
      else if (teamScore < oppScore) losses++;
      else ties++;
    });

    const points =
      wins * settings.points_win +
      losses * settings.points_loss +
      ties * settings.points_tie;

    return {
      team,
      gamesPlayed: teamGames.length,
      wins,
      losses,
      ties,
      points,
      goalsFor,
      goalsAgainst,
      differential: goalsFor - goalsAgainst,
    };
  });

  return stats.sort(
    (a, b) =>
      b.points - a.points ||
      b.differential - a.differential ||
      b.goalsFor - a.goalsFor
  );
}

export default async function StandingsPage({ params }: StandingsPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: league, error } = await supabase
    .from("leagues")
    .select("settings, teams(*), games(*)")
    .eq("slug", slug)
    .single();

  if (error || !league) {
    notFound();
  }

  const settings = league.settings as LeagueSettings;
  const teams = (league.teams || []) as Team[];
  const games = (league.games || []) as Game[];

  const standings = calculateStandings(teams, games, settings);

  return (
    <div className="space-y-6">
      {standings.length === 0 ? (
        <div className="text-center py-12 bg-surface-raised border border-surface-border rounded-2xl">
          <p className="text-gray-400">No teams in this league yet.</p>
        </div>
      ) : (
        <div className="bg-surface-raised border border-surface-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-surface">
                  <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">
                    GP
                  </th>
                  <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">
                    W
                  </th>
                  <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">
                    L
                  </th>
                  {settings.ties_allowed && (
                    <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">
                      T
                    </th>
                  )}
                  <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">
                    PTS
                  </th>
                  <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">
                    GF
                  </th>
                  <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">
                    GA
                  </th>
                  <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">
                    DIFF
                  </th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing, index) => {
                  const isTop3 = index < 3 && standings.length > 3;
                  const rankColors = [
                    "bg-yellow-500/20 border-yellow-500/50",
                    "bg-gray-300/20 border-gray-300/50",
                    "bg-amber-700/20 border-amber-700/50",
                  ];

                  return (
                    <tr
                      key={standing.team.id}
                      className={`border-b border-surface-border last:border-b-0 hover:bg-surface transition-colors ${
                        isTop3 ? rankColors[index] : ""
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-lg">
                            {index + 1}
                          </span>
                          {isTop3 && (
                            <span className="text-xl">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: standing.team.color }}
                          />
                          <span className="text-white font-medium text-sm md:text-base">
                            {standing.team.name}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-2 md:px-4 text-gray-300 font-medium">
                        {standing.gamesPlayed}
                      </td>
                      <td className="text-center py-4 px-2 md:px-4 text-gray-300 font-medium">
                        {standing.wins}
                      </td>
                      <td className="text-center py-4 px-2 md:px-4 text-gray-300 font-medium">
                        {standing.losses}
                      </td>
                      {settings.ties_allowed && (
                        <td className="text-center py-4 px-2 md:px-4 text-gray-300 font-medium">
                          {standing.ties}
                        </td>
                      )}
                      <td className="text-center py-4 px-2 md:px-4">
                        <span className="text-white font-bold text-base md:text-lg">
                          {standing.points}
                        </span>
                      </td>
                      <td className="text-center py-4 px-2 md:px-4 text-gray-300 font-medium">
                        {standing.goalsFor}
                      </td>
                      <td className="text-center py-4 px-2 md:px-4 text-gray-300 font-medium">
                        {standing.goalsAgainst}
                      </td>
                      <td className="text-center py-4 px-2 md:px-4">
                        <span
                          className={`font-medium ${
                            standing.differential > 0
                              ? "text-green-400"
                              : standing.differential < 0
                                ? "text-red-400"
                                : "text-gray-400"
                          }`}
                        >
                          {standing.differential > 0 ? "+" : ""}
                          {standing.differential}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend for top 3 */}
      {standings.length > 3 && (
        <div className="flex items-center gap-4 text-xs text-gray-400 px-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-500/50 rounded" />
            <span>1st Place</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300/20 border border-gray-300/50 rounded" />
            <span>2nd Place</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-700/20 border border-amber-700/50 rounded" />
            <span>3rd Place</span>
          </div>
        </div>
      )}
    </div>
  );
}
