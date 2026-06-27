import type { Group, KnockoutRound, KnockoutMatch } from '../types';
import { computeGroupStandings, getBestThirdPlace } from './useStandings';
import { ANNEX_C } from '../data/annexC';
import { fifaRankings } from '../data/fifaRankings';

// winner of matchId goes to nextMatchId as home or away team
const BRACKET_PROGRESSION: Record<number, { match: number; pos: 'home' | 'away' }> = {
  // R32 → R16
  73: { match: 89, pos: 'home' }, 75: { match: 89, pos: 'away' },
  74: { match: 90, pos: 'home' }, 77: { match: 90, pos: 'away' },
  76: { match: 91, pos: 'home' }, 78: { match: 91, pos: 'away' },
  79: { match: 92, pos: 'home' }, 80: { match: 92, pos: 'away' },
  83: { match: 93, pos: 'home' }, 84: { match: 93, pos: 'away' },
  81: { match: 94, pos: 'home' }, 82: { match: 94, pos: 'away' },
  86: { match: 95, pos: 'home' }, 88: { match: 95, pos: 'away' },
  85: { match: 96, pos: 'home' }, 87: { match: 96, pos: 'away' },
  // R16 → QF
  89: { match: 97, pos: 'home' },  90: { match: 97, pos: 'away' },
  93: { match: 98, pos: 'home' },  94: { match: 98, pos: 'away' },
  91: { match: 99, pos: 'home' },  92: { match: 99, pos: 'away' },
  95: { match: 100, pos: 'home' }, 96: { match: 100, pos: 'away' },
  // QF → SF
  97:  { match: 101, pos: 'home' }, 98:  { match: 101, pos: 'away' },
  99:  { match: 102, pos: 'home' }, 100: { match: 102, pos: 'away' },
  // SF → Final
  101: { match: 103, pos: 'home' }, 102: { match: 103, pos: 'away' },
};

// loser of matchId goes to nextMatchId as home or away team
const LOSER_PROGRESSION: Record<number, { match: number; pos: 'home' | 'away' }> = {
  101: { match: 104, pos: 'home' },
  102: { match: 104, pos: 'away' },
};

// Match order within each round — pairs that feed the same next-round match are adjacent.
// First half = left bracket (→ SF 101), second half = right bracket (→ SF 102).
const ROUND_MATCH_IDS: { name: string; ids: number[] }[] = [
  { name: 'Round of 32',    ids: [73,75, 74,77, 83,84, 81,82,  76,78, 79,80, 86,88, 85,87] },
  { name: 'Round of 16',    ids: [89,90, 93,94,  91,92, 95,96] },
  { name: 'Quarter-finals', ids: [97,98,  99,100] },
  { name: 'Semi-finals',    ids: [101, 102] },
  { name: 'Final',          ids: [103] },
  { name: 'Third Place',    ids: [104] },
];

type TeamSlot = KnockoutMatch['homeTeam'];

function groupLetter(groupName: string): string {
  return groupName.split(' ').pop()!;
}

function teamSlot(groups: Group[], teamId: number, fallback: { id: number; name: string; tla?: string; crest?: string }): TeamSlot {
  for (const g of groups) {
    const t = g.teams.find(t => t.id === teamId);
    if (t) return { id: t.id, name: t.name, tla: t.tla, crest: t.crest };
  }
  return fallback;
}

export function buildR32Round(
  groups: Group[],
  simulatedScores: Record<number, { home: number | null; away: number | null }>,
): KnockoutRound {
  // standings per group letter
  const standings: Record<string, ReturnType<typeof computeGroupStandings>> = {};
  for (const g of groups) {
    standings[groupLetter(g.name)] = computeGroupStandings(g, simulatedScores, fifaRankings);
  }

  function qualifier(letter: string, pos: 0 | 1): TeamSlot {
    const s = standings[letter];
    if (!s?.[pos]) return null;
    const e = s[pos];
    return teamSlot(groups, e.team.id, e.team);
  }

  // 8 best third-place teams
  const thirds = getBestThirdPlace(groups, simulatedScores, fifaRankings).filter(t => t.qualifies);
  const qualifyingGroups = thirds.map(t => groupLetter(t.groupName)).sort();
  const combo = ANNEX_C[qualifyingGroups.join(',')];

  const thirdMap: Record<string, TeamSlot> = {};
  for (const t of thirds) {
    const letter = groupLetter(t.groupName);
    thirdMap[letter] = teamSlot(groups, t.team.id, t.team);
  }

  function third(letter: string): TeamSlot {
    return thirdMap[letter] ?? null;
  }

  const matches: KnockoutMatch[] = [
    { id: 73, homeTeam: qualifier('A', 1), awayTeam: qualifier('B', 1), winner: null },
    { id: 74, homeTeam: qualifier('E', 0), awayTeam: combo ? third(combo.m74) : null, winner: null },
    { id: 75, homeTeam: qualifier('F', 0), awayTeam: qualifier('C', 1), winner: null },
    { id: 76, homeTeam: qualifier('C', 0), awayTeam: qualifier('F', 1), winner: null },
    { id: 77, homeTeam: qualifier('I', 0), awayTeam: combo ? third(combo.m77) : null, winner: null },
    { id: 78, homeTeam: qualifier('E', 1), awayTeam: qualifier('I', 1), winner: null },
    { id: 79, homeTeam: qualifier('A', 0), awayTeam: combo ? third(combo.m79) : null, winner: null },
    { id: 80, homeTeam: qualifier('L', 0), awayTeam: combo ? third(combo.m80) : null, winner: null },
    { id: 81, homeTeam: qualifier('D', 0), awayTeam: combo ? third(combo.m81) : null, winner: null },
    { id: 82, homeTeam: qualifier('G', 0), awayTeam: combo ? third(combo.m82) : null, winner: null },
    { id: 83, homeTeam: qualifier('K', 1), awayTeam: qualifier('L', 1), winner: null },
    { id: 84, homeTeam: qualifier('H', 0), awayTeam: qualifier('J', 1), winner: null },
    { id: 85, homeTeam: qualifier('B', 0), awayTeam: combo ? third(combo.m85) : null, winner: null },
    { id: 86, homeTeam: qualifier('J', 0), awayTeam: qualifier('H', 1), winner: null },
    { id: 87, homeTeam: qualifier('K', 0), awayTeam: combo ? third(combo.m87) : null, winner: null },
    { id: 88, homeTeam: qualifier('D', 1), awayTeam: qualifier('G', 1), winner: null },
  ];

  return { name: 'Round of 32', matches };
}

// Mock results for finished knockout matches — keyed by match ID
const MOCK_RESULTS: Record<number, { home: number; away: number }> = {};

export function buildAllKnockoutRounds(
  groups: Group[],
  simulatedScores: Record<number, { home: number | null; away: number | null }>,
  knockoutWinners: Record<number, number>,
): KnockoutRound[] {
  const r32 = buildR32Round(groups, simulatedScores);

  // Flat match registry — insertion order matches ROUND_MATCH_IDS ordering
  const matchMap = new Map<number, KnockoutMatch>();
  for (const m of r32.matches) matchMap.set(m.id, { ...m });
  for (const round of ROUND_MATCH_IDS.slice(1)) {
    for (const id of round.ids) {
      matchMap.set(id, { id, homeTeam: null, awayTeam: null, winner: null });
    }
  }

  // Apply mock results — sets score, status, and winner field
  for (const [matchId, match] of matchMap) {
    const mock = MOCK_RESULTS[matchId];
    if (!mock) continue;
    match.score = mock;
    match.status = 'FINISHED';
    match.winner =
      mock.home > mock.away ? match.homeTeam :
      mock.away > mock.home ? match.awayTeam :
      null;
  }

  // Propagate winners forward — finished matches auto-advance, simulated matches use knockoutWinners
  for (const [matchId, match] of matchMap) {
    const prog = BRACKET_PROGRESSION[matchId];
    if (!prog) continue;
    const winnerTeam =
      match.winner ??
      (knockoutWinners[matchId] === match.homeTeam?.id ? match.homeTeam :
       knockoutWinners[matchId] === match.awayTeam?.id ? match.awayTeam :
       null);
    if (!winnerTeam) continue;
    const next = matchMap.get(prog.match);
    if (!next) continue;
    if (prog.pos === 'home') next.homeTeam = winnerTeam;
    else next.awayTeam = winnerTeam;
  }

  // Propagate losers of semi-finals to third place match
  for (const [matchId, match] of matchMap) {
    const prog = LOSER_PROGRESSION[matchId];
    if (!prog) continue;
    const winnerId = match.winner?.id ?? knockoutWinners[matchId];
    if (winnerId == null) continue;
    const loserTeam =
      winnerId === match.homeTeam?.id ? match.awayTeam :
      winnerId === match.awayTeam?.id ? match.homeTeam :
      null;
    if (!loserTeam) continue;
    const next = matchMap.get(prog.match);
    if (!next) continue;
    if (prog.pos === 'home') next.homeTeam = loserTeam;
    else next.awayTeam = loserTeam;
  }

  // Assemble rounds in bracket order
  return ROUND_MATCH_IDS.map(({ name, ids }) => ({
    name,
    matches: ids.map(id => matchMap.get(id)!),
  }));
}
