<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm text-left">
      <thead class="text-xs text-gray-400 uppercase border-b border-gray-700">
        <tr>
          <th class="py-2 pr-2 w-5">#</th>
          <th class="py-2 pr-2">Team</th>
          <th class="py-2 px-1 text-center">P</th>
          <th class="py-2 px-1 text-center">W</th>
          <th class="py-2 px-1 text-center">D</th>
          <th class="py-2 px-1 text-center">L</th>
          <th class="py-2 px-1 text-center">GD</th>
          <th class="py-2 px-1 text-center font-bold">Pts</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(entry, i) in standings"
          :key="entry.team.id"
          :class="[
            'border-b border-gray-800',
            qualifyingPositions.includes(i) ? 'text-white' : 'text-gray-400',
          ]"
        >
          <td class="py-2 pr-2">{{ i + 1 }}</td>
          <td class="py-2 pr-2 font-medium">
            <span class="flex items-center gap-1">
              <TeamBadge :team="entry.team" />
              <button
                v-if="tiedIds?.has(entry.team.id)"
                @click="dialogTeam = entry.team"
                class="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 text-xs font-semibold leading-none whitespace-nowrap"
              >Tie<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-2.5 h-2.5"><path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.854 2.477a.75.75 0 0 0 .96.96l2.477-.854a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.475ZM3.75 10.5a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Z"/></svg></button>
            </span>
          </td>
          <td class="py-2 px-1 text-center">{{ entry.played }}</td>
          <td class="py-2 px-1 text-center">{{ entry.won }}</td>
          <td class="py-2 px-1 text-center">{{ entry.drawn }}</td>
          <td class="py-2 px-1 text-center">{{ entry.lost }}</td>
          <td class="py-2 px-1 text-center">{{ entry.gd > 0 ? '+' : '' }}{{ entry.gd }}</td>
          <td class="py-2 px-1 text-center font-bold">{{ entry.points }}</td>
        </tr>
      </tbody>
    </table>
    <TiebreakDialog :team="dialogTeam" @close="dialogTeam = null" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { StandingEntry } from '../../types';
import TeamBadge from '../ui/TeamBadge.vue';
import TiebreakDialog from './TiebreakDialog.vue';

const props = defineProps<{
  standings: StandingEntry[];
  qualifyingPositions?: number[];
  tiedIds?: Set<number>;
}>();

const qualifyingPositions = computed(() => props.qualifyingPositions ?? [0, 1]);
const dialogTeam = ref<{ id: number; name: string; tla?: string; crest?: string } | null>(null);
</script>
