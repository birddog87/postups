# Phase 2: Quick Setup Wizard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a guided chat wizard that lets admins set up a complete league (teams + schedule) in under 2 minutes.

**Architecture:** React client component with step-based chat UI → Next.js API route for OpenAI parsing → Schedule generator utility → Bulk create via Supabase.

**Tech Stack:** Next.js 16, React 19, OpenAI GPT-4, Supabase, TypeScript

---

## Task 1: Install OpenAI Dependency

**Files:**
- Modify: `package.json`
- Create: `.env.local` (add OPENAI_API_KEY)

**Step 1: Install the OpenAI package**

Run:
```bash
npm install openai
```

**Step 2: Add environment variable**

Add to `.env.local`:
```
OPENAI_API_KEY=sk-your-key-here
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add openai dependency"
```

---

## Task 2: Create Types for Quick Setup

**Files:**
- Create: `src/lib/types/quick-setup.ts`

**Step 1: Create the types file**

```typescript
// src/lib/types/quick-setup.ts

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type SportType =
  | "hockey"
  | "soccer"
  | "basketball"
  | "volleyball"
  | "football"
  | "softball"
  | "other";

export type ScheduleFormat = "round-robin" | "double-round-robin";

export interface QuickSetupData {
  league: {
    name: string;
    sport: SportType;
  };
  teams: {
    count: number;
    names: string[];
  };
  schedule: {
    days: DayOfWeek[];
    timeSlots: string[]; // ["18:00", "20:00"]
    startDate: string; // ISO date YYYY-MM-DD
    endDate: string;
    format: ScheduleFormat;
  };
  location: {
    name: string;
    address?: string;
  };
}

export interface WizardStep {
  id: string;
  question: string;
  field: keyof QuickSetupData | string;
  completed: boolean;
}

export interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

export interface GeneratedGame {
  homeTeamIndex: number;
  awayTeamIndex: number;
  date: string;
  time: string;
  location: string;
}

export interface GeneratedSchedule {
  teams: { name: string; color: string }[];
  games: GeneratedGame[];
}
```

**Step 2: Commit**

```bash
git add src/lib/types/quick-setup.ts
git commit -m "feat: add quick setup types"
```

---

## Task 3: Create Schedule Generator Utility

**Files:**
- Create: `src/lib/schedule-generator.ts`

**Step 1: Create the schedule generator**

```typescript
// src/lib/schedule-generator.ts

import { QuickSetupData, GeneratedSchedule, GeneratedGame, DayOfWeek } from "./types/quick-setup";

// Team colors to auto-assign
const TEAM_COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#a855f7", // purple
];

const DAY_MAP: Record<DayOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Generate round-robin pairings for n teams
 * Returns array of rounds, each round containing matchups [home, away]
 */
function generateRoundRobinPairings(teamCount: number): [number, number][][] {
  const teams = Array.from({ length: teamCount }, (_, i) => i);

  // If odd number of teams, add a "bye" team
  if (teams.length % 2 !== 0) {
    teams.push(-1); // -1 represents bye
  }

  const rounds: [number, number][][] = [];
  const n = teams.length;

  for (let round = 0; round < n - 1; round++) {
    const roundMatchups: [number, number][] = [];

    for (let i = 0; i < n / 2; i++) {
      const home = teams[i];
      const away = teams[n - 1 - i];

      // Skip bye games
      if (home !== -1 && away !== -1) {
        // Alternate home/away for fairness
        if (round % 2 === 0) {
          roundMatchups.push([home, away]);
        } else {
          roundMatchups.push([away, home]);
        }
      }
    }

    rounds.push(roundMatchups);

    // Rotate teams (keep first team fixed)
    const last = teams.pop()!;
    teams.splice(1, 0, last);
  }

  return rounds;
}

/**
 * Get the next occurrence of a specific day of week from a start date
 */
function getNextDayOfWeek(startDate: Date, dayOfWeek: DayOfWeek): Date {
  const result = new Date(startDate);
  const targetDay = DAY_MAP[dayOfWeek];
  const currentDay = result.getDay();

  let daysToAdd = targetDay - currentDay;
  if (daysToAdd < 0) {
    daysToAdd += 7;
  }

  result.setDate(result.getDate() + daysToAdd);
  return result;
}

/**
 * Generate a complete schedule from quick setup data
 */
export function generateSchedule(data: QuickSetupData): GeneratedSchedule {
  const { teams: teamData, schedule, location } = data;

  // Create teams with auto-assigned colors
  const teams = teamData.names.map((name, index) => ({
    name,
    color: TEAM_COLORS[index % TEAM_COLORS.length],
  }));

  // Generate round-robin pairings
  let allPairings = generateRoundRobinPairings(teams.length);

  // Double the pairings for double round-robin (home/away swap)
  if (schedule.format === "double-round-robin") {
    const reversePairings = allPairings.map(round =>
      round.map(([home, away]): [number, number] => [away, home])
    );
    allPairings = [...allPairings, ...reversePairings];
  }

  // Flatten to get all games
  const allMatchups = allPairings.flat();

  // Calculate available game slots
  const startDate = new Date(schedule.startDate);
  const endDate = new Date(schedule.endDate);
  const slotsPerDay = schedule.timeSlots.length;

  // Build list of all available game slots
  const gameSlots: { date: Date; time: string }[] = [];

  for (const day of schedule.days) {
    let currentDate = getNextDayOfWeek(startDate, day);

    while (currentDate <= endDate) {
      for (const time of schedule.timeSlots) {
        gameSlots.push({
          date: new Date(currentDate),
          time,
        });
      }
      // Move to next week
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 7);
    }
  }

  // Sort slots chronologically
  gameSlots.sort((a, b) => {
    const dateCompare = a.date.getTime() - b.date.getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

  // Assign matchups to slots
  const games: GeneratedGame[] = [];

  for (let i = 0; i < allMatchups.length && i < gameSlots.length; i++) {
    const [homeTeamIndex, awayTeamIndex] = allMatchups[i];
    const slot = gameSlots[i];

    games.push({
      homeTeamIndex,
      awayTeamIndex,
      date: slot.date.toISOString().split("T")[0],
      time: slot.time,
      location: location.name,
    });
  }

  return { teams, games };
}

/**
 * Generate default team names if user didn't provide any
 */
export function generateTeamNames(count: number, sport: string): string[] {
  const sportNames: Record<string, string[]> = {
    hockey: ["Blades", "Icers", "Wolves", "Storm", "Thunder", "Freeze", "Avalanche", "Flames", "Jets", "Penguins", "Knights", "Sharks"],
    soccer: ["United", "City", "Rovers", "Athletic", "Wanderers", "Rangers", "Dynamo", "Sporting", "Real", "Inter", "Olympic", "Phoenix"],
    basketball: ["Ballers", "Hoops", "Dunkers", "Blazers", "Heat", "Thunder", "Kings", "Warriors", "Lakers", "Celtics", "Rockets", "Bulls"],
    volleyball: ["Spikers", "Aces", "Setters", "Blockers", "Diggers", "Smash", "Rally", "Volley", "Net", "Court", "Attack", "Serve"],
    football: ["Gridiron", "Blitz", "Chargers", "Titans", "Eagles", "Hawks", "Bears", "Lions", "Giants", "Raiders", "Chiefs", "Colts"],
    softball: ["Sluggers", "Batters", "Diamonds", "Homers", "Innings", "Pitchers", "Catchers", "Sliders", "Curves", "Strikes", "Bases", "Runs"],
    other: ["Team Alpha", "Team Beta", "Team Gamma", "Team Delta", "Team Epsilon", "Team Zeta", "Team Eta", "Team Theta", "Team Iota", "Team Kappa", "Team Lambda", "Team Mu"],
  };

  const names = sportNames[sport] || sportNames.other;
  return names.slice(0, count);
}
```

**Step 2: Commit**

```bash
git add src/lib/schedule-generator.ts
git commit -m "feat: add round-robin schedule generator"
```

---

## Task 4: Create AI Provider Abstraction

**Files:**
- Create: `src/lib/ai/provider.ts`
- Create: `src/lib/ai/openai.ts`

**Step 1: Create provider interface**

```typescript
// src/lib/ai/provider.ts

import { QuickSetupData } from "../types/quick-setup";

export interface ParseResult {
  success: boolean;
  data?: Partial<QuickSetupData>;
  clarification?: string;
  error?: string;
}

export interface AIProvider {
  parseUserInput(
    userMessage: string,
    currentStep: string,
    existingData: Partial<QuickSetupData>
  ): Promise<ParseResult>;
}
```

**Step 2: Create OpenAI implementation**

```typescript
// src/lib/ai/openai.ts

import OpenAI from "openai";
import { AIProvider, ParseResult } from "./provider";
import { QuickSetupData, SportType, DayOfWeek, ScheduleFormat } from "../types/quick-setup";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful assistant for setting up sports leagues.
Parse user input and extract structured data. Be flexible with natural language.

Current step determines what to extract:
- "league": Extract league name and sport type
- "teams": Extract team count and/or team names
- "schedule": Extract game days, time slots, format (round-robin or double)
- "dates": Extract season start and end dates
- "location": Extract venue name and optional address

Always respond with valid JSON matching the schema for the current step.
If you can't understand the input, set success=false and provide a clarification question.`;

function getStepSchema(step: string): string {
  switch (step) {
    case "league":
      return `{
        "success": true,
        "data": {
          "league": {
            "name": "string",
            "sport": "hockey|soccer|basketball|volleyball|football|softball|other"
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
        model: "gpt-4-turbo-preview",
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
```

**Step 3: Commit**

```bash
git add src/lib/ai/provider.ts src/lib/ai/openai.ts
git commit -m "feat: add AI provider abstraction with OpenAI implementation"
```

---

## Task 5: Create API Route for Parsing

**Files:**
- Create: `src/app/api/quick-setup/parse/route.ts`

**Step 1: Create the API route**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/app/api/quick-setup/parse/route.ts
git commit -m "feat: add quick setup parse API route"
```

---

## Task 6: Create API Route for Schedule Generation

**Files:**
- Create: `src/app/api/quick-setup/generate/route.ts`

**Step 1: Create the generate API route**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/app/api/quick-setup/generate/route.ts
git commit -m "feat: add quick setup generate API route"
```

---

## Task 7: Create API Route for Creating League

**Files:**
- Create: `src/app/api/quick-setup/create/route.ts`

**Step 1: Create the create API route**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/app/api/quick-setup/create/route.ts
git commit -m "feat: add quick setup create API route with rollback"
```

---

## Task 8: Create Quick Setup Wizard Component

**Files:**
- Create: `src/components/league/quick-setup-wizard.tsx`

**Step 1: Create the wizard component**

```typescript
// src/components/league/quick-setup-wizard.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { Send, Loader2, Check, ChevronRight } from "lucide-react";
import {
  QuickSetupData,
  ChatMessage,
  GeneratedSchedule,
} from "@/lib/types/quick-setup";

const WIZARD_STEPS = [
  {
    id: "league",
    question: "What's your league called and what sport do you play?",
    placeholder: "e.g., Sunday Night Hockey League",
  },
  {
    id: "teams",
    question: "How many teams? You can list team names or just give me a number.",
    placeholder: "e.g., 8 teams or Thunderbolts, Red Wings, Warriors...",
  },
  {
    id: "schedule",
    question: "What days and times do you play?",
    placeholder: "e.g., Mondays at 6pm and 8pm",
  },
  {
    id: "dates",
    question: "When does the season start and end?",
    placeholder: "e.g., January 15 to March 30",
  },
  {
    id: "location",
    question: "Where are games played?",
    placeholder: "e.g., Central Recreation Center",
  },
];

export function QuickSetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: WIZARD_STEPS[0].question,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<Partial<QuickSetupData>>({});
  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedSchedule | null>(null);
  const [creating, setCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Add user message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ]);

    try {
      // Parse with AI
      const parseRes = await fetch("/api/quick-setup/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          step: WIZARD_STEPS[currentStep].id,
          existingData: setupData,
        }),
      });

      const parseResult = await parseRes.json();

      if (!parseResult.success) {
        // AI needs clarification
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: parseResult.clarification || "Sorry, I didn't understand that. Could you try again?",
            timestamp: new Date(),
          },
        ]);
        setLoading(false);
        return;
      }

      // Merge parsed data
      const newData = { ...setupData, ...parseResult.data };
      setSetupData(newData);

      // Move to next step
      const nextStep = currentStep + 1;

      if (nextStep < WIZARD_STEPS.length) {
        setCurrentStep(nextStep);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Got it! ${WIZARD_STEPS[nextStep].question}`,
            timestamp: new Date(),
          },
        ]);
      } else {
        // All steps complete - generate preview
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Perfect! Let me generate your league setup...",
            timestamp: new Date(),
          },
        ]);

        // Call generate API
        const genRes = await fetch("/api/quick-setup/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: newData }),
        });

        const genResult = await genRes.json();

        if (genResult.success) {
          setGeneratedSchedule(genResult.data);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Here's your league preview! ${genResult.data.teams.length} teams and ${genResult.data.games.length} games ready to go.`,
              timestamp: new Date(),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Sorry, there was an error generating your schedule. Please try again.",
              timestamp: new Date(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Wizard error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    }

    setLoading(false);
  };

  const handleCreate = async () => {
    if (!generatedSchedule || creating) return;

    setCreating(true);

    try {
      const res = await fetch("/api/quick-setup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setupData,
          generatedSchedule,
        }),
      });

      const result = await res.json();

      if (result.success) {
        router.push(`/leagues/${result.data.league.slug}`);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error creating league: ${result.error}`,
            timestamp: new Date(),
          },
        ]);
        setCreating(false);
      }
    } catch (error) {
      console.error("Create error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to create league. Please try again.",
          timestamp: new Date(),
        },
      ]);
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-0">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 p-4 border-b border-surface-border">
          {WIZARD_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index < currentStep
                    ? "bg-brand-500 text-white"
                    : index === currentStep
                    ? "bg-brand-500/20 text-brand-500 border-2 border-brand-500"
                    : "bg-surface-border text-gray-500"
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < WIZARD_STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-500 mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* Chat messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === "user"
                    ? "bg-brand-500 text-white"
                    : "bg-surface-raised text-white border border-surface-border"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Preview section */}
        {generatedSchedule && (
          <div className="p-4 border-t border-surface-border space-y-4">
            <h3 className="font-semibold text-white">Preview</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-surface-raised p-3 rounded-lg border border-surface-border">
                <p className="text-gray-400">Teams</p>
                <p className="text-white font-medium">
                  {generatedSchedule.teams.length} teams
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {generatedSchedule.teams.slice(0, 4).map((team, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-xs"
                      style={{ backgroundColor: team.color + "20", color: team.color }}
                    >
                      {team.name}
                    </span>
                  ))}
                  {generatedSchedule.teams.length > 4 && (
                    <span className="text-gray-500 text-xs">
                      +{generatedSchedule.teams.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-surface-raised p-3 rounded-lg border border-surface-border">
                <p className="text-gray-400">Schedule</p>
                <p className="text-white font-medium">
                  {generatedSchedule.games.length} games
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {generatedSchedule.games[0]?.date} to{" "}
                  {generatedSchedule.games[generatedSchedule.games.length - 1]?.date}
                </p>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              loading={creating}
              className="w-full"
              size="lg"
            >
              Create League
            </Button>
          </div>
        )}

        {/* Input area */}
        {!generatedSchedule && (
          <div className="p-4 border-t border-surface-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={WIZARD_STEPS[currentStep]?.placeholder || "Type your answer..."}
                disabled={loading}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={loading || !input.trim()}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/league/quick-setup-wizard.tsx
git commit -m "feat: add quick setup wizard chat UI component"
```

---

## Task 9: Update Create League Page

**Files:**
- Modify: `src/app/(dashboard)/leagues/new/page.tsx`

**Step 1: Add tab toggle between manual and quick setup**

Replace the entire file with:

```typescript
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

      const { data, error: insertError } = await supabase
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
```

**Step 2: Commit**

```bash
git add src/app/\(dashboard\)/leagues/new/page.tsx
git commit -m "feat: add quick setup toggle to create league page"
```

---

## Task 10: Test and Verify

**Step 1: Run the build**

```bash
npm run build
```

Expected: Build passes with no errors

**Step 2: Test locally**

```bash
npm run dev
```

1. Navigate to `/leagues/new`
2. Toggle between Quick Setup and Manual modes
3. Test Quick Setup flow with sample input:
   - "Sunday Night Hockey"
   - "8 teams"
   - "Mondays at 6pm and 8pm"
   - "January 15 to March 30"
   - "Central Rec Center"

**Step 3: Commit final changes**

```bash
git add .
git commit -m "feat: complete phase 2 quick setup wizard implementation"
```

---

## Summary

**Files Created:**
- `src/lib/types/quick-setup.ts` - Type definitions
- `src/lib/schedule-generator.ts` - Round-robin schedule generation
- `src/lib/ai/provider.ts` - AI provider interface
- `src/lib/ai/openai.ts` - OpenAI implementation
- `src/app/api/quick-setup/parse/route.ts` - AI parsing endpoint
- `src/app/api/quick-setup/generate/route.ts` - Schedule generation endpoint
- `src/app/api/quick-setup/create/route.ts` - League creation endpoint
- `src/components/league/quick-setup-wizard.tsx` - Chat wizard UI

**Files Modified:**
- `package.json` - Added openai dependency
- `.env.local` - Added OPENAI_API_KEY
- `src/app/(dashboard)/leagues/new/page.tsx` - Added mode toggle

**Total: 10 tasks, ~45 minutes estimated**
