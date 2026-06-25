<template>
  <div class="bg-gray-900 rounded-lg p-4 overflow-hidden">
    <h3 class="text-lg font-bold mb-3 text-green-400">{{ group.name }}</h3>
    <GroupStanding
      :standings="effectiveStandings"
      :qualifying-positions="qualifyingPositions"
      :tied-ids="tiedIds"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Group } from '../../types';
import { useSimulation } from '../../composables/useSimulation';
import { computeGroupStandings, getBestThirdPlace, findGroupTiedIds } from '../../composables/useStandings';
import { fifaRankings } from '../../data/fifaRankings';
import GroupStanding from './GroupStanding.vue';

const props = defineProps<{ group: Group; allGroups: Group[] }>();
const { state } = useSimulation();

const effectiveStandings = computed(() =>
  computeGroupStandings(props.group, state.groupScores, fifaRankings, state.tcsScores)
);

const qualifyingPositions = computed(() => {
  const qualifiedThirdIds = new Set(
    getBestThirdPlace(props.allGroups, state.groupScores, fifaRankings, state.tcsScores)
      .filter(t => t.qualifies)
      .map(t => t.team.id)
  );
  const third = effectiveStandings.value[2];
  return third && qualifiedThirdIds.has(third.team.id) ? [0, 1, 2] : [0, 1];
});

const tiedIds = computed(() =>
  findGroupTiedIds(props.group, state.groupScores, fifaRankings, state.tcsScores)
);
</script>
