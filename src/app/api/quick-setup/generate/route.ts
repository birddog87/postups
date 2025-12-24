// src/app/api/quick-setup/generate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { generateSchedule, generateTeamNames } from "@/lib/schedule-generator";
import { QuickSetupData } from "@/lib/types/quick-setup";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body as { data: QuickSetupData };

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Missing setup data" },
        { status: 400 }
      );
    }

    // Generate team names if not provided
    if (data.teams.names.length === 0) {
      data.teams.names = generateTeamNames(data.teams.count, data.league.sport);
    }

    // Ensure we have the right number of team names
    if (data.teams.names.length < data.teams.count) {
      const additionalNames = generateTeamNames(
        data.teams.count - data.teams.names.length,
        data.league.sport
      );
      data.teams.names = [...data.teams.names, ...additionalNames];
    }

    const schedule = generateSchedule(data);

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
