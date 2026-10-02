// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
//import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  server: {
    // Permite qualquer subdomínio do ngrok ou hosts externos
    allowedHosts: true,
  },
  base: '/MzClickTunerApp/',
  plugins: [
    // basicSsl(),
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'MzClickTunerApp',
        short_name: 'MzClickTuner',
        description: 'Afinador cromático preciso e metrônomo profissional offline',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
});