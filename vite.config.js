import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/phaser-with-ai-experiment/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});