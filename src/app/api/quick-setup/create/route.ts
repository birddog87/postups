// src/app/api/quick-setup/create/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { QuickSetupData, GeneratedSchedule } from "@/lib/types/quick-setup";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { setupData, generatedSchedule } = body as {
      setupData: QuickSetupData;
      generatedSchedule: GeneratedSchedule;
    };

    if (!setupData || !generatedSchedule) {
      return NextResponse.json(
        { success: false, error: "Missing data" },
        { status: 400 }
      );
    }

    // 1. Create the league
    const slug = generateSlug(setupData.league.name);
    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .insert({
        name: setupData.league.name,
        slug,
        sport: setupData.league.sport,
        settings: {
          points_win: 2,
          points_loss: 0,
          points_tie: 1,
          ties_allowed: true,
        },
        owner_id: user.id,
      })
      .select()
      .single();

    if (leagueError) {
      console.error("League creation error:", leagueError);
      return NextResponse.json(
        { success: false, error: "Failed to create league" },
        { status: 500 }
      );
    }

    // 2. Create the teams
    const teamsToInsert = generatedSchedule.teams.map((team) => ({
      league_id: league.id,
      name: team.name,
      color: team.color,
    }));

    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .insert(teamsToInsert)
      .select();

    if (teamsError) {
      console.error("Teams creation error:", teamsError);
      // Rollback league
      await supabase.from("leagues").delete().eq("id", league.id);
      return NextResponse.json(
        { success: false, error: "Failed to create teams" },
        { status: 500 }
      );
    }

    // 3. Create the games
    const gamesToInsert = generatedSchedule.games.map((game) => ({
      league_id: league.id,
      home_team_id: teams[game.homeTeamIndex].id,
      away_team_id: teams[game.awayTeamIndex].id,
      scheduled_date: game.date,
      scheduled_time: game.time,
      location: game.location,
      status: "scheduled" as const,
      metadata: {},
    }));

    const { error: gamesError } = await supabase
      .from("games")
      .insert(gamesToInsert);

    if (gamesError) {
      console.error("Games creation error:", gamesError);
      // Rollback teams and league
      await supabase.from("teams").delete().eq("league_id", league.id);
      await supabase.from("leagues").delete().eq("id", league.id);
      return NextResponse.json(
        { success: false, error: "Failed to create schedule" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        league,
        teamCount: teams.length,
        gameCount: gamesToInsert.length,
      },
    });
  } catch (error) {
    console.error("Create API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
