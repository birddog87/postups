// src/app/(dashboard)/leagues/new/page.tsx

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
import { ArrowLeft, Zap, FileText } from "lucide-react";
import Link from "next/link";
import { QuickSetupWizard } from "@/components/league/quick-setup-wizard";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

type SetupMode = "quick" | "manual";

export default function CreateLeaguePage() {
  const router = useRouter();
  const [mode, setMode] = useState<SetupMode>("quick");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sport: "hockey",
    pointsWin: 2,
    pointsLoss: 0,
    pointsTie: 1,
    tiesAllowed: true,
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be logged in to create a league");
      }

      const slug = generateSlug(formData.name);

      const { error: insertError } = await supabase
        .from("leagues")
        .insert({
          name: formData.name,
          slug,
          sport: formData.sport,
          settings: {
            points_win: formData.pointsWin,
            points_loss: formData.pointsLoss,
            points_tie: formData.pointsTie,
            ties_allowed: formData.tiesAllowed,
          },
          owner_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      router.push(`/leagues/${slug}`);
    } catch (err) {
      console.error("Error creating league:", err);
      setError(err instanceof Error ? err.message : "Failed to create league");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/leagues"
          className="p-2 hover:bg-surface-raised rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Create New League</h1>
          <p className="text-gray-400 mt-1">
            Set up your league and start managing teams
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-surface-raised rounded-xl border border-surface-border">
        <button
          onClick={() => setMode("quick")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            mode === "quick"
              ? "bg-brand-500 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Zap className="w-4 h-4" />
          Quick Setup
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            mode === "manual"
              ? "bg-brand-500 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          Manual Setup
        </button>
      </div>

      {/* Quick Setup Wizard */}
      {mode === "quick" && <QuickSetupWizard />}

      {/* Manual Form */}
      {mode === "manual" && (
        <Card>
          <CardHeader>
            <CardTitle>League Details</CardTitle>
            <CardDescription>
              Configure your league settings and scoring system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <Input
                label="League Name"
                type="text"
                placeholder="e.g., Sunday Night Hockey League"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />

              <div className="space-y-2">
                <label
                  htmlFor="sport"
                  className="block text-sm font-medium text-gray-300"
                >
                  Sport Type
                </label>
                <select
                  id="sport"
                  value={formData.sport}
                  onChange={(e) =>
                    setFormData({ ...formData, sport: e.target.value })
                  }
                  className="w-full bg-surface-raised border border-surface-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="hockey">Hockey</option>
                  <option value="soccer">Soccer</option>
                  <option value="basketball">Basketball</option>
                  <option value="volleyball">Volleyball</option>
                  <option value="football">Football</option>
                  <option value="softball">Softball</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  Points Settings
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Win Points"
                    type="number"
                    min="0"
                    value={formData.pointsWin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pointsWin: parseInt(e.target.value),
                      })
                    }
                    required
                  />

                  <Input
                    label="Loss Points"
                    type="number"
                    min="0"
                    value={formData.pointsLoss}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pointsLoss: parseInt(e.target.value),
                      })
                    }
                    required
                  />

                  <Input
                    label="Tie Points"
                    type="number"
                    min="0"
                    value={formData.pointsTie}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pointsTie: parseInt(e.target.value),
                      })
                    }
                    disabled={!formData.tiesAllowed}
                    required={formData.tiesAllowed}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="tiesAllowed"
                    checked={formData.tiesAllowed}
                    onChange={(e) =>
                      setFormData({ ...formData, tiesAllowed: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-surface-border bg-surface-raised text-brand-500 focus:ring-2 focus:ring-brand-500"
                  />
                  <label
                    htmlFor="tiesAllowed"
                    className="text-sm font-medium text-gray-300"
                  >
                    Allow tie games
                  </label>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <Button type="submit" loading={loading} size="lg">
                  Create League
                </Button>
                <Link href="/leagues">
                  <Button type="button" variant="ghost" size="lg">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
