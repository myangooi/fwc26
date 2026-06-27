<template>
  <section ref="sectionRef" class="w-full">
    <h2 class="text-xl font-bold mb-6 text-white">
      Knockout Stage (as it stands)
    </h2>

    <!-- Sequential left-to-right (narrow container) -->
    <div v-if="!wide" class="overflow-x-auto w-full">
      <div
        class="flex justify-around gap-4 pb-4 items-stretch w-max min-w-full"
      >
        <BracketRound
          v-for="round in mobileRounds"
          :key="round.name"
          :round="round"
          :simulated-winners="state.knockoutWinners"
          :centered="round.name === 'Final'"
        />
      </div>
    </div>

    <!-- Mirrored bracket (wide container) -->
    <div v-else class="overflow-x-auto w-full">
      <div
        class="grid grid-cols-9 gap-2 justify-between w-full pb-4 items-stretch"
      >
        <BracketRound
          v-for="round in leftRounds"
          :key="'L-' + round.name"
          :round="round"
          :simulated-winners="state.knockoutWinners"
          compact
        />
        <BracketRound
          key="Final"
          :round="finalRound"
          :simulated-winners="state.knockoutWinners"
          compact
          centered
        />
        <BracketRound
          v-for="round in rightRounds"
          :key="'R-' + round.name"
          :round="round"
          :simulated-winners="state.knockoutWinners"
          compact
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import type { KnockoutRound, KnockoutMatch } from "../../types";
import { useSimulation } from "../../composables/useSimulation";
import BracketRound from "./BracketRound.vue";

const props = defineProps<{ rounds: KnockoutRound[] }>();
const { state } = useSimulation();

const sectionRef = ref<HTMLElement | null>(null);
const containerWidth = ref(0);
const wide = computed(() => containerWidth.value >= 1024);

let ro: ResizeObserver | null = null;
onMounted(() => {
  ro = new ResizeObserver((entries) => {
    containerWidth.value = entries[0].contentRect.width;
  });
  if (sectionRef.value) ro.observe(sectionRef.value);
});
onUnmounted(() => ro?.disconnect());

const ROUND_SIZES: Record<string, number> = {
  "Round of 32": 16,
  "Round of 16": 8,
  "Quarter-finals": 4,
  "Semi-finals": 2,
  Final: 1,
};

const ROUND_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Final",
];

let placeholderSeq = 0;
function makePlaceholder(): KnockoutMatch {
  return { id: --placeholderSeq, homeTeam: null, awayTeam: null, winner: null };
}

const filledRounds = computed<KnockoutRound[]>(() => {
  placeholderSeq = 0;
  const byName = Object.fromEntries(props.rounds.map((r) => [r.name, r]));
  return ROUND_ORDER.map((name) => {
    const existing = byName[name];
    const size = ROUND_SIZES[name] ?? 1;
    const matches: KnockoutMatch[] = existing ? [...existing.matches] : [];
    while (matches.length < size) matches.push(makePlaceholder());
    return { name, matches };
  });
});

const nonFinalRounds = computed(() =>
  filledRounds.value.filter((r) => r.name !== "Final"),
);

const finalRound = computed(() => {
  const final = filledRounds.value.find((r) => r.name === "Final");
  const thirdPlace = props.rounds.find((r) => r.name === "Third Place");
  const finalMatches = (final?.matches ?? [makePlaceholder()]).map(m => ({ ...m, heading: 'Final' }));
  const thirdMatches = (thirdPlace?.matches ?? [makePlaceholder()]).map(m => ({ ...m, heading: '3rd Place' }));
  return { name: "Final", matches: [...finalMatches, ...thirdMatches] };
});

const mobileRounds = computed<KnockoutRound[]>(() =>
  filledRounds.value.map((r) => (r.name === "Final" ? finalRound.value : r)),
);

const leftRounds = computed(() =>
  nonFinalRounds.value.map((r) => ({
    name: r.name,
    matches: r.matches.slice(0, r.matches.length / 2),
  })),
);

const rightRounds = computed(() =>
  [...nonFinalRounds.value].reverse().map((r) => ({
    name: r.name,
    matches: r.matches.slice(r.matches.length / 2),
  })),
);
</script>
