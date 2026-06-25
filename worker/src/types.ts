// KV blob types (shared contract with frontend)

export interface Team {
  id: number;
  name: string;
  tla?: string;
  crest: string;
}

export interface Booking {
  teamId: number;
  type: "YELLOW_CARD" | "YELLOW_RED_CARD" | "RED_CARD";
}

export type FixtureStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED";

export interface Fixture {
  id: number;
  date: string;
  homeTeam: { id: number; name: string; tla?: string; crest?: string };
  awayTeam: { id: number; name: string; tla?: string; crest?: string };
  score: { home: number; away: number } | null;
  status: FixtureStatus;
  bookings: Booking[];
}

export interface StandingEntry {
  team: { id: number; name: string; tla?: string; crest?: string };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export interface Group {
  name: string;
  teams: Team[];
  fixtures: Fixture[];
  standings: StandingEntry[];
}

export interface GroupsBlob {
  lastUpdated: string;
  groups: Group[];
}

export interface KnockoutMatch {
  id: number;
  homeTeam: { id: number; name: string; tla?: string; crest?: string } | null;
  awayTeam: { id: number; name: string; tla?: string; crest?: string } | null;
  winner: { id: number; name: string; tla?: string; crest?: string } | null;
}

export interface KnockoutRound {
  name: string;
  matches: KnockoutMatch[];
}

export interface KnockoutBlob {
  lastUpdated: string;
  rounds: KnockoutRound[];
}

export interface Env {
  WC2026_KV: KVNamespace;
  FOOTBALL_DATA_API_KEY: string;
  CORS_ORIGIN: string;
  CF_API_TOKEN?: string;
  CF_ZONE_ID?: string;
  CF_WORKER_URL?: string;
}

// football-data.org API response types

export interface FDTeamRef {
  id: number;
  name: string;
  tla?: string;
  crest: string;
}

export interface FDMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  homeTeam: FDTeamRef | null;
  awayTeam: FDTeamRef | null;
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
  };
  bookings: Array<{ team: { id: number }; card: string }>;
}

export interface FDStandingRow {
  team: FDTeamRef;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface FDStandingGroup {
  stage: string;
  type: string;
  group: string;
  table: FDStandingRow[];
}
