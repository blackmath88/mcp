import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root,
  plugins: [viteSingleFile()],
  build: {
    rollupOptions: {
      input: fileURLToPath(new URL('./mcp-app.html', import.meta.url)),
    },
  },
})
