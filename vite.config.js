import {defineConfig} from 'vite';

// VITE_BASE задаётся автоматически в GitHub Actions — проект работает при любом имени репозитория.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  server: {host:'127.0.0.1', port:5173},
  preview: {host:'127.0.0.1', port:4173}
});
