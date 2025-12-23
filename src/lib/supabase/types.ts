// src/lib/supabase/types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      leagues: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sport: string;
          settings: Json;
          owner_id: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          sport?: string;
          settings?: Json;
          owner_id: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          sport?: string;
          settings?: Json;
          owner_id?: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          league_id: string;
          name: string;
          short_name: string | null;
          captain_id: string | null;
          logo_url: string | null;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          name: string;
          short_name?: string | null;
          captain_id?: string | null;
          logo_url?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          name?: string;
          short_name?: string | null;
          captain_id?: string | null;
          logo_url?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          league_id: string;
          home_team_id: string;
          away_team_id: string;
          scheduled_date: string;
          scheduled_time: string | null;
          location: string | null;
          home_score: number | null;
          away_score: number | null;
          status: "scheduled" | "completed" | "postponed" | "cancelled";
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          home_team_id: string;
          away_team_id: string;
          scheduled_date: string;
          scheduled_time?: string | null;
          location?: string | null;
          home_score?: number | null;
          away_score?: number | null;
          status?: "scheduled" | "completed" | "postponed" | "cancelled";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          home_team_id?: string;
          away_team_id?: string;
          scheduled_date?: string;
          scheduled_time?: string | null;
          location?: string | null;
          home_score?: number | null;
          away_score?: number | null;
          status?: "scheduled" | "completed" | "postponed" | "cancelled";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Helper types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type League = Database["public"]["Tables"]["leagues"]["Row"];
export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type Game = Database["public"]["Tables"]["games"]["Row"];

export type LeagueSettings = {
  points_win: number;
  points_loss: number;
  points_tie: number;
  ties_allowed: boolean;
};

export type TeamWithStats = Team & {
  wins: number;
  losses: number;
  ties: number;
  points: number;
  goals_for: number;
  goals_against: number;
  differential: number;
  games_played: number;
};

export type GameWithTeams = Game & {
  home_team: Team;
  away_team: Team;
};
