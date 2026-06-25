<template>
  <div class="fixed inset-0 z-50 w-full sm:relative sm:inset-auto sm:z-auto sm:w-80 sm:flex-shrink-0 bg-gray-900 border-l border-gray-700 flex flex-col">
    <!-- header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
      <span class="font-semibold text-white">Simulate</span>
      <div class="flex items-center gap-3">
        <button
          v-if="hasSimulation"
          @click="reset"
          class="text-xs text-gray-400 hover:text-white underline transition-colors"
        >Reset</button>
        <button v-if="!permanent" @click="$emit('close')" class="text-gray-400 hover:text-white text-lg leading-none">✕</button>
      </div>
    </div>

    <!-- tabs -->
    <div class="flex border-b border-gray-700 flex-shrink-0">
      <button
        v-for="tab in (['Fixtures', 'Results'] as const)"
        :key="tab"
        @click="activeTab = tab"
        :class="[
          'flex-1 py-2 text-sm font-medium transition-colors',
          activeTab === tab
            ? 'text-white border-b-2 border-green-400'
            : 'text-gray-400 hover:text-gray-200',
        ]"
      >{{ tab }}</button>
    </div>

    <!-- content -->
    <div class="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

      <!-- FIXTURES TAB -->
      <template v-if="activeTab === 'Fixtures'">
        <div v-if="!upcomingByGroup.length" class="px-4 py-8 text-center text-gray-500 text-sm">
          No upcoming group stage fixtures.
        </div>
        <div v-for="{ groupName, fixtures } in upcomingByGroup" :key="groupName">
          <div class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-800/60 sticky top-0">
            {{ groupName }}
          </div>
          <div
            v-for="f in fixtures"
            :key="f.id"
            class="grid items-center px-3 py-2 border-b border-gray-800 text-sm"
            style="grid-template-columns: 1fr auto 1fr; column-gap: 0.75rem;"
          >
            <div class="flex items-center justify-end gap-1.5">
              <span class="text-white font-medium">{{ f.homeTeam.tla ?? f.homeTeam.name }}</span>
              <span class="w-5 h-4 flex-shrink-0 flex items-center justify-center">
                <img v-if="f.homeTeam.crest" :src="f.homeTeam.crest" class="w-full h-full object-contain" />
              </span>
            </div>
            <div class="flex items-center gap-1">
              <input
                type="number" min="0" max="99"
                :value="simScore(f.id)?.home ?? ''"
                @input="onInput(f.id, 'home', $event)"
                class="w-9 text-center bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
              />
              <span class="text-gray-500 text-xs">–</span>
              <input
                type="number" min="0" max="99"
                :value="simScore(f.id)?.away ?? ''"
                @input="onInput(f.id, 'away', $event)"
                class="w-9 text-center bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
              />
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-5 h-4 flex-shrink-0 flex items-center justify-center">
                <img v-if="f.awayTeam.crest" :src="f.awayTeam.crest" class="w-full h-full object-contain" />
              </span>
              <span class="text-white font-medium">{{ f.awayTeam.tla ?? f.awayTeam.name }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- RESULTS TAB -->
      <template v-else>
        <div v-if="!pastByGroup.length" class="px-4 py-8 text-center text-gray-500 text-sm">
          No group stage results yet.
        </div>
        <div v-for="{ groupName, fixtures } in pastByGroup" :key="groupName">
          <div class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-800/60 sticky top-0">
            {{ groupName }}
          </div>
          <div
            v-for="f in fixtures"
            :key="f.id"
            class="grid items-center px-3 py-2 border-b border-gray-800 text-sm"
            style="grid-template-columns: 1fr auto 1fr; column-gap: 0.75rem;"
          >
            <div class="flex items-center justify-end gap-1.5">
              <span class="font-medium" :class="winClass(f, 'home')">{{ f.homeTeam.tla ?? f.homeTeam.name }}</span>
              <span class="w-5 h-4 flex-shrink-0 flex items-center justify-center">
                <img v-if="f.homeTeam.crest" :src="f.homeTeam.crest" class="w-full h-full object-contain" />
              </span>
            </div>
            <span class="font-bold text-white px-1 text-center">{{ f.score!.home }} – {{ f.score!.away }}</span>
            <div class="flex items-center gap-1.5">
              <span class="w-5 h-4 flex-shrink-0 flex items-center justify-center">
                <img v-if="f.awayTeam.crest" :src="f.awayTeam.crest" class="w-full h-full object-contain" />
              </span>
              <span class="font-medium" :class="winClass(f, 'away')">{{ f.awayTeam.tla ?? f.awayTeam.name }}</span>
            </div>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Group, Fixture } from '../../types';
import { useSimulation } from '../../composables/useSimulation';

const props = defineProps<{ groups: Group[]; permanent?: boolean }>();
defineEmits<{ close: [] }>();

const { state, setGroupScore, clearGroupScore, reset } = useSimulation();

const activeTab = ref<'Fixtures' | 'Results'>('Fixtures');

const hasSimulation = computed(
  () => Object.keys(state.groupScores).length > 0 || Object.keys(state.knockoutWinners).length > 0
);

function collectByGroup(predicate: (f: Fixture) => boolean) {
  const result: { groupName: string; fixtures: Fixture[] }[] = [];
  for (const group of props.groups) {
    const matching = group.fixtures.filter(predicate);
    if (matching.length) result.push({ groupName: group.name, fixtures: matching });
  }
  return result;
}

const upcomingByGroup = computed(() =>
  collectByGroup(f => f.status === 'SCHEDULED' || f.status === 'TIMED')
);

const pastByGroup = computed(() =>
  collectByGroup(f => f.status === 'FINISHED')
);

function simScore(id: number) {
  return state.groupScores[id] ?? null;
}

function onInput(fixtureId: number, side: 'home' | 'away', event: Event): void {
  const raw = (event.target as HTMLInputElement).value;
  if (raw === '') {
    clearGroupScore(fixtureId);
    return;
  }
  const val = parseInt(raw, 10);
  if (isNaN(val)) return;
  const existing = state.groupScores[fixtureId] ?? { home: 0, away: 0 };
  setGroupScore(
    fixtureId,
    side === 'home' ? val : existing.home,
    side === 'away' ? val : existing.away,
  );
}

function winClass(f: Fixture, side: 'home' | 'away'): string {
  if (!f.score) return '';
  const won = side === 'home' ? f.score.home > f.score.away : f.score.away > f.score.home;
  const lost = side === 'home' ? f.score.home < f.score.away : f.score.away < f.score.home;
  if (won) return 'text-white';
  if (lost) return 'text-gray-500';
  return 'text-gray-300';
}
</script>
