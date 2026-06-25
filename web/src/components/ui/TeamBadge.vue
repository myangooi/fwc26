<template>
  <span class="flex items-center gap-1.5">
    <span class="w-6 h-4 flex-shrink-0 flex items-center justify-center">
      <img
        v-if="team.crest"
        :src="team.crest"
        :alt="team.tla ?? team.name"
        class="w-full h-full object-contain"
        @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
      />
    </span>
    {{ team.tla ?? team.name }}
  </span>
</template>

<script setup lang="ts">
defineProps<{
  team: { id: number; name: string; tla?: string; crest?: string };
}>();
</script>
