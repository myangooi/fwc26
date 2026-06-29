<template>
  <div class="h-full flex flex-col bg-gray-950 text-white overflow-hidden">
    <!-- Header: full width, inner content capped at 1440px -->
    <header class="border-b border-gray-800 px-6 py-4 flex-shrink-0">
      <div class="max-w-[1440px] mx-auto flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold">FWC26 Simulator</h1>
          <p v-if="lastUpdatedText" class="text-xs text-gray-500 mt-0.5">{{ lastUpdatedText }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center justify-center px-3 py-1.5 sm:text-sm"
            @click="showHowTo = true"
            title="How to Use"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <path d="M12 17h.01"/>
            </svg>
            <span class="hidden sm:inline">How to Use</span>
          </button>
          <button
            v-if="groups && !isWide"
            class="bg-green-600 hover:bg-green-500 text-white rounded transition-colors flex items-center justify-center px-3 py-1.5 sm:text-sm"
            @click="showSimulate = !showSimulate"
            title="Simulate"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="6 3 20 12 6 21 6 3"/>
            </svg>
            <span class="hidden sm:inline">Simulate</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Content row: centered at 1440px, sidebar sticks to content -->
    <div class="flex flex-1 min-h-0 justify-center overflow-hidden">
      <div class="flex w-full max-w-[1440px] min-h-0">
        <main
          class="flex-1 min-w-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div class="px-4 py-8 space-y-12">
            <div v-if="loading" class="text-center text-gray-400 py-20">
              Loading World Cup data…
            </div>

            <ErrorBanner
              v-else-if="error"
              :message="error"
              @retry="fetchData"
            />

            <template v-else>
              <GroupStage v-if="groups" :groups="effectiveGroups" />
              <KnockoutStage v-if="groups" :rounds="knockoutRounds" />
            </template>
          </div>
        </main>

        <SimulateDialog
          v-if="groups && (isWide || showSimulate)"
          :groups="effectiveGroups"
          :original-groups="groups.groups"
          :permanent="isWide"
          @close="showSimulate = false"
        />
      </div>
    </div>

    <HowToUseDialog v-if="showHowTo" @close="showHowTo = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import type { KnockoutMatch } from "./types";
import { useWC2026 } from "./composables/useWC2026";
import { useSimulation, applyDateCutoff } from "./composables/useSimulation";
import { buildAllKnockoutRounds } from "./composables/useKnockoutQualification";
import ErrorBanner from "./components/ui/ErrorBanner.vue";
import GroupStage from "./components/group/GroupStage.vue";
import KnockoutStage from "./components/knockout/KnockoutStage.vue";
import SimulateDialog from "./components/simulate/SimulateDialog.vue";
import HowToUseDialog from "./components/ui/HowToUseDialog.vue";

const { groups, knockout, loading, error, fetchData } = useWC2026();
const { state } = useSimulation();

const showSimulate = ref(false);
const showHowTo = ref(false);
const isWide = ref(window.innerWidth > 1440);
function onResize() {
  isWide.value = window.innerWidth > 1440;
}

const lastUpdatedText = computed(() => {
  if (!groups.value) return null;
  const d = new Date(groups.value.lastUpdated);
  return `Updated ${d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`;
});

onMounted(() => {
  window.addEventListener("resize", onResize);
  fetchData();
});
onUnmounted(() => window.removeEventListener("resize", onResize));

const effectiveGroups = computed(() =>
  applyDateCutoff(groups.value?.groups ?? [], state.cutoffDate)
);

const knockoutRounds = computed(() => {
  if (!groups.value) return [];
  const realMatchData: Record<number, KnockoutMatch> = {};
  for (const round of (knockout.value?.rounds ?? [])) {
    for (const m of round.matches) realMatchData[m.id] = m;
  }
  return buildAllKnockoutRounds(
    effectiveGroups.value,
    state.groupScores,
    state.knockoutWinners,
    realMatchData,
  );
});
</script>
