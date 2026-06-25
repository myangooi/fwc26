<template>
  <div class="flex flex-col w-28">
    <div class="text-xs text-gray-500 font-semibold uppercase mb-2 text-center">
      {{ round.name }}
    </div>
    <div class="flex flex-col justify-around gap-2 flex-1">
      <div v-for="match in round.matches" :key="match.id" :class="compact ? 'max-w-[100px]' : ''">
        <BracketMatch
          :match="match"
          :simulated-winner-id="simulatedWinners[match.id]"
          :heading="match.heading"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { KnockoutRound } from '../../types';
import BracketMatch from "./BracketMatch.vue";

defineProps<{
  round: KnockoutRound;
  simulatedWinners: Record<number, number>;
  compact?: boolean;
}>();
</script>
