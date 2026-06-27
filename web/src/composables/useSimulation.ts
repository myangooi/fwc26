import { reactive } from 'vue';

interface SimulationState {
  groupScores: Record<number, { home: number | null; away: number | null }>;
  knockoutWinners: Record<number, number>;
  tcsScores: Record<number, number>;
}

// Module-level singleton — all components share the same reactive state
const state = reactive<SimulationState>({
  groupScores: {},
  knockoutWinners: {},
  tcsScores: {},
});

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

  function reset(): void {
    state.groupScores = {};
    state.knockoutWinners = {};
    state.tcsScores = {};
  }

  return { state, setGroupScore, clearGroupScore, setKnockoutWinner, setTCS, clearTCS, reset };
}
