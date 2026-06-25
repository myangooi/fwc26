<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      @click.self="$emit('close')"
    >
      <div class="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        <!-- header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-700 flex-shrink-0">
          <h2 class="font-semibold text-white text-base">How to Use</h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-white text-lg leading-none">✕</button>
        </div>

        <!-- content -->
        <div class="overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-5 py-4 space-y-5 text-sm text-gray-300">
          <section>
            <h3 class="text-white font-semibold mb-1.5">Simulate group stage results</h3>
            <p>Tap <span class="text-white font-medium">Simulate</span> to open the sidebar. In the <span class="text-white font-medium">Fixtures</span> tab, enter a score for each match. Standings, qualifiers, and the knockout bracket update live as you type.</p>
          </section>

          <section>
            <h3 class="text-white font-semibold mb-1.5">Tiebreakers</h3>
            <p>When two or more teams are tied after all regular tiebreaker criteria (points → goal difference → goals scored → head-to-head → FIFA ranking), a <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold">Tie</span> badge appears next to their names.</p>
            <p class="mt-1.5">Click the badge to open the <span class="text-white font-medium">Team Conduct Score</span> dialog and manually assign a score. TCS values must be negative (e.g. −1, −3). The team with the higher (less negative) score advances. Leave blank to keep the tie unresolved.</p>
          </section>

          <section>
            <h3 class="text-white font-semibold mb-1.5">Knockout bracket</h3>
            <p>The bracket is populated automatically from the group stage results. Simulated group scores flow through to determine which teams qualify and which sides of the bracket they appear on.</p>
          </section>

          <section>
            <h3 class="text-white font-semibold mb-1.5">Best third-place teams</h3>
            <p>The 8 best third-place teams across all 12 groups qualify for the Round of 32. Their bracket placement follows the official FIFA Annex C rules based on which groups they came from.</p>
          </section>

          <section>
            <h3 class="text-white font-semibold mb-1.5">Reset</h3>
            <p>Use the <span class="text-white font-medium">Reset</span> link inside the Simulate sidebar to clear all simulated scores and tiebreaker values and start over.</p>
          </section>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineEmits<{ close: [] }>();
</script>
