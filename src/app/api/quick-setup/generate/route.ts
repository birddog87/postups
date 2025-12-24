// src/app/api/quick-setup/generate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { generateSchedule, generateTeamNames } from "@/lib/schedule-generator";
import { QuickSetupData } from "@/lib/types/quick-setup";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body as { data: Partial<QuickSetupData> };

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Missing setup data" },
        { status: 400 }
      );
    }

    // Ensure all required fields exist with defaults
    const completeData: QuickSetupData = {
      league: {
        name: data.league?.name || "My League",
        sport: data.league?.sport || "other",
      },
      teams: {
        count: data.teams?.count || 8,
        names: data.teams?.names || [],
      },
      schedule: {
        days: data.schedule?.days || ["monday"],
        timeSlots: data.schedule?.timeSlots || ["19:00"],
        startDate: data.schedule?.startDate || new Date().toISOString().split("T")[0],
        endDate: data.schedule?.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        format: data.schedule?.format || "round-robin",
      },
      location: {
        name: data.location?.name || "TBD",
        address: data.location?.address,
      },
    };

    // Generate team names if not provided
    if (completeData.teams.names.length === 0) {
      completeData.teams.names = generateTeamNames(completeData.teams.count, completeData.league.sport);
    }

    // Ensure we have the right number of team names
    if (completeData.teams.names.length < completeData.teams.count) {
      const additionalNames = generateTeamNames(
        completeData.teams.count - completeData.teams.names.length,
        completeData.league.sport
      );
      completeData.teams.names = [...completeData.teams.names, ...additionalNames];
    }

    const schedule = generateSchedule(completeData);

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate schedule" },
      { status: 500 }
    );
  }
}
