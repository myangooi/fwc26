<template>
  <div class="bg-gray-900 rounded-lg p-4">
    <h3 class="text-lg font-bold mb-3 text-green-400">Best Third-Place Teams</h3>
    <p class="text-xs text-gray-500 mb-3">Top 8 of 12 advance to Round of 32</p>
    <div class="overflow-x-auto">
      <table class="w-full text-sm text-left">
        <thead class="text-xs text-gray-400 uppercase border-b border-gray-700">
          <tr>
            <th class="py-2 pr-2 w-6">#</th>
            <th class="py-2 pr-2 w-6"></th>
            <th class="py-2 pr-4">Team</th>
            <th class="py-2 px-2 text-center">P</th>
            <th class="py-2 px-2 text-center">GD</th>
            <th class="py-2 px-2 text-center font-bold">Pts</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(entry, i) in thirds"
            :key="entry.team.id"
            :class="['border-b border-gray-800', entry.qualifies ? 'text-white' : 'text-gray-500']"
          >
            <td class="py-2 pr-2">{{ i + 1 }}</td>
            <td class="py-2 pr-2 text-gray-500 font-medium">{{ entry.groupName.replace('Group ', '') }}</td>
            <td class="py-2 pr-4 font-medium">
              <span class="flex items-center gap-1">
                <TeamBadge :team="entry.team" />
                <button
                  v-if="tiedIds.has(entry.team.id)"
                  @click="dialogTeam = entry.team"
                  class="ml-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 text-xs font-semibold leading-none"
                >Tie<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-2.5 h-2.5"><path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.854 2.477a.75.75 0 0 0 .96.96l2.477-.854a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.475ZM3.75 10.5a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Z"/></svg></button>
              </span>
            </td>
            <td class="py-2 px-2 text-center">{{ entry.played }}</td>
            <td class="py-2 px-2 text-center">{{ entry.gd > 0 ? '+' : '' }}{{ entry.gd }}</td>
            <td class="py-2 px-2 text-center font-bold">{{ entry.points }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <TiebreakDialog :team="dialogTeam" @close="dialogTeam = null" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Group } from '../../types';
import { useSimulation } from '../../composables/useSimulation';
import { getBestThirdPlace, findThirdPlaceTiedIds } from '../../composables/useStandings';
import { fifaRankings } from '../../data/fifaRankings';
import TeamBadge from '../ui/TeamBadge.vue';
import TiebreakDialog from './TiebreakDialog.vue';

const props = defineProps<{ groups: Group[] }>();
const { state } = useSimulation();

const thirds = computed(() =>
  getBestThirdPlace(props.groups, state.groupScores, fifaRankings, state.tcsScores)
);

const tiedIds = computed(() =>
  findThirdPlaceTiedIds(props.groups, state.groupScores, fifaRankings, state.tcsScores)
);

const dialogTeam = ref<{ id: number; name: string; tla?: string; crest?: string } | null>(null);
</script>
