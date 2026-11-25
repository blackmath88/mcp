// Copies the Pyodide runtime from node_modules into public/pyodide so the lab
// can load real Python from its own origin. No CDN is contacted at run time.
import { cpSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const target = `${root}public/pyodide`
mkdirSync(target, { recursive: true })
for (const file of [
  'pyodide.js',
  'pyodide.asm.mjs',
  'pyodide.asm.wasm',
  'python_stdlib.zip',
  'pyodide-lock.json',
]) {
  cpSync(`${root}node_modules/pyodide/${file}`, `${target}/${file}`)
}
