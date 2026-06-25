<template>
  <Teleport to="body">
    <div
      v-if="team"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      @click.self="$emit('close')"
    >
      <div class="bg-gray-800 rounded-lg p-6 w-80 shadow-xl">
        <h3 class="text-white font-bold text-base mb-4 flex items-center gap-2">
          <span class="w-6 h-4 flex-shrink-0 flex items-center justify-center">
            <img
              v-if="team.crest"
              :src="team.crest"
              :alt="team.tla ?? team.name"
              class="w-full h-full object-contain"
            />
          </span>
          {{ team.tla ?? team.name }}
        </h3>
        <div class="space-y-3">
          <div>
            <div class="text-xs text-gray-400 uppercase tracking-wide mb-1">FIFA Ranking</div>
            <div class="bg-gray-700 text-gray-300 rounded px-3 py-2 text-sm">
              {{ fifaRankings[team.id] ? `#${fifaRankings[team.id]}` : 'N/A' }}
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Team Conduct Score (TCS)</div>
            <input
              type="number"
              :value="currentTCS"
              @input="onInput"
              class="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter TCS (higher = better)..."
            />
            <p class="text-xs text-gray-500 mt-1">Higher score = better conduct. Used as tiebreaker before FIFA ranking.</p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="mt-4 w-full bg-gray-600 hover:bg-gray-500 text-white rounded px-4 py-2 text-sm transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSimulation } from '../../composables/useSimulation';
import { fifaRankings } from '../../data/fifaRankings';

const props = defineProps<{
  team: { id: number; name: string; tla?: string; crest?: string } | null;
}>();

defineEmits<{ close: [] }>();

const { state, setTCS, clearTCS } = useSimulation();

const currentTCS = computed(() => state.tcsScores[props.team?.id ?? -1] ?? '');

function onInput(e: Event) {
  if (!props.team) return;
  const val = (e.target as HTMLInputElement).value;
  if (val === '' || val === null) {
    clearTCS(props.team.id);
  } else {
    setTCS(props.team.id, Number(val));
  }
}
</script>
