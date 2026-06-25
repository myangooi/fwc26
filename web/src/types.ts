export interface Team {
  id: number;
  name: string;
  tla?: string;
  crest: string;
}

export interface Booking {
  teamId: number;
  type: 'YELLOW_CARD' | 'YELLOW_RED_CARD' | 'RED_CARD';
}

export type FixtureStatus =
  | 'SCHEDULED'
  | 'TIMED'
  | 'IN_PLAY'
  | 'PAUSED'
  | 'FINISHED'
  | 'POSTPONED'
  | 'CANCELLED';

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
  score?: { home: number; away: number };
  status?: 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED';
}

export interface KnockoutRound {
  name: string;
  matches: KnockoutMatch[];
}

export interface KnockoutBlob {
  lastUpdated: string;
  rounds: KnockoutRound[];
}
