<template>
  <section ref="sectionRef">
    <h2 class="text-xl font-bold mb-6 text-white">Group Stage</h2>
    <div
      class="grid gap-4 mb-8"
      :class="cols >= 3 ? 'grid-cols-3' : cols >= 2 ? 'grid-cols-2' : 'grid-cols-1'"
    >
      <GroupCard v-for="group in groups" :key="group.name" :group="group" :all-groups="groups" />
    </div>
    <div class="grid gap-4" :class="cols >= 2 ? 'grid-cols-2' : 'grid-cols-1'">
      <BestThirdPlaceCard :groups="groups" />
      <GroupQualifiersCard :groups="groups" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Group } from '../../types';
import GroupCard from './GroupCard.vue';
import BestThirdPlaceCard from './BestThirdPlaceCard.vue';
import GroupQualifiersCard from './GroupQualifiersCard.vue';

defineProps<{ groups: Group[] }>();

const sectionRef = ref<HTMLElement | null>(null);
const containerWidth = ref(0);

const cols = computed(() => {
  if (containerWidth.value >= 900) return 3;
  if (containerWidth.value >= 560) return 2;
  return 1;
});

let ro: ResizeObserver | null = null;
onMounted(() => {
  ro = new ResizeObserver(entries => {
    containerWidth.value = entries[0].contentRect.width;
  });
  if (sectionRef.value) ro.observe(sectionRef.value);
});
onUnmounted(() => ro?.disconnect());
</script>
