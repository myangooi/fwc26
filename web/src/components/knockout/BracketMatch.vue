<template>
  <div class="bg-gray-900 rounded border border-gray-700 text-sm w-full">
    <!-- Finished match: show score, non-interactive -->
    <template v-if="match.status === 'FINISHED'">
      <div
        :class="[
          'w-full flex items-center justify-between px-2 py-1 border-b border-gray-700',
          isWinner(match.homeTeam?.id)
            ? 'text-green-400 font-bold'
            : 'text-gray-400',
        ]"
      >
        <TeamBadge v-if="match.homeTeam" :team="match.homeTeam" />
        <span v-else class="text-gray-600">TBD</span>
        <span class="ml-2 tabular-nums">{{ match.score?.home ?? "" }}</span>
      </div>
      <div
        :class="[
          'w-full flex items-center justify-between px-2 py-1',
          isWinner(match.awayTeam?.id)
            ? 'text-green-400 font-bold'
            : 'text-gray-400',
        ]"
      >
        <TeamBadge v-if="match.awayTeam" :team="match.awayTeam" />
        <span v-else class="text-gray-600">TBD</span>
        <span class="ml-2 tabular-nums">{{ match.score?.away ?? "" }}</span>
      </div>
    </template>

    <!-- Simulatable match: click to pick winner -->
    <template v-else>
      <button
        :class="[
          'w-full text-left px-2 py-1 border-b border-gray-700 hover:bg-gray-800 transition-colors',
          isWinner(match.homeTeam?.id)
            ? 'text-green-400 font-bold'
            : 'text-gray-300',
        ]"
        :disabled="!match.homeTeam || !match.awayTeam"
        @click="toggleWinner(match.homeTeam?.id)"
      >
        <TeamBadge v-if="match.homeTeam" :team="match.homeTeam" />
        <span v-else>TBD</span>
      </button>
      <button
        :class="[
          'w-full text-left px-2 py-1 hover:bg-gray-800 transition-colors',
          isWinner(match.awayTeam?.id)
            ? 'text-green-400 font-bold'
            : 'text-gray-300',
        ]"
        :disabled="!match.homeTeam || !match.awayTeam"
        @click="toggleWinner(match.awayTeam?.id)"
      >
        <TeamBadge v-if="match.awayTeam" :team="match.awayTeam" />
        <span v-else>TBD</span>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { KnockoutMatch } from "../../types";
import { useSimulation } from "../../composables/useSimulation";
import TeamBadge from "../ui/TeamBadge.vue";

const props = defineProps<{
  match: KnockoutMatch;
  simulatedWinnerId?: number;
}>();

const emit = defineEmits<{
  (e: "winner-change", matchId: number, teamId: number | null): void;
}>();
const { state, setKnockoutWinner } = useSimulation();

function isWinner(teamId: number | undefined): boolean {
  if (!teamId) return false;
  return (
    props.simulatedWinnerId === teamId ||
    (!props.simulatedWinnerId && props.match.winner?.id === teamId)
  );
}

function toggleWinner(teamId: number | undefined): void {
  if (!teamId) return;
  setKnockoutWinner(props.match.id, teamId);
  const newWinner = state.knockoutWinners[props.match.id] ?? null;
  emit("winner-change", props.match.id, newWinner);
}
</script>
