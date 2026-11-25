import { pathLabel } from '../domain/memory.ts'
import type { NeighbourId } from '../domain/modules.ts'
import type { World } from '../domain/world.ts'
import type { Station } from './model.ts'

// What the workshop looks like for each server: what its neighbours are
// called, which rules sit in the wall openings, what else crosses the front
// desk, how the building is arranged, and where the picture simplifies.
// Authored by the lab, from its own simulations.

export type Building = 'room' | 'shared' | 'mall' | 'copy' | 'dark'

export type Scene = Readonly<{
  names: Partial<Record<NeighbourId, string>>
  gates: Partial<Record<NeighbourId, string>>
  desk: ReadonlyArray<string>
  building: Building
  notes: ReadonlyArray<string>
}>

const scene = (parts: Partial<Scene>): Scene => ({
  names: {},
  gates: {},
  desk: [],
  building: 'room',
  notes: [],
  ...parts,
})

export const sceneOf = (station: Station, world: World): Scene => {
  switch (station) {
    case 'valley':
      return scene({ names: { store: 'the valley map' } })
    case 'fetch':
      return scene({
        names: { web: 'valley.test pages' },
        gates:
          world.fetchPolicy === 'none'
            ? {}
            : {
                web:
                  world.fetchPolicy === 'every-hop'
                    ? 'robots.txt, every hop'
                    : 'robots.txt, first URL only',
              },
        notes:
          world.fetchPolicy === 'none'
            ? ['With “Never check” there is no rule in the wall at all.']
            : [],
      })
    case 'memory':
      return scene({ names: { store: pathLabel[world.memory.storagePath] } })
    case 'thinking':
      return scene({
        names: { store: 'the valley map', llm: 'expert (stand-in)' },
        notes: [
          'The board always says plan_steps. Which slot it lands in depends on the build: bend “What is inside” and watch the line move.',
          ...(world.thinkingMode === 'record'
            ? [
                'Recording your steps reaches nothing outside: the plan is made of what was sent in.',
              ]
            : []),
        ],
      })
    case 'filesystem':
      return scene({
        names: { files: world.files.allowed.join(', ') || 'no folder' },
        gates: { files: 'allowed folders' },
        desk: ['→ roots from the AI app'],
        notes: [
          'The AI app can move the boundary by sending roots in through the desk. Which list wins depends on the server build.',
        ],
      })
    case 'perception':
      return scene({
        names: { web: 'a page with four controls' },
        gates: {
          web:
            world.page.mode === 'snapshot'
              ? 'sees named controls only'
              : 'sees by coordinates',
        },
      })
    case 'cli':
      return scene({
        names: { program: 'the crate server' },
        building: 'copy',
        notes: [
          'The copy is drawn beside the AI app. In practice it is a generated program on someone’s machine that calls the server without reading the board again.',
        ],
      })
    case 'local-remote':
      return scene({
        names: { store: 'the current place' },
        building: world.gateway.build === 'shared' ? 'shared' : 'room',
        notes:
          world.gateway.build === 'shared'
            ? [
                'Two visitors, one room: whatever client A changes, client B finds.',
              ]
            : [
                'Each visitor gets a room of its own. Drawn once; imagine one room per connection.',
              ],
      })
    case 'apps':
      return scene({
        desk: ['← an app view', '→ what you moved'],
        notes: [
          'Share sits by the desk because the app leaves through it: the AI app shows it to you. The server never draws on your screen itself.',
        ],
      })
    case 'code-mode':
      return scene({
        names: { store: 'the ledger, no undo' },
        desk: ['→ a program the AI wrote'],
      })
    case 'delegation':
      return scene({
        names: { llm: 'expert (stand-in)', store: 'stored plans' },
        notes: ['No model runs in this lab. The expert is scripted.'],
      })
    case 'iteration':
      return scene({
        names: { llm: 'writer and judge (stand-ins)', store: 'checkpoints' },
        notes: ['The writer and the judge are scripted stand-ins.'],
      })
    case 'network':
      return scene({
        names: { program: 'forge and dock servers' },
        building: 'mall',
        notes: [
          'Drawn as one room phoning other programs. A gateway is really one desk in front of several rooms, with their boards merged into one.',
        ],
      })
    case 'inspector':
      return scene({
        names: { program: 'another server’s board' },
        notes: [
          'The inspector reads boards, never rooms. Everything it says comes from the list.',
        ],
      })
    case 'ask':
      return scene({
        names: { store: 'the cart list' },
        desk: world.ask.build === 'asks' ? ['← elicitation/create to you'] : [],
        notes: [
          world.ask.build === 'asks'
            ? 'The question leaves through the desk: a server cannot reach you any other way.'
            : 'Same board, but this build never asks: reserve_cart lands on Write.',
        ],
      })
    case 'arm':
      return scene({
        names: { world: 'crane at the dock (simulated)' },
        gates: {
          world:
            world.arm.confirm === 'sensor' ? 'sensor checks' : 'nothing checks',
        },
        notes: ['Nothing physical moves. The crane is simulated.'],
      })
  }
}

export const darkScene: Scene = scene({
  building: 'dark',
  notes: [
    'A pasted list is only the board. Slots are guesses from the wording; what each tool reaches is not in the list.',
  ],
})

export const allScene: Scene = scene({
  notes: [
    'Every server’s tools in one room. A real AI app connects to servers one by one, each with its own desk.',
  ],
})
