import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { Game, Team } from "@/lib/supabase/types";

interface SchedulePageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface GameWithTeams extends Game {
  home_team: Team;
  away_team: Team;
}

interface GroupedGames {
  date: string;
  games: GameWithTeams[];
}

function groupGamesByDate(games: GameWithTeams[]): GroupedGames[] {
  const grouped = new Map<string, GameWithTeams[]>();

  games.forEach((game) => {
    const date = game.scheduled_date;
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(game);
  });

  return Array.from(grouped.entries())
    .map(([date, games]) => ({
      date,
      games: games.sort((a, b) => {
        const timeA = a.scheduled_time || "00:00";
        const timeB = b.scheduled_time || "00:00";
        return timeA.localeCompare(timeB);
      }),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const gameDate = new Date(date);
  gameDate.setHours(0, 0, 0, 0);

  if (gameDate.getTime() === today.getTime()) {
    return "Today";
  } else if (gameDate.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  } else {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
}

function formatTime(timeString: string | null): string {
  if (!timeString) return "TBD";

  try {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch {
    return timeString;
  }
}

export default async function SchedulePage({ params }: SchedulePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: league, error } = await supabase
    .from("leagues")
    .select(
      `
      id,
      games (
        *,
        home_team:teams!games_home_team_id_fkey(*),
        away_team:teams!games_away_team_id_fkey(*)
      )
    `
    )
    .eq("slug", slug)
    .single();

  if (error || !league) {
    notFound();
  }

  const games = (league.games || []) as GameWithTeams[];
  const groupedGames = groupGamesByDate(games);

  return (
    <div className="space-y-8">
      {groupedGames.length === 0 ? (
        <div className="text-center py-12 bg-surface-raised border border-surface-border rounded-2xl">
          <p className="text-gray-400">No games scheduled yet.</p>
        </div>
      ) : (
        groupedGames.map((group) => (
          <div key={group.date} className="space-y-3">
            {/* Date Header */}
            <div className="flex items-center gap-3">
              <h2 className="text-lg md:text-xl font-bold text-white">
                {formatDate(group.date)}
              </h2>
              <div className="flex-1 h-px bg-surface-border" />
            </div>

            {/* Games for this date */}
            <div className="space-y-3">
              {group.games.map((game) => {
                const homeScore = game.home_score ?? 0;
                const awayScore = game.away_score ?? 0;
                const isCompleted = game.status === "completed";
                const homeWon = isCompleted && homeScore > awayScore;
                const awayWon = isCompleted && awayScore > homeScore;

                return (
                  <div
                    key={game.id}
                    className="bg-surface-raised border border-surface-border rounded-2xl p-4 md:p-6 hover:border-surface-overlay transition-colors"
                  >
                    {/* Game Status and Time */}
                    <div className="flex items-center justify-between mb-4">
                      <Badge
                        variant={
                          game.status === "completed"
                            ? "success"
                            : game.status === "cancelled"
                              ? "error"
                              : game.status === "postponed"
                                ? "warning"
                                : "default"
                        }
                        className="capitalize"
                      >
                        {game.status}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        {formatTime(game.scheduled_time)}
                      </span>
                    </div>

                    {/* Teams and Score */}
                    <div className="space-y-3">
                      {/* Home Team */}
                      <div
                        className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                          homeWon
                            ? "bg-green-500/10 border border-green-500/30"
                            : "bg-surface"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: game.home_team.color }}
                          />
                          <span
                            className={`font-medium text-sm md:text-base ${
                              homeWon ? "text-white" : "text-gray-300"
                            }`}
                          >
                            {game.home_team.name}
                          </span>
                          {homeWon && (
                            <span className="text-xs text-green-400 font-semibold">
                              W
                            </span>
                          )}
                        </div>
                        {isCompleted && (
                          <span
                            className={`text-xl md:text-2xl font-bold ${
                              homeWon ? "text-white" : "text-gray-400"
                            }`}
                          >
                            {homeScore}
                          </span>
                        )}
                      </div>

                      {/* Away Team */}
                      <div
                        className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                          awayWon
                            ? "bg-green-500/10 border border-green-500/30"
                            : "bg-surface"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: game.away_team.color }}
                          />
                          <span
                            className={`font-medium text-sm md:text-base ${
                              awayWon ? "text-white" : "text-gray-300"
                            }`}
                          >
                            {game.away_team.name}
                          </span>
                          {awayWon && (
                            <span className="text-xs text-green-400 font-semibold">
                              W
                            </span>
                          )}
                        </div>
                        {isCompleted && (
                          <span
                            className={`text-xl md:text-2xl font-bold ${
                              awayWon ? "text-white" : "text-gray-400"
                            }`}
                          >
                            {awayScore}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    {game.location && (
                      <div className="mt-4 pt-4 border-t border-surface-border">
                        <p className="text-sm text-gray-400">
                          <span className="font-medium">Location:</span>{" "}
                          {game.location}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
