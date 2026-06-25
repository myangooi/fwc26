import { ref } from 'vue';
import type { GroupsBlob, KnockoutBlob } from '../types';

export function useWC2026() {
  const groups = ref<GroupsBlob | null>(null);
  const knockout = ref<KnockoutBlob | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  async function fetchData(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const base = import.meta.env.VITE_WORKER_URL;
      const [groupsRes, knockoutRes] = await Promise.all([
        fetch(`${base}/groups`),
        fetch(`${base}/knockout`),
      ]);
      if (!groupsRes.ok || !knockoutRes.ok) {
        throw new Error(`Failed to load data (${groupsRes.status} / ${knockoutRes.status})`);
      }
      [groups.value, knockout.value] = await Promise.all([
        groupsRes.json() as Promise<GroupsBlob>,
        knockoutRes.json() as Promise<KnockoutBlob>,
      ]);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      loading.value = false;
    }
  }

  return { groups, knockout, loading, error, fetchData };
}
