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
    badminton: ["Shuttlers", "Smashers", "Rackets", "Aces", "Rally", "Court", "Net", "Birdie", "Drive", "Clear", "Drop", "Flight"],
    tennis: ["Aces", "Rackets", "Volleys", "Smashers", "Baseline", "Court", "Grand Slam", "Match Point", "Deuce", "Advantage", "Love", "Set"],
    pickleball: ["Picklers", "Dinkers", "Paddlers", "Kitchen", "Rally", "Smash", "Volley", "Drop Shot", "Aces", "Third Shot", "Court", "Net"],
    baseball: ["Sluggers", "Batters", "Diamonds", "Homers", "Innings", "All Stars", "Aces", "Sliders", "Curves", "Strikes", "Bases", "Grand Slam"],
    other: ["Team Alpha", "Team Beta", "Team Gamma", "Team Delta", "Team Epsilon", "Team Zeta", "Team Eta", "Team Theta", "Team Iota", "Team Kappa", "Team Lambda", "Team Mu"],
  };

  const names = sportNames[sport] || sportNames.other;
  return names.slice(0, count);
}
