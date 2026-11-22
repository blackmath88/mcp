import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

import { foldkit } from '@foldkit/vite-plugin'
import tailwindcss from '@tailwindcss/vite'

import { specimenHost } from './src/live/vite-plugin.ts'

export default defineConfig({
  // Keep the Foldkit DevTools relay disabled. The specimen middleware owns its loopback API.
  plugins: [tailwindcss(), foldkit({ devToolsMcpPort: false }), specimenHost()],
  build: {
    rollupOptions: {
      input: ['index.html', 'live.html', 'lab/concept.html'].map(file =>
        fileURLToPath(new URL(file, import.meta.url)),
      ),
    },
  },
  server: {
    watch: {
      ignored: ['**/test-output/**', '**/vendor/mcp-apps-quickstart/dist/**'],
    },
  },
  optimizeDeps: {
    entries: ['src/entry.ts', 'src/live/entry.ts'],
  },
})
