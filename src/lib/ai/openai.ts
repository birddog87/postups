// src/lib/ai/openai.ts

import OpenAI from "openai";
import { AIProvider, ParseResult } from "./provider";
import { QuickSetupData } from "../types/quick-setup";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful assistant for setting up sports leagues.
Parse user input and extract structured data. Be VERY flexible with natural language.

Current step determines what to extract:
- "league": Extract league name and sport type (any sport is valid - hockey, soccer, basketball, volleyball, football, softball, badminton, tennis, pickleball, etc. Use "other" only if truly unrecognizable)
- "teams": Extract team count and/or team names
- "schedule": Extract game days, time slots, format (round-robin or double)
- "dates": Extract season start and end dates
- "location": Extract venue name and optional address

IMPORTANT: Be lenient! If you can reasonably understand what the user means, extract it.
Only return success=false if the input is truly incomprehensible.
Always respond with valid JSON matching the schema for the current step.`;

function getStepSchema(step: string): string {
  switch (step) {
    case "league":
      return `{
        "success": true,
        "data": {
          "league": {
            "name": "string (the league name)",
            "sport": "string (any sport: hockey, soccer, basketball, volleyball, football, softball, badminton, tennis, pickleball, baseball, etc.)"
          }
        }
      }`;
    case "teams":
      return `{
        "success": true,
        "data": {
          "teams": {
            "count": number,
            "names": ["Team 1", "Team 2", ...] // optional, can be empty array
          }
        }
      }`;
    case "schedule":
      return `{
        "success": true,
        "data": {
          "schedule": {
            "days": ["monday", "wednesday", ...],
            "timeSlots": ["18:00", "20:00", ...], // 24hr format
            "format": "round-robin|double-round-robin"
          }
        }
      }`;
    case "dates":
      return `{
        "success": true,
        "data": {
          "schedule": {
            "startDate": "YYYY-MM-DD",
            "endDate": "YYYY-MM-DD"
          }
        }
      }`;
    case "location":
      return `{
        "success": true,
        "data": {
          "location": {
            "name": "string",
            "address": "string" // optional
          }
        }
      }`;
    default:
      return `{ "success": false, "clarification": "I need more information." }`;
  }
}

export const openaiProvider: AIProvider = {
  async parseUserInput(
    userMessage: string,
    currentStep: string,
    existingData: Partial<QuickSetupData>
  ): Promise<ParseResult> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Current step: ${currentStep}
Expected response schema: ${getStepSchema(currentStep)}
Existing data so far: ${JSON.stringify(existingData)}

User says: "${userMessage}"

Parse this and respond with JSON only.`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { success: false, error: "No response from AI" };
      }

      const parsed = JSON.parse(content);
      return parsed as ParseResult;
    } catch (error) {
      console.error("OpenAI parsing error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to parse input",
      };
    }
  },
};
