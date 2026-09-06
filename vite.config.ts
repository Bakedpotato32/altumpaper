import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.svg'],
      manifest: {
        name: 'AltumPaper — Exam Studio',
        short_name: 'AltumPaper',
        description: 'Offline Question Paper Studio & Exam Generator',
        theme_color: '#2563EB',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/logo.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,ttf}']
      }
    })
  ],
  server: {
    host: true,
    watch: {
      usePolling: true,
      interval: 100
    }
  }
});
