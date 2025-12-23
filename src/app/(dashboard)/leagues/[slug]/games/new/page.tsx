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
} from "@/components/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Team } from "@/lib/supabase/types";

interface AddGamePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function AddGamePage({ params: paramsPromise }: AddGamePageProps) {
  const router = useRouter();
  const [params, setParams] = useState<{ slug: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    homeTeamId: "",
    awayTeamId: "",
    date: "",
    time: "",
    location: "",
  });

  useEffect(() => {
    paramsPromise.then(setParams);
  }, [paramsPromise]);

  useEffect(() => {
    if (!params) return;

    const fetchTeams = async () => {
      const supabase = createClient();

      // Get league ID and teams
      const { data: league, error: leagueError } = await supabase
        .from("leagues")
        .select("id, teams(*)")
        .eq("slug", params.slug)
        .single();

      if (leagueError || !league) {
        setError("League not found");
        return;
      }

      setTeams((league.teams || []) as Team[]);
    };

    fetchTeams();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!params) return;

    try {
      if (formData.homeTeamId === formData.awayTeamId) {
        throw new Error("Home and away teams must be different");
      }

      const supabase = createClient();

      // Get league ID
      const { data: league, error: leagueError } = await supabase
        .from("leagues")
        .select("id")
        .eq("slug", params.slug)
        .single();

      if (leagueError || !league) {
        throw new Error("League not found");
      }

      // Insert game
      const { error: insertError } = await supabase.from("games").insert({
        league_id: league.id,
        home_team_id: formData.homeTeamId,
        away_team_id: formData.awayTeamId,
        scheduled_date: formData.date,
        scheduled_time: formData.time || null,
        location: formData.location || null,
        status: "scheduled",
      });

      if (insertError) {
        throw insertError;
      }

      // Redirect back to league page
      router.push(`/leagues/${params.slug}`);
      router.refresh();
    } catch (err) {
      console.error("Error adding game:", err);
      setError(err instanceof Error ? err.message : "Failed to add game");
      setLoading(false);
    }
  };

  if (!params) {
    return <div>Loading...</div>;
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
        <h1 className="text-3xl font-bold text-white">Add Game</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Game Information</CardTitle>
          <CardDescription>Schedule a new game for your league</CardDescription>
        </CardHeader>
        <CardContent>
          {teams.length < 2 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">
                You need at least 2 teams to schedule a game.
              </p>
              <Link href={`/leagues/${params.slug}/teams/new`}>
                <Button>Add Team</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="homeTeam"
                  className="text-sm font-medium text-white"
                >
                  Home Team <span className="text-red-500">*</span>
                </label>
                <select
                  id="homeTeam"
                  value={formData.homeTeamId}
                  onChange={(e) =>
                    setFormData({ ...formData, homeTeamId: e.target.value })
                  }
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 bg-surface border border-surface-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select home team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="awayTeam"
                  className="text-sm font-medium text-white"
                >
                  Away Team <span className="text-red-500">*</span>
                </label>
                <select
                  id="awayTeam"
                  value={formData.awayTeamId}
                  onChange={(e) =>
                    setFormData({ ...formData, awayTeamId: e.target.value })
                  }
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 bg-surface border border-surface-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select away team</option>
                  {teams
                    .filter((team) => team.id !== formData.homeTeamId)
                    .map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="date"
                  className="text-sm font-medium text-white"
                >
                  Date <span className="text-red-500">*</span>
                </label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="time"
                  className="text-sm font-medium text-white"
                >
                  Time (optional)
                </label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="location"
                  className="text-sm font-medium text-white"
                >
                  Location (optional)
                </label>
                <Input
                  id="location"
                  type="text"
                  placeholder="Enter game location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Scheduling..." : "Schedule Game"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
