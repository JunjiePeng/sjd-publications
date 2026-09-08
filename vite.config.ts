import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: '/sjd-publications/',
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react()],
  build: { outDir: 'dist/client' },
  server:
    process.env.CODEX_SANDBOX === 'seatbelt'
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
});
