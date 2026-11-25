import { Array, Option } from 'effect'
import { type Html, type HtmlBuilder } from 'foldkit/html'

import { type CapabilityName, catalogue } from '../domain/capabilities.ts'
import { placeOf } from '../domain/modules.ts'
import { type MapInput, type MapTool, canvasView } from './mcpmap.ts'
import { Message } from './message.ts'
import type { Model } from './model.ts'
import type { Scene } from './scenes.ts'

type H = HtmlBuilder<Message>

// WHAT IS MCP, TOLD IN FIVE SCENES
//
// For someone who has never heard of MCP. The text scrolls; the workshop
// beside it stays put and changes with each scene: first the AI app alone,
// then the list at the front desk, then the workshop behind it, then one
// call, then why the list is not enough. The same canvas the benches use,
// so what you learn here is what you read there.
//
// The view renders every scene's canvas, stacked. Which one shows is set by
// `data-tell` on the section, from scrolling (src/lab/tell-scroll.ts) or the
// scene buttons; without either, the first scene shows.

export const toolsOf = (
  model: Model,
  names: ReadonlyArray<CapabilityName>,
  active: ReadonlyArray<CapabilityName> = [],
): ReadonlyArray<MapTool> =>
  Array.flatMap(names, name =>
    Array.fromOption(
      Option.map(
        Option.fromNullishOr(catalogue.find(entry => entry.name === name)),
        capability => {
          const place = placeOf(capability.name, model.world)
          return {
            key: capability.name,
            label: capability.name,
            title: capability.title,
            icon: Option.some(capability.name),
            slot: place.slot,
            reach: place.reach,
            aria: `${capability.title}, ${capability.name}`,
            message: Option.none(),
            isSelected: false,
            isCalled: active.includes(name),
            isActive: active.length === 0 || active.includes(name),
          }
        },
      ),
    ),
  )

// One small server for the whole story: a read, a write, a question for
// you and an arm.
const storyServer: ReadonlyArray<CapabilityName> = [
  'fetch_page',
  'remember',
  'reserve_cart',
  'move_crate',
]

const scene = (parts: Partial<Scene>): Scene => ({
  names: {},
  gates: {},
  desk: [],
  building: 'room',
  notes: [],
  ...parts,
})

type Beat = Readonly<{
  kicker: string
  title: string
  body: ReadonlyArray<string>
  map: (model: Model) => MapInput
  caption: string
}>

const beats: ReadonlyArray<Beat> = [
  {
    kicker: 'On its own',
    title: 'An AI app can only talk.',
    body: [
      'You type, it answers. On its own it cannot open today’s page, write a note down or move anything.',
      'For that it needs other programs. And it cannot see inside them: to the AI, a program is a closed building.',
    ],
    map: () => ({
      mode: 'empty',
      title: 'a program',
      tools: [],
      scene: scene({ building: 'dark' }),
      isWorking: false,
    }),
    caption: 'You and the AI app on the left. The program: a closed room.',
  },
  {
    kicker: 'The front desk',
    title: 'MCP is the front desk.',
    body: [
      'The app walks up to the program and asks one question: what can you do?',
      'The answer is a list of tools. Each has a name, one or two sentences, and what to fill in. That list is all the AI ever sees.',
    ],
    map: model => ({
      mode: 'server',
      title: 'a program',
      tools: toolsOf(model, storyServer),
      scene: scene({ building: 'dark' }),
      isWorking: false,
    }),
    caption:
      'The board at the desk is the list of tools. The room is still dark.',
  },
  {
    kicker: 'Behind the list',
    title: 'Behind the desk is a workshop.',
    body: [
      'Each tool does its work in a different place. One only reads. One writes something down that stays. One stops and asks you. One moves a thing in the world.',
      'On the list they all look alike: a name and a sentence.',
    ],
    map: model => ({
      mode: 'server',
      title: 'a program',
      tools: toolsOf(model, storyServer),
      scene: scene({
        names: { web: 'web pages', store: 'saved notes', world: 'the world' },
      }),
      isWorking: false,
    }),
    caption:
      'The same four tools, now in their places, with what each reaches outside.',
  },
  {
    kicker: 'A call',
    title: 'Using a tool is a call through the desk.',
    body: [
      'The AI picks fetch_page and fills in a web address. The desk passes the call in, the tool fetches the page from outside, and the answer comes back the same way.',
      'The AI never walks into the workshop. It only hears what comes back.',
    ],
    map: model => ({
      mode: 'server',
      title: 'a program',
      tools: toolsOf(model, storyServer, ['fetch_page']),
      scene: scene({
        names: { web: 'web pages', store: 'saved notes', world: 'the world' },
      }),
      isWorking: true,
    }),
    caption: 'One call: desk → the Read place → a web page, and back.',
  },
  {
    kicker: 'Why look behind it',
    title: 'The list does not say what is behind it.',
    body: [
      'move_crate can look as harmless on the list as fetch_page. Whether you are asked first, what a tool may reach, what stays changed: that is decided in the workshop and by the app, not on the list.',
      'This lab opens the workshop, one server at a time.',
    ],
    map: model => ({
      mode: 'server',
      title: 'a program',
      tools: toolsOf(model, storyServer, ['move_crate', 'reserve_cart']),
      scene: scene({
        names: { web: 'web pages', store: 'saved notes', world: 'the world' },
        gates: { world: 'who checks?' },
        desk: ['← a question for you'],
      }),
      isWorking: false,
    }),
    caption:
      'A question goes back out to you through the desk; the arm reaches the world through an opening someone has to guard.',
  },
]

export const tellSize = beats.length

const dotsView = (h: H): Html =>
  h.div(
    [h.Class('tell-dots'), h.AriaLabel('Scenes')],
    Array.map(beats, (beat, index) =>
      h.keyed('button')(
        `dot-${index}`,
        [
          h.Type('button'),
          h.Class('tell-dot'),
          h.DataAttribute('tell-go', String(index + 1)),
          h.AriaLabel(`Scene ${index + 1}: ${beat.kicker}`),
        ],
        [String(index + 1)],
      ),
    ),
  )

export const tellView = (model: Model, h: H): Html =>
  h.section(
    [h.Class('tell'), h.AriaLabel('What is MCP, in five scenes')],
    [
      h.div(
        [h.Class('tell-visual')],
        [
          h.div(
            [h.Class('tell-stage')],
            Array.map(beats, (beat, index) =>
              h.keyed('figure')(
                `layer-${index}`,
                [
                  h.Class(`tell-layer scene-${index + 1}`),
                  h.DataAttribute('tell-layer', String(index + 1)),
                ],
                [
                  canvasView(beat.map(model), h),
                  h.figcaption([h.Class('tell-caption')], [beat.caption]),
                ],
              ),
            ),
          ),
          dotsView(h),
        ],
      ),
      h.div(
        [h.Class('tell-prose')],
        [
          ...Array.map(beats, (beat, index) =>
            h.keyed('article')(
              `beat-${index}`,
              [
                h.Class('tell-beat'),
                h.DataAttribute('tell-beat', String(index + 1)),
              ],
              [
                h.p(
                  [h.Class('tell-kicker')],
                  [`${index + 1} / ${beats.length} · ${beat.kicker}`],
                ),
                h.h2([h.Class('tell-title')], [beat.title]),
                ...Array.map(beat.body, (paragraph, at) =>
                  h.keyed('p')(`p-${at}`, [h.Class('tell-body')], [paragraph]),
                ),
              ],
            ),
          ),
          h.div(
            [h.Class('tell-end')],
            [
              h.button(
                [
                  h.Type('button'),
                  h.Class('btn'),
                  h.OnClick(Message.SelectedStation({ station: 'fetch' })),
                ],
                ['Start at step 01 · Fetch a page'],
              ),
              h.button(
                [
                  h.Type('button'),
                  h.Class('btn ghost'),
                  h.OnClick(Message.ClickedHome()),
                ],
                ['Or see every tool on one map'],
              ),
            ],
          ),
        ],
      ),
    ],
  )
