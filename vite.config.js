import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/code-review-slides/' : '/',
  build: { outDir: 'dist' },
});
