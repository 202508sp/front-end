import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    // Vitest はデフォルトで SSR 条件で解決しがちなので、
    // Svelte のブラウザ向けエントリ（mount あり）を優先する
    conditions: ['browser']
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true
  }
});