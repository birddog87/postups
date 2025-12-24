// src/app/api/quick-setup/parse/route.ts

import { NextRequest, NextResponse } from "next/server";
import { openaiProvider } from "@/lib/ai/openai";
import { QuickSetupData } from "@/lib/types/quick-setup";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, step, existingData } = body as {
      message: string;
      step: string;
      existingData: Partial<QuickSetupData>;
    };

    if (!message || !step) {
      return NextResponse.json(
        { success: false, error: "Missing message or step" },
        { status: 400 }
      );
    }

    const result = await openaiProvider.parseUserInput(message, step, existingData);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Parse API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
