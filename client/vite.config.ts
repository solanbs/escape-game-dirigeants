import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Dossier des scénarios (YAML des pages, search.yaml), à la racine du dépôt.
      // Calculé depuis ce fichier : ne dépend ni du dossier de lancement ni du fichier qui importe.
      '@scenarios': fileURLToPath(new URL('../scenarios', import.meta.url)),
    },
  },
  // Le paquet partagé est un workspace : on le laisse hors du pré-bundle
  // pour que ses rebuilds soient pris en compte en dev.
  optimizeDeps: {
    exclude: ['@escape/shared'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
