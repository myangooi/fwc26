<template>
  <div class="bg-gray-900 rounded-lg p-4">
    <h3 class="text-lg font-bold mb-3 text-green-400">Qualified Teams</h3>
    <p class="text-xs text-gray-500 mb-3">1st and 2nd from every group + 8 best 3rd-place teams</p>
    <div class="overflow-x-auto">
      <table class="w-full text-sm text-left">
        <thead class="text-xs text-gray-400 uppercase border-b border-gray-700">
          <tr>
            <th class="py-2 pr-4">Group</th>
            <th class="py-2 pr-4">1st</th>
            <th class="py-2 pr-4">2nd</th>
            <th class="py-2 pr-4">3rd</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.groupName"
            class="border-b border-gray-800"
          >
            <td class="py-2 pr-4 text-gray-400 font-semibold">{{ row.groupName }}</td>
            <td class="py-2 pr-4">
              <TeamBadge v-if="row.first" :team="row.first" />
            </td>
            <td class="py-2 pr-4">
              <TeamBadge v-if="row.second" :team="row.second" />
            </td>
            <td class="py-2 pr-4">
              <TeamBadge v-if="row.third" :team="row.third" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Group } from '../../types';
import { useSimulation } from '../../composables/useSimulation';
import { computeGroupStandings, getBestThirdPlace } from '../../composables/useStandings';
import { fifaRankings } from '../../data/fifaRankings';
import TeamBadge from '../ui/TeamBadge.vue';

const props = defineProps<{ groups: Group[] }>();
const { state } = useSimulation();

const rows = computed(() => {
  const qualifiedThirdIds = new Set(
    getBestThirdPlace(props.groups, state.groupScores, fifaRankings, state.tcsScores)
      .filter(t => t.qualifies)
      .map(t => t.team.id)
  );

  return props.groups.map(group => {
    const standings = computeGroupStandings(group, state.groupScores, fifaRankings, state.tcsScores);
    const toSlot = (entry: typeof standings[0] | undefined) => {
      if (!entry) return null;
      const t = group.teams.find(t => t.id === entry.team.id);
      return t ?? entry.team;
    };
    return {
      groupName: group.name.replace('Group ', ''),
      first: toSlot(standings[0]),
      second: toSlot(standings[1]),
      third: standings[2] && qualifiedThirdIds.has(standings[2].team.id) ? toSlot(standings[2]) : null,
    };
  });
});
</script>
