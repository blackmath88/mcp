import { Effect, type Layer } from 'effect'

import type { Pace } from '../domain/services.ts'
import type { World } from '../domain/world.ts'
import { type Frame, type OfferedTool, runOverMcp } from './in-tab-mcp.ts'

type Python = Readonly<{
  runPythonAsync: (code: string) => Promise<unknown>
  globals: Readonly<{ set: (name: string, value: unknown) => void }>
  setStdout: (options: { batched: (line: string) => void }) => void
  setStderr: (options: { batched: (line: string) => void }) => void
}>

declare global {
  var loadPyodide:
    | undefined
    | ((options: { indexURL: string }) => Promise<Python>)
}

export const DEFAULT_PROGRAM = `# Real Python, running in this tab.
# Each ledger.write(...) is a real MCP tools/call to the server.
loads = ["clay", "timber", "iron"]

for load in loads:
    await ledger.write(load)
    print("wrote", load)

print("all done")
`

// NOTE: Real CPython compiled to WebAssembly (Pyodide), served from this
// site's own /pyodide folder and booted the first time a program runs.
const runtime: { current: Promise<Python> | undefined } = { current: undefined }

const boot = (): Promise<Python> =>
  new Promise((resolve, reject) => {
    const indexURL = new URL('pyodide/', document.baseURI).href
    const script = document.createElement('script')
    script.src = `${indexURL}pyodide.js`
    script.addEventListener('error', () => {
      reject(new Error('The Python runtime could not be loaded.'))
    })
    script.addEventListener('load', () => {
      if (globalThis.loadPyodide === undefined) {
        reject(new Error('The Python runtime did not start.'))
        return
      }
      globalThis.loadPyodide({ indexURL }).then(resolve, reject)
    })
    document.head.append(script)
  })

const lastLines = (text: string, count: number): string =>
  text.trim().split('\n').slice(-count).join('\n')

export const runProgram = (
  world: World,
  station: string,
  code: string,
  pace: Layer.Layer<Pace>,
) =>
  Effect.tryPromise({
    try: async () => {
      runtime.current ??= boot()
      const python = await runtime.current
      const printed: Array<string> = []
      const frames: Array<Frame> = []
      const state: {
        world: World
        tools: ReadonlyArray<OfferedTool>
        calls: number
      } = { world, tools: [], calls: 0 }
      python.setStdout({ batched: line => printed.push(line) })
      python.setStderr({ batched: line => printed.push(line) })
      python.globals.set('ledger', {
        write: async (load: unknown) => {
          state.calls += 1
          const done = await Effect.runPromise(
            runOverMcp(
              state.world,
              station,
              'write_entry',
              { load: String(load) },
              pace,
            ),
          )
          state.world = done.world
          state.tools = done.tools
          frames.push(...done.frames)
          if (done.record.outcome._tag === 'Failed') {
            throw new Error(done.record.outcome.message)
          }
          return `wrote ${String(load)}`
        },
      })
      const error = await python.runPythonAsync(code).then(
        () => '',
        (cause: unknown) => lastLines(String(cause), 6),
      )
      return {
        output: printed.join('\n'),
        error,
        calls: state.calls,
        world: state.world,
        tools: state.tools,
        frames,
      }
    },
    catch: cause => new Error(String(cause)),
  })
