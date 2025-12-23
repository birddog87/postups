"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
} from "@/components/ui";
import { ArrowLeft, Calendar, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import type { GameWithTeams } from "@/lib/supabase/types";

interface GameDetailPageProps {
  params: Promise<{
    slug: string;
    id: string;
  }>;
}

export default function GameDetailPage({
  params: paramsPromise,
}: GameDetailPageProps) {
  const router = useRouter();
  const [params, setParams] = useState<{ slug: string; id: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [game, setGame] = useState<GameWithTeams | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState({
    homeScore: "",
    awayScore: "",
  });

  useEffect(() => {
    paramsPromise.then(setParams);
  }, [paramsPromise]);

  useEffect(() => {
    if (!params) return;

    const fetchGame = async () => {
      const supabase = createClient();

      // Fetch game with teams
      const { data, error: gameError } = await supabase
        .from("games")
        .select(
          `
          *,
          home_team:teams!games_home_team_id_fkey(*),
          away_team:teams!games_away_team_id_fkey(*)
        `
        )
        .eq("id", params.id)
        .single();

      if (gameError || !data) {
        setError("Game not found");
        return;
      }

      setGame(data as unknown as GameWithTeams);

      // Pre-fill scores if already completed
      if (data.status === "completed" && data.home_score !== null && data.away_score !== null) {
        setScores({
          homeScore: data.home_score.toString(),
          awayScore: data.away_score.toString(),
        });
      }
    };

    fetchGame();
  }, [params]);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!params || !game) return;

    try {
      const homeScore = parseInt(scores.homeScore);
      const awayScore = parseInt(scores.awayScore);

      if (isNaN(homeScore) || isNaN(awayScore)) {
        throw new Error("Please enter valid scores");
      }

      if (homeScore < 0 || awayScore < 0) {
        throw new Error("Scores cannot be negative");
      }

      const supabase = createClient();

      // Update game with scores
      const { error: updateError } = await supabase
        .from("games")
        .update({
          home_score: homeScore,
          away_score: awayScore,
          status: "completed",
        })
        .eq("id", params.id);

      if (updateError) {
        throw updateError;
      }

      // Refresh game data
      const { data, error: refreshError } = await supabase
        .from("games")
        .select(
          `
          *,
          home_team:teams!games_home_team_id_fkey(*),
          away_team:teams!games_away_team_id_fkey(*)
        `
        )
        .eq("id", params.id)
        .single();

      if (!refreshError && data) {
        setGame(data as unknown as GameWithTeams);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error submitting score:", err);
      setError(err instanceof Error ? err.message : "Failed to submit score");
      setLoading(false);
    }
  };

  if (!params) {
    return <div>Loading...</div>;
  }

  if (error && !game) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
          {error}
        </div>
      </div>
    );
  }

  if (!game) {
    return <div>Loading game...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/leagues/${params.slug}`}
          className="p-2 hover:bg-surface-raised rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <h1 className="text-3xl font-bold text-white">Game Details</h1>
      </div>

      <div className="space-y-6">
        {/* Game Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Game Information</CardTitle>
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
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Teams */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: game.home_team.color }}
                  />
                  <h3 className="text-xl font-bold text-white">
                    {game.home_team.name}
                  </h3>
                </div>
                {game.status === "completed" && game.home_score !== null && (
                  <p className="text-4xl font-bold text-white">
                    {game.home_score}
                  </p>
                )}
              </div>

              <div className="text-center">
                <p className="text-gray-400 text-sm">vs</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: game.away_team.color }}
                  />
                  <h3 className="text-xl font-bold text-white">
                    {game.away_team.name}
                  </h3>
                </div>
                {game.status === "completed" && game.away_score !== null && (
                  <p className="text-4xl font-bold text-white">
                    {game.away_score}
                  </p>
                )}
              </div>
            </div>

            {/* Game Details */}
            <div className="border-t border-surface-border pt-4 space-y-3">
              <div className="flex items-center gap-3 text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(game.scheduled_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              {game.scheduled_time && (
                <div className="flex items-center gap-3 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{game.scheduled_time}</span>
                </div>
              )}

              {game.location && (
                <div className="flex items-center gap-3 text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{game.location}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Score Entry Form */}
        {game.status === "scheduled" && (
          <Card>
            <CardHeader>
              <CardTitle>Enter Score</CardTitle>
              <CardDescription>
                Submit the final score to complete this game
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitScore} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                      {game.home_team.name} Score{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={scores.homeScore}
                      onChange={(e) =>
                        setScores({ ...scores, homeScore: e.target.value })
                      }
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                      {game.away_team.name} Score{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={scores.awayScore}
                      onChange={(e) =>
                        setScores({ ...scores, awayScore: e.target.value })
                      }
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Submitting..." : "Submit Score"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Completed Game Message */}
        {game.status === "completed" && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-white">
                  Game Completed
                </p>
                <p className="text-gray-400">
                  {game.home_score !== null && game.away_score !== null
                    ? game.home_score > game.away_score
                      ? `${game.home_team.name} wins ${game.home_score}-${game.away_score}`
                      : game.away_score > game.home_score
                        ? `${game.away_team.name} wins ${game.away_score}-${game.home_score}`
                        : `Game ended in a tie ${game.home_score}-${game.away_score}`
                    : "Final scores recorded"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
