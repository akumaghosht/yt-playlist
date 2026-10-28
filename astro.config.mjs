// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

// Load all environment variables from .env and .env.local
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
const ytApiKey =
  env.PUBLIC_YOUTUBE_API_KEY ||
  env.YOUTUBE_API_KEY ||
  process.env.PUBLIC_YOUTUBE_API_KEY ||
  process.env.YOUTUBE_API_KEY ||
  '';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.PUBLIC_YOUTUBE_API_KEY': JSON.stringify(ytApiKey),
    },
  },
});
