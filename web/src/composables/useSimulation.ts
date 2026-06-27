import { reactive } from 'vue';
import type { Group } from '../types';

interface SimulationState {
  groupScores: Record<number, { home: number | null; away: number | null }>;
  knockoutWinners: Record<number, number>;
  tcsScores: Record<number, number>;
  cutoffDate: string | null;
}

// Module-level singleton — all components share the same reactive state
const state = reactive<SimulationState>({
  groupScores: {},
  knockoutWinners: {},
  tcsScores: {},
  cutoffDate: null,
});

export function applyDateCutoff(groups: Group[], cutoffDate: string | null): Group[] {
  if (!cutoffDate) return groups;
  return groups.map(group => ({
    ...group,
    fixtures: group.fixtures.map(f => {
      if (f.status === 'FINISHED' && f.date.slice(0, 10) > cutoffDate) {
        return { ...f, status: 'SCHEDULED' as const, score: null };
      }
      return f;
    }),
  }));
}

export function useSimulation() {
  function setGroupScore(fixtureId: number, home: number | null, away: number | null): void {
    state.groupScores[fixtureId] = { home, away };
  }

  function clearGroupScore(fixtureId: number): void {
    delete state.groupScores[fixtureId];
  }

  function setKnockoutWinner(matchId: number, teamId: number): void {
    if (state.knockoutWinners[matchId] === teamId) {
      delete state.knockoutWinners[matchId];
    } else {
      state.knockoutWinners[matchId] = teamId;
    }
  }

  function setTCS(teamId: number, score: number): void {
    state.tcsScores[teamId] = score;
  }

  function clearTCS(teamId: number): void {
    delete state.tcsScores[teamId];
  }

  function setCutoffDate(date: string | null): void {
    state.cutoffDate = date;
  }

  function reset(): void {
    state.groupScores = {};
    state.knockoutWinners = {};
    state.tcsScores = {};
    // cutoffDate intentionally not cleared
  }

  return {
    state,
    setGroupScore,
    clearGroupScore,
    setKnockoutWinner,
    setTCS,
    clearTCS,
    setCutoffDate,
    reset,
  };
}
