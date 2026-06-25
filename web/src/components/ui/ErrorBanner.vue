<template>
  <div class="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded flex items-center justify-between">
    <span>{{ message }}</span>
    <button
      class="ml-4 bg-red-700 hover:bg-red-600 text-white text-sm px-3 py-1 rounded transition-colors"
      @click="$emit('retry')"
    >
      Refresh
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message: string }>();
defineEmits<{ (e: 'retry'): void }>();
</script>
