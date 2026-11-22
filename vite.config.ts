import { defineConfig } from 'vite'

import { foldkit } from '@foldkit/vite-plugin'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // The upstream default starts a local MCP relay. The catalog needs no server;
  // enable the relay explicitly only for trusted, deliberately configured tooling.
  plugins: [tailwindcss(), foldkit({ devToolsMcpPort: false })],
  optimizeDeps: {
    entries: ['src/entry.ts'],
  },
})
