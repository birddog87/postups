// src/lib/types/quick-setup.ts

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

// Common sports, but accepts any string for flexibility
export type SportType = string;

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
