import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: '/fwc26/',
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
