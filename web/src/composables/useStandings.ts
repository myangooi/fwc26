import type { Group, Fixture, StandingEntry } from '../types';

const FAIR_PLAY: Record<string, number> = {
  YELLOW_CARD: -1,
  YELLOW_RED_CARD: -3,
  RED_CARD: -4,
};

function fairPlayPoints(teamId: number, fixtures: Fixture[]): number {
  return fixtures.reduce((total, f) => {
    if (f.status !== 'FINISHED') return total;
    return total + f.bookings
      .filter(b => b.teamId === teamId)
      .reduce((sum, b) => sum + (FAIR_PLAY[b.type] ?? 0), 0);
  }, 0);
}

function fromFixtures(
  group: Group,
  simulatedScores: Record<number, { home: number; away: number }>
): Map<number, StandingEntry> {
  const map = new Map<number, StandingEntry>();
  for (const t of group.teams) {
    map.set(t.id, {
      team: { id: t.id, name: t.name, tla: t.tla, crest: t.crest },
      played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, points: 0,
    });
  }
  for (const f of group.fixtures) {
    const simAllowed = f.status === 'SCHEDULED' || f.status === 'TIMED';
    const score = simAllowed ? (simulatedScores[f.id] ?? f.score) : f.score;
    if (!score) continue;
    const home = map.get(f.homeTeam.id)!;
    const away = map.get(f.awayTeam.id)!;
    home.played++; away.played++;
    home.gf += score.home; home.ga += score.away;
    away.gf += score.away; away.ga += score.home;
    home.gd = home.gf - home.ga;
    away.gd = away.gf - away.ga;
    if (score.home > score.away) {
      home.won++; home.points += 3; away.lost++;
    } else if (score.away > score.home) {
      away.won++; away.points += 3; home.lost++;
    } else {
      home.drawn++; home.points++;
      away.drawn++; away.points++;
    }
  }
  return map;
}

function h2hStats(
  teams: StandingEntry[],
  fixtures: Fixture[],
  simulatedScores: Record<number, { home: number; away: number }>
): Map<number, { points: number; gd: number; gf: number }> {
  const ids = new Set(teams.map(t => t.team.id));
  const stats = new Map(teams.map(t => [t.team.id, { points: 0, gd: 0, gf: 0 }]));
  for (const f of fixtures) {
    if (!ids.has(f.homeTeam.id) || !ids.has(f.awayTeam.id)) continue;
    const simAllowed = f.status === 'SCHEDULED' || f.status === 'TIMED';
    const score = simAllowed ? (simulatedScores[f.id] ?? f.score) : f.score;
    if (!score) continue;
    const h = stats.get(f.homeTeam.id)!;
    const a = stats.get(f.awayTeam.id)!;
    h.gf += score.home; h.gd += score.home - score.away;
    a.gf += score.away; a.gd += score.away - score.home;
    if (score.home > score.away) h.points += 3;
    else if (score.away > score.home) a.points += 3;
    else { h.points++; a.points++; }
  }
  return stats;
}

function sortGroup(
  teams: StandingEntry[],
  fixtures: Fixture[],
  simulatedScores: Record<number, { home: number; away: number }>,
  fifaRankings: Record<number, number>,
  tcsScores: Record<number, number> = {}
): StandingEntry[] {
  if (teams.length <= 1) return teams;
  const h2h = h2hStats(teams, fixtures, simulatedScores);
  return [...teams].sort((a, b) => {
    const ah = h2h.get(a.team.id)!;
    const bh = h2h.get(b.team.id)!;
    if (bh.points !== ah.points) return bh.points - ah.points;
    if (bh.gd !== ah.gd) return bh.gd - ah.gd;
    if (bh.gf !== ah.gf) return bh.gf - ah.gf;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    const afp = fairPlayPoints(a.team.id, fixtures);
    const bfp = fairPlayPoints(b.team.id, fixtures);
    if (afp !== bfp) return bfp - afp;
    const atcs = tcsScores[a.team.id] ?? 0;
    const btcs = tcsScores[b.team.id] ?? 0;
    if (atcs !== btcs) return btcs - atcs; // higher TCS = better conduct = ranked first
    const ar = fifaRankings[a.team.id] ?? 999;
    const br = fifaRankings[b.team.id] ?? 999;
    return ar - br;
  });
}

export function computeGroupStandings(
  group: Group,
  simulatedScores: Record<number, { home: number; away: number }>,
  fifaRankings: Record<number, number>,
  tcsScores: Record<number, number> = {}
): StandingEntry[] {
  const statsMap = fromFixtures(group, simulatedScores);
  const all = [...statsMap.values()];

  // Sort by points first, then break ties within equal-points groups
  all.sort((a, b) => b.points - a.points);

  const result: StandingEntry[] = [];
  let i = 0;
  while (i < all.length) {
    const pts = all[i].points;
    let j = i;
    while (j < all.length && all[j].points === pts) j++;
    const tied = all.slice(i, j);
    result.push(
      ...sortGroup(tied, group.fixtures, simulatedScores, fifaRankings, tcsScores)
    );
    i = j;
  }
  return result;
}

export interface ThirdPlaceEntry extends StandingEntry {
  groupName: string;
  qualifies: boolean;
  fairPlay: number;
}

export function getBestThirdPlace(
  allGroups: Group[],
  simulatedScores: Record<number, { home: number; away: number }>,
  fifaRankings: Record<number, number>,
  tcsScores: Record<number, number> = {}
): ThirdPlaceEntry[] {
  const thirds = allGroups.map(group => {
    const standings = computeGroupStandings(group, simulatedScores, fifaRankings, tcsScores);
    const third = standings[2] ?? standings[standings.length - 1];
    const fp = fairPlayPoints(third.team.id, group.fixtures);
    return { ...third, groupName: group.name, qualifies: false, fairPlay: fp };
  });

  // H2H is not applicable cross-group — use overall criteria including fair play
  thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    if (b.fairPlay !== a.fairPlay) return b.fairPlay - a.fairPlay;
    const atcs = tcsScores[a.team.id] ?? 0;
    const btcs = tcsScores[b.team.id] ?? 0;
    if (atcs !== btcs) return btcs - atcs;
    const ar = fifaRankings[a.team.id] ?? 999;
    const br = fifaRankings[b.team.id] ?? 999;
    return ar - br;
  });

  return thirds.map((t, i) => ({ ...t, qualifies: i < 8 }));
}

// Returns team IDs that are tied with at least one other team in the same group
// at the point where TCS becomes the deciding factor (after fair play, before FIFA rank).
export function findGroupTiedIds(
  group: Group,
  simulatedScores: Record<number, { home: number; away: number }>,
  fifaRankings: Record<number, number>,
  tcsScores: Record<number, number> = {}
): Set<number> {
  const standings = computeGroupStandings(group, simulatedScores, fifaRankings, tcsScores);
  const tiedIds = new Set<number>();
  for (let i = 0; i + 1 < standings.length; i++) {
    const a = standings[i];
    const b = standings[i + 1];
    if (a.points !== b.points) continue;
    const h2h = h2hStats([a, b], group.fixtures, simulatedScores);
    const ha = h2h.get(a.team.id)!;
    const hb = h2h.get(b.team.id)!;
    if (ha.points !== hb.points || ha.gd !== hb.gd || ha.gf !== hb.gf) continue;
    if (a.gd !== b.gd || a.gf !== b.gf) continue;
    const afp = fairPlayPoints(a.team.id, group.fixtures);
    const bfp = fairPlayPoints(b.team.id, group.fixtures);
    if (afp !== bfp) continue;
    tiedIds.add(a.team.id);
    tiedIds.add(b.team.id);
  }
  return tiedIds;
}

// Returns team IDs among 3rd-place teams that are tied before TCS becomes deciding.
export function findThirdPlaceTiedIds(
  allGroups: Group[],
  simulatedScores: Record<number, { home: number; away: number }>,
  fifaRankings: Record<number, number>,
  tcsScores: Record<number, number> = {}
): Set<number> {
  const thirds = getBestThirdPlace(allGroups, simulatedScores, fifaRankings, tcsScores);
  const tiedIds = new Set<number>();
  for (let i = 0; i + 1 < thirds.length; i++) {
    const a = thirds[i];
    const b = thirds[i + 1];
    if (a.points !== b.points || a.gd !== b.gd || a.gf !== b.gf) continue;
    if (a.fairPlay !== b.fairPlay) continue;
    tiedIds.add(a.team.id);
    tiedIds.add(b.team.id);
  }
  return tiedIds;
}
