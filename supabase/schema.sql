-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leagues table
CREATE TABLE public.leagues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sport TEXT NOT NULL DEFAULT 'hockey',
  settings JSONB DEFAULT '{"points_win": 2, "points_loss": 0, "points_tie": 1, "ties_allowed": true}'::jsonb,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE public.teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT,
  captain_id UUID REFERENCES public.profiles(id),
  logo_url TEXT,
  color TEXT DEFAULT '#22c55e',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint on team names within a league
ALTER TABLE public.teams ADD CONSTRAINT teams_league_name_unique UNIQUE (league_id, name);

-- Games table (schedule + results)
CREATE TABLE public.games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
  home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  location TEXT,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'postponed', 'cancelled')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint to prevent a team from playing itself
ALTER TABLE public.games ADD CONSTRAINT games_different_teams_check
  CHECK (home_team_id != away_team_id);

-- Create indexes for performance
CREATE INDEX idx_leagues_owner ON public.leagues(owner_id);
CREATE INDEX idx_teams_league ON public.teams(league_id);
CREATE INDEX idx_games_league ON public.games(league_id);
CREATE INDEX idx_games_date ON public.games(scheduled_date);
CREATE INDEX idx_games_teams ON public.games(home_team_id, away_team_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can read all, update own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Leagues: Public read, owner write
CREATE POLICY "Leagues are viewable by everyone" ON public.leagues
  FOR SELECT USING (true);

CREATE POLICY "Users can create leagues" ON public.leagues
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their leagues" ON public.leagues
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their leagues" ON public.leagues
  FOR DELETE USING (auth.uid() = owner_id);

-- Teams: Public read, league owner write
CREATE POLICY "Teams are viewable by everyone" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "League owners can manage teams" ON public.teams
  FOR ALL USING (
    auth.uid() IN (
      SELECT owner_id FROM public.leagues WHERE id = league_id
    )
  );

-- Games: Public read, league owner write
CREATE POLICY "Games are viewable by everyone" ON public.games
  FOR SELECT USING (true);

CREATE POLICY "League owners can manage games" ON public.games
  FOR ALL USING (
    auth.uid() IN (
      SELECT owner_id FROM public.leagues WHERE id = league_id
    )
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.leagues
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
