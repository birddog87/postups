"use client";

import { useState } from "react";
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

const teamColors = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#ef4444", // red
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

interface AddTeamPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function AddTeamPage({ params }: AddTeamPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    color: teamColors[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { slug } = await params;
      const supabase = createClient();

      // Get league ID from slug
      const { data: league, error: leagueError } = await supabase
        .from("leagues")
        .select("id")
        .eq("slug", slug)
        .single();

      if (leagueError || !league) {
        throw new Error("League not found");
      }

      // Insert team
      const { error: insertError } = await supabase.from("teams").insert({
        league_id: league.id,
        name: formData.name,
        short_name: formData.shortName || null,
        color: formData.color,
      });

      if (insertError) {
        throw insertError;
      }

      // Redirect back to league page
      router.push(`/leagues/${slug}`);
      router.refresh();
    } catch (err) {
      console.error("Error adding team:", err);
      setError(err instanceof Error ? err.message : "Failed to add team");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/leagues/${(params as any).slug}`}
          className="p-2 hover:bg-surface-raised rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <h1 className="text-3xl font-bold text-white">Add Team</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
          <CardDescription>
            Add a new team to your league
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-white">
                Team Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Enter team name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="shortName"
                className="text-sm font-medium text-white"
              >
                Short Name (optional)
              </label>
              <Input
                id="shortName"
                type="text"
                placeholder="3-4 characters"
                maxLength={4}
                value={formData.shortName}
                onChange={(e) =>
                  setFormData({ ...formData, shortName: e.target.value })
                }
                disabled={loading}
              />
              <p className="text-xs text-gray-400">
                Used for compact displays and standings
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Team Color
              </label>
              <div className="grid grid-cols-8 gap-3">
                {teamColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    disabled={loading}
                    className={`w-full aspect-square rounded-lg transition-all ${
                      formData.color === color
                        ? "ring-2 ring-white ring-offset-2 ring-offset-surface scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
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
                {loading ? "Adding..." : "Add Team"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
