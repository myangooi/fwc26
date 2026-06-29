import type {
  GroupsBlob,
  KnockoutBlob,
  Group,
  KnockoutRound,
  Fixture,
  Booking,
  FDMatch,
  FDStandingGroup,
} from "./types";

const KNOCKOUT_STAGE_ORDER = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "FINAL",
] as const;

const ROUND_NAMES: Record<string, string> = {
  ROUND_OF_32: "Round of 32",
  ROUND_OF_16: "Round of 16",
  QUARTER_FINALS: "Quarter-finals",
  SEMI_FINALS: "Semi-finals",
  FINAL: "Final",
};

function formatGroupName(group: string): string {
  // "GROUP_A" → "Group A"
  const parts = group.split("_");
  return parts
    .map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

function mapBooking(b: { team: { id: number }; card: string }): Booking {
  const type: Booking["type"] =
    b.card === "YELLOW_RED_CARD"
      ? "YELLOW_RED_CARD"
      : b.card === "RED_CARD"
        ? "RED_CARD"
        : "YELLOW_CARD";
  return { teamId: b.team.id, type };
}

function mapFixture(match: FDMatch): Fixture {
  const { home, away } = match.score.fullTime;
  return {
    id: match.id,
    date: match.utcDate,
    homeTeam: { id: match.homeTeam!.id, name: match.homeTeam!.name, tla: match.homeTeam!.tla, crest: match.homeTeam!.crest },
    awayTeam: { id: match.awayTeam!.id, name: match.awayTeam!.name, tla: match.awayTeam!.tla, crest: match.awayTeam!.crest },
    score: home !== null && away !== null ? { home, away } : null,
    status: match.status as Fixture["status"],
    bookings: (match.bookings ?? []).map(mapBooking),
  };
}

export function transformToGroupsBlob(
  matches: FDMatch[],
  standings: FDStandingGroup[],
): GroupsBlob {
  const groupMatches = matches.filter(
    (m) => m.stage === "GROUP_STAGE" && m.group,
  );
  const groupStandings = standings.filter(
    (s) => s.stage === "GROUP_STAGE" && s.type === "TOTAL",
  );

  const groupKeys = [...new Set(groupMatches.map((m) => m.group!))].sort();

  const groups: Group[] = groupKeys.map((key) => {
    const gMatches = groupMatches.filter((m) => m.group === key);
    const gStanding = groupStandings.find((s) => s.group === key);

    const teamMap = new Map<
      number,
      { id: number; name: string; tla?: string; crest: string }
    >();
    for (const m of gMatches) {
      if (m.homeTeam) teamMap.set(m.homeTeam.id, m.homeTeam);
      if (m.awayTeam) teamMap.set(m.awayTeam.id, m.awayTeam);
    }

    return {
      name: formatGroupName(key),
      teams: [...teamMap.values()],
      fixtures: gMatches.map(mapFixture),
      standings: (gStanding?.table ?? []).map((row) => ({
        team: { id: row.team.id, name: row.team.name, tla: row.team.tla, crest: row.team.crest },
        played: row.playedGames,
        won: row.won,
        drawn: row.draw,
        lost: row.lost,
        gf: row.goalsFor,
        ga: row.goalsAgainst,
        gd: row.goalDifference,
        points: row.points,
      })),
    };
  });

  return { lastUpdated: new Date().toISOString(), groups };
}

export function transformToKnockoutBlob(matches: FDMatch[]): KnockoutBlob {
  const rounds: KnockoutRound[] = KNOCKOUT_STAGE_ORDER.map((stage) => ({
    name: ROUND_NAMES[stage],
    matches: matches
      .filter((m) => m.stage === stage)
      .map((m) => ({
        id: m.id,
        homeTeam: m.homeTeam
          ? { id: m.homeTeam.id, name: m.homeTeam.name, tla: m.homeTeam.tla, crest: m.homeTeam.crest }
          : null,
        awayTeam: m.awayTeam
          ? { id: m.awayTeam.id, name: m.awayTeam.name, tla: m.awayTeam.tla, crest: m.awayTeam.crest }
          : null,
        winner:
          m.score.winner === "HOME_TEAM" && m.homeTeam
            ? { id: m.homeTeam.id, name: m.homeTeam.name, tla: m.homeTeam.tla, crest: m.homeTeam.crest }
            : m.score.winner === "AWAY_TEAM" && m.awayTeam
              ? { id: m.awayTeam.id, name: m.awayTeam.name, tla: m.awayTeam.tla, crest: m.awayTeam.crest }
              : null,
        score: m.score.fullTime.home !== null && m.score.fullTime.away !== null
          ? { home: m.score.fullTime.home, away: m.score.fullTime.away }
          : undefined,
        status: m.status,
      })),
  }));

  return { lastUpdated: new Date().toISOString(), rounds };
}
