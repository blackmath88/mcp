import { Array, Option, pipe } from 'effect'
import { type Html, type HtmlBuilder } from 'foldkit/html'

import {
  type Capability,
  type CapabilityName,
  type Family,
  catalogue,
  families,
} from '../domain/capabilities.ts'
import {
  type ForeignTool,
  characterNote,
  hintDefaults,
  parseListing,
} from '../domain/foreign.ts'
import { fingerprintOf, listedFromCatalogue, profile } from '../domain/lens.ts'
import { moduleOf, modules } from '../domain/modules.ts'
import { findCapability, isAdvertisedNow } from './belt.ts'
import { iconView, lineIcon, slotIcons } from './icons.ts'
import { allMap, foreignMap, mcpMapView } from './mcpmap.ts'
import { Message } from './message.ts'
import type { Model, Station } from './model.ts'
import { serverNames, stationNames } from './names.ts'

type H = HtmlBuilder<Message>

const familyName = (family: Family): string =>
  pipe(
    families,
    Array.findFirst(entry => entry.id === family),
    Option.match({ onNone: () => family, onSome: entry => entry.name }),
  )

const familyMeans = (family: Family): string =>
  pipe(
    families,
    Array.findFirst(entry => entry.id === family),
    Option.match({ onNone: () => '', onSome: entry => entry.means }),
  )

export const placeOnAtlas = (capability: Capability): string => {
  const module = modules.find(entry => entry.id === moduleOf(capability.name))
  return module === undefined ? '' : `slot ${module.rung}, ${module.name}`
}

const selectedCapability = (model: Model): Option.Option<Capability> =>
  Option.flatMap(model.maybeSelected, findCapability)

const servers: ReadonlyArray<Station> = pipe(
  catalogue,
  Array.map(capability => capability.specimen),
  Array.dedupe,
)

// SHARED PARTS

const toggle = <Value extends string>(
  label: string,
  current: Value,
  options: ReadonlyArray<readonly [Value, string]>,
  toMessage: (value: Value) => Message,
  h: H,
): Html =>
  h.div(
    [h.Class('seg'), h.Role('group'), h.AriaLabel(label)],
    Array.map(options, ([value, text]) =>
      h.button(
        [
          h.Type('button'),
          h.AriaPressed(current === value ? 'true' : 'false'),
          h.OnClick(toMessage(value)),
        ],
        [text],
      ),
    ),
  )

export const toolChip = (model: Model, capability: Capability, h: H): Html =>
  h.button(
    [
      h.Type('button'),
      h.Class('toolchip'),
      h.AriaPressed(
        Option.contains(model.maybeSelected, capability.name)
          ? 'true'
          : 'false',
      ),
      h.OnClick(Message.SelectedCapability({ name: capability.name })),
    ],
    [iconView(capability.name, h), h.span([], [capability.title])],
  )

// FULL INVENTORY (the conventional way to the same things)

const listView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('inventory')],
    Array.map(servers, station => {
      const tools = Array.filter(
        catalogue,
        capability => capability.specimen === station,
      )
      return h.keyed('section')(
        station,
        [h.Class('inv-server')],
        [
          h.div(
            [h.Class('inv-head')],
            [
              h.h2([], [serverNames[station]]),
              h.span(
                [],
                [
                  `exposes ${tools.length} · shown in “${stationNames[station]}”`,
                ],
              ),
            ],
          ),
          h.ul(
            [h.Class('inv-list')],
            Array.map(tools, capability =>
              h.keyed('li')(
                capability.name,
                [],
                [
                  toolChip(model, capability, h),
                  h.span(
                    [h.Class('inv-family')],
                    [familyName(capability.family)],
                  ),
                  h.span([h.Class('inv-desc')], [capability.description]),
                ],
              ),
            ),
          ),
        ],
      )
    }),
  )

// Across everything one caller could hold: the lab's whole catalogue.
const inventoryLensView = (h: H): Html => {
  const report = profile(Array.map(catalogue, listedFromCatalogue))
  return h.div(
    [h.Class('inv-lens')],
    [
      h.p(
        [h.Class('mode')],
        [
          h.b([], ['Lens, across every server']),
          ' · if one caller held every tool below. Read from the lab’s catalogue; no server was asked.',
        ],
      ),
      ...Array.match(report.compositions, {
        onEmpty: () => [
          h.p([h.Class('side-note')], ['No combination rule matched.']),
        ],
        onNonEmpty: compositions =>
          Array.map(compositions, composition =>
            h.p(
              [h.Class('result warn')],
              [
                h.b([], [`${composition.rule} · `]),
                `${composition.statement} (${composition.tools.join(', ')})`,
              ],
            ),
          ),
      }),
    ],
  )
}

// YOUR SERVER: a tool list the lab did not write, read and nothing more

const FAMILY_SPRITE: Record<Family, CapabilityName> = {
  read: 'read_file',
  query: 'find_route',
  perceive: 'take_snapshot',
  remember: 'remember',
  change: 'write_entry',
  app: 'show_map',
  compose: 'run_as_program',
  delegate: 'ask_expert',
  workflow: 'refine_plan',
  gateway: 'call_tool',
}

const hintText = (
  label: string,
  value: boolean | undefined,
  fallback: boolean,
): string =>
  value === undefined ? `${label} — (read as ${fallback})` : `${label} ${value}`

const driftOfPasted = (
  pins: ReadonlyArray<PastedPin>,
  tool: ForeignTool,
): 'unpinned' | 'new' | 'same' | 'changed' => {
  if (pins.length === 0) {
    return 'unpinned'
  }
  const pin = pins.find(entry => entry.name === tool.name)
  return pin === undefined
    ? 'new'
    : pin.fingerprint === fingerprintOf(tool)
      ? 'same'
      : 'changed'
}

const foreignCard = (
  tool: ForeignTool,
  pins: ReadonlyArray<PastedPin>,
  h: H,
): Html => {
  const drift = driftOfPasted(pins, tool)
  const before = pins.find(entry => entry.name === tool.name)
  return foreignCardBody(tool, drift, before, h)
}

const foreignCardBody = (
  tool: ForeignTool,
  drift: 'unpinned' | 'new' | 'same' | 'changed',
  before: PastedPin | undefined,
  h: H,
): Html =>
  h.keyed('article')(
    tool.name,
    [h.Class('foreign')],
    [
      h.div(
        [h.Class('foreign-head')],
        [
          h.span(
            [h.Class('bigicon')],
            [iconView(FAMILY_SPRITE[tool.family], h)],
          ),
          h.div(
            [],
            [
              h.b(
                [h.Class('mono-strong')],
                [`${tool.name}(${tool.parameters.join(', ')})`],
              ),
              h.p([h.Class('tb-note')], [tool.title]),
              h.p(
                [h.Class('foreign-guess')],
                [`Guessed: ${familyName(tool.family)} · ${tool.familyBasis}`],
              ),
            ],
          ),
        ],
      ),
      drift === 'unpinned'
        ? h.empty
        : h.span(
            [
              h.Class(
                `tag ${drift === 'changed' ? 'bad' : drift === 'new' ? 'warn' : 'quiet'}`,
              ),
            ],
            [
              drift === 'changed'
                ? 'changed since pinned'
                : drift === 'new'
                  ? 'new since pinned'
                  : 'same as pinned',
            ],
          ),
      drift === 'changed' &&
      before !== undefined &&
      before.description !== tool.description
        ? h.p(
            [h.Class('foreign-before')],
            [h.b([], ['Before: ']), before.description],
          )
        : h.empty,
      h.p(
        [h.Class('foreign-desc')],
        [tool.description === '' ? '(no description)' : tool.description],
      ),
      h.p(
        [h.Class('foreign-hints')],
        [
          [
            hintText(
              'readOnlyHint',
              tool.hints.readOnly,
              hintDefaults.readOnly,
            ),
            hintText(
              'destructiveHint',
              tool.hints.destructive,
              hintDefaults.destructive,
            ),
            hintText(
              'idempotentHint',
              tool.hints.idempotent,
              hintDefaults.idempotent,
            ),
            hintText(
              'openWorldHint',
              tool.hints.openWorld,
              hintDefaults.openWorld,
            ),
          ].join(' · '),
        ],
      ),
      h.ul(
        [h.Class('claims')],
        Array.map(tool.claims, claim =>
          h.keyed('li')(
            claim.rule,
            [h.Class(`claim ${claim.isWarning ? 'warn' : ''}`)],
            [
              h.span([h.Class('rule')], [claim.rule]),
              h.span([h.Class('claim-text')], [claim.statement]),
              h.span(
                [h.Class('basis')],
                [
                  `${claim.basis === 'declared' ? 'declared' : 'inferred'} · ${claim.evidence}`,
                ],
              ),
            ],
          ),
        ),
      ),
      h.p(
        [
          h.Class(
            `side-note ${/display/.test(characterNote(tool.description)) ? 'warn-text' : ''}`,
          ),
        ],
        [characterNote(tool.description)],
      ),
      h.div(
        [h.Class('foreign-unknown')],
        [
          'What it works on: not known from the list. Only running it, or reading its source, would tell.',
        ],
      ),
      h.details(
        [h.Class('fold')],
        [
          h.summary([], ['The entry as pasted']),
          h.pre([h.Class('page')], [tool.json]),
        ],
      ),
    ],
  )

const yoursView = (model: Model, h: H): Html => {
  const parsed = parseListing(model.pastedTools)
  return h.div(
    [h.Class('stack yours')],
    [
      h.p(
        [h.Class('mode')],
        [
          h.b([], ['Your server']),
          ' · ask a real server for its tool list, or paste what one answered. Only the list is read; no tool is ever called.',
        ],
      ),
      h.form(
        [
          h.Class('remote-row'),
          h.AriaLabel('Ask a server by its address'),
          h.OnSubmit(Message.ClickedAskRemote()),
        ],
        [
          h.label(
            [h.For('remote-url'), h.Class('eyebrow')],
            ['Server address (Streamable HTTP)'],
          ),
          h.div(
            [h.Class('remote-input')],
            [
              h.input([
                h.Id('remote-url'),
                h.Type('url'),
                h.Placeholder('https://example.com/mcp'),
                h.Value(model.remoteUrl),
                h.OnInput(value => Message.UpdatedRemoteUrl({ value })),
              ]),
              h.button(
                [
                  h.Type('submit'),
                  h.Class('btn small'),
                  h.Disabled(model.remoteState === 'asking'),
                ],
                ['Ask for its tools'],
              ),
            ],
          ),
          h.p(
            [h.Class('tb-note')],
            [
              model.remoteNote === ''
                ? 'Your browser sends initialize and tools/list to that address, then disconnects. The server must allow this page (CORS) and not need a login.'
                : model.remoteNote,
            ],
          ),
        ],
      ),
      h.label(
        [h.For('paste'), h.Class('eyebrow')],
        ['tools/list answer (JSON)'],
      ),
      h.textarea([
        h.Id('paste'),
        h.Class('console-text'),
        h.Rows(8),
        h.Spellcheck(false),
        h.Value(model.pastedTools),
        h.OnInput(value => Message.UpdatedPastedTools({ value })),
      ]),
      h.div(
        [h.Class('ctl')],
        [
          h.button(
            [
              h.Type('button'),
              h.Class('btn ghost small'),
              h.OnClick(Message.ClickedLoadExample()),
            ],
            ['Load an invented example'],
          ),
          h.button(
            [
              h.Type('button'),
              h.Class('btn ghost small'),
              h.Disabled(!parseListing(model.pastedTools).ok),
              h.OnClick(Message.ClickedPinListing()),
            ],
            [
              model.pastedPins.length === 0
                ? 'Pin this listing'
                : 'Pin it again',
            ],
          ),
          h.button(
            [
              h.Type('button'),
              h.Class('btn ghost small'),
              h.OnClick(Message.ClickedLoadChangedExample()),
            ],
            ['The same example, later'],
          ),
          h.button(
            [
              h.Type('button'),
              h.Class('btn ghost small'),
              h.OnClick(Message.UpdatedPastedTools({ value: '' })),
            ],
            ['Clear'],
          ),
        ],
      ),
      parsed.ok
        ? yoursReport(parsed.tools, model.pastedPins, h)
        : parsed.error === ''
          ? h.p(
              [h.Class('empty')],
              [
                'Nothing pasted yet. Load the example to see how a listing reads.',
              ],
            )
          : h.p([h.Class('result warn')], [parsed.error]),
    ],
  )
}

type PastedPin = Readonly<{
  name: string
  fingerprint: string
  description: string
}>

const yoursReport = (
  tools: ReadonlyArray<ForeignTool>,
  pins: ReadonlyArray<PastedPin>,
  h: H,
): Html => {
  const gone = pins.filter(pin => !tools.some(tool => tool.name === pin.name))
  const report = profile(tools)
  const warned = tools.filter(tool =>
    tool.claims.some(claim => claim.isWarning),
  )
  return h.div(
    [h.Class('stack')],
    [
      mcpMapView(foreignMap(tools), h),
      h.div(
        [h.Class('foreign-summary')],
        [
          h.b([], [`${tools.length} tool${tools.length === 1 ? '' : 's'}`]),
          h.span(
            [h.Class('foreign-strip'), h.AriaLabel('Guessed shape')],
            Array.map(families, entry =>
              tools.some(tool => tool.family === entry.id)
                ? h.span(
                    [h.Class('slotmini on'), h.Title(entry.name)],
                    [iconView(FAMILY_SPRITE[entry.id], h)],
                  )
                : h.span([h.Class('slotmini'), h.Title(entry.name)], []),
            ),
          ),
          h.span(
            [h.Class('tb-note')],
            [
              'shape guessed from hints and wording; a server is free to describe itself wrongly',
            ],
          ),
        ],
      ),
      ...Array.map(report.compositions, composition =>
        h.p(
          [h.Class('result warn')],
          [
            h.b([], [`${composition.rule} · `]),
            `${composition.statement} (${composition.tools.join(', ')})`,
          ],
        ),
      ),
      warned.length === 0
        ? h.empty
        : h.p(
            [h.Class('result warn')],
            [
              h.b([], ['Read these before approving anything: ']),
              warned.map(tool => tool.name).join(', '),
              '. Their descriptions instruct whoever reads them, or hide characters.',
            ],
          ),
      pins.length === 0
        ? h.empty
        : h.p(
            [h.Class(gone.length > 0 ? 'result warn' : 'result')],
            [
              h.b([], ['Compared with the pinned listing: ']),
              `${tools.filter(tool => driftOfPasted(pins, tool) === 'changed').length} changed, ${tools.filter(tool => driftOfPasted(pins, tool) === 'new').length} new, ${gone.length} gone${gone.length > 0 ? ` (${gone.map(pin => pin.name).join(', ')})` : ''}. A tool approved before can be a different tool now. Lens’s wording rules can miss a new instruction; this comparison does not.`,
            ],
          ),
      h.div(
        [h.Class('foreign-grid')],
        Array.map(tools, tool => foreignCard(tool, pins, h)),
      ),
    ],
  )
}

// THE THIRTEEN QUESTIONS (optional: an index, not an order)

const ladderView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('stack')],
    [
      h.p(
        [h.Class('mode')],
        [
          h.b([], ['Nine slots']),
          ' · every kind of thing a tool can be, from a read to a physical action, with the tools in this lab that sit there.',
        ],
      ),
      h.ol(
        [h.Class('ladder')],
        Array.map(modules, module =>
          h.keyed('li')(
            module.id,
            [h.Class('rungrow')],
            [
              lineIcon(slotIcons[module.id], `ic place-${module.place}`, h),
              h.div(
                [],
                [
                  h.b([], [module.word]),
                  h.p([h.Class('rung-d')], [module.means]),
                ],
              ),
              h.div(
                [h.Class('chiprow')],
                Array.map(
                  Array.filter(
                    catalogue,
                    capability => moduleOf(capability.name) === module.id,
                  ),
                  capability => toolChip(model, capability, h),
                ),
              ),
            ],
          ),
        ),
      ),
    ],
  )

// DETAIL

const evidenceRow = (
  statement: string,
  answer: string,
  basis: string,
  h: H,
): Html =>
  h.div(
    [],
    [
      h.dt([], [statement]),
      h.dd([], [h.b([], [answer]), h.span([h.Class('basis')], [basis])]),
    ],
  )

const callCount = (model: Model, name: CapabilityName): number =>
  model.frames.filter(
    frame =>
      frame.direction === 'client → server' &&
      frame.json.includes('tools/call') &&
      frame.json.includes(`"${name}"`),
  ).length

export const evidenceView = (
  model: Model,
  capability: Capability,
  h: H,
): Html => {
  const calls = callCount(model, capability.name)
  return h.dl(
    [h.Class('evidence')],
    [
      evidenceRow('In the lab’s catalogue', 'yes', 'curated by this lab', h),
      isAdvertisedNow(model, capability.name)
        ? evidenceRow(
            'Advertised by its server',
            'yes',
            'observed: its tools/list answer in this tab',
            h,
          )
        : evidenceRow(
            'Advertised by its server',
            'not asked yet',
            'open the specimen and the server is asked',
            h,
          ),
      evidenceRow(
        'Called in this tab',
        calls === 0 ? 'no' : `${calls} time${calls === 1 ? '' : 's'}`,
        'observed: tools/call frames',
        h,
      ),
      evidenceRow(
        'Caller authorised',
        'unknown',
        'this simulation never checks who is calling',
        h,
      ),
      evidenceRow(
        'Call approved',
        'unknown',
        'no approval step exists here',
        h,
      ),
    ],
  )
}

const detailView = (model: Model, h: H): Html =>
  h.aside(
    [h.Class('atlas-detail'), h.AriaLabel('Selected capability')],
    Option.match(selectedCapability(model), {
      onNone: () => [
        h.h2([], ['How to read this']),
        h.p(
          [],
          [
            'Every tool of every server in one workshop. Each sits in the slot that says what kind of thing it is; lines show what it reaches outside the walls.',
          ],
        ),
        h.p(
          [],
          [
            'Select a tool to see which server offers it and to open that server’s step of the route.',
          ],
        ),
        h.p(
          [h.Class('tb-note')],
          [
            'Slots, places and neighbours are this lab’s teaching aid, not categories of the protocol.',
          ],
        ),
      ],
      onSome: capability => {
        const siblings = Array.filter(
          catalogue,
          other =>
            other.specimen === capability.specimen &&
            other.name !== capability.name,
        )
        const cousins = Array.filter(
          catalogue,
          other =>
            other.family === capability.family &&
            other.specimen !== capability.specimen,
        )
        return [
          h.div(
            [h.Class('detail-head')],
            [
              h.span([h.Class('bigicon')], [iconView(capability.name, h)]),
              h.div(
                [],
                [
                  h.h2([], [capability.title]),
                  h.p([h.Class('mono')], [capability.name]),
                ],
              ),
            ],
          ),
          h.p([], [capability.description]),
          h.button(
            [
              h.Type('button'),
              h.Class('btn'),
              h.OnClick(Message.ClickedOpenSpecimen({ name: capability.name })),
            ],
            [`Open “${stationNames[capability.specimen]}”`],
          ),
          h.dl(
            [h.Class('facts')],
            [
              h.div(
                [],
                [
                  h.dt([], ['Family']),
                  h.dd(
                    [],
                    [
                      `${familyName(capability.family)}: ${familyMeans(capability.family)}. Our grouping, not the protocol’s.`,
                    ],
                  ),
                ],
              ),
              h.div(
                [],
                [
                  h.dt([], ['Exposed by']),
                  h.dd([], [serverNames[capability.specimen]]),
                ],
              ),
              h.div(
                [],
                [h.dt([], ['Can change']), h.dd([], [capability.changes])],
              ),
            ],
          ),
          h.h3([], ['What is known about it']),
          evidenceView(model, capability, h),
          Array.match(siblings, {
            onEmpty: () => h.empty,
            onNonEmpty: others =>
              h.div(
                [h.Class('related')],
                [
                  h.h3([], ['Same server also exposes']),
                  h.div(
                    [h.Class('chiprow')],
                    Array.map(others, other => toolChip(model, other, h)),
                  ),
                ],
              ),
          }),
          Array.match(cousins, {
            onEmpty: () => h.empty,
            onNonEmpty: others =>
              h.div(
                [h.Class('related')],
                [
                  h.h3([], ['Same family, other servers']),
                  h.div(
                    [h.Class('chiprow')],
                    Array.map(others, other => toolChip(model, other, h)),
                  ),
                ],
              ),
          }),
        ]
      },
    }),
  )

// PRIMER: three sentences for someone new, one door each for both readers

const glossary: ReadonlyArray<readonly [string, string]> = [
  [
    'Server',
    'A program that offers tools. It can run on your machine or far away.',
  ],
  [
    'Host',
    'The app you use, with the AI inside. It connects to servers and decides what runs.',
  ],
  ['Client', 'The part of the host that speaks MCP to one server.'],
  [
    'Tool',
    'One thing a server offers: a name, the inputs it takes, a description.',
  ],
  [
    'tools/list',
    'The question “what do you offer?” and the server’s answer. This is all the AI is told.',
  ],
  [
    'tools/call',
    'Using one tool with some inputs. The server runs it and answers.',
  ],
  [
    'Hint',
    'A server’s own claim about a tool, like “read-only”. Nothing checks it.',
  ],
]

const primerCard = (n: string, title: string, body: string, h: H): Html =>
  h.div(
    [h.Class('primer-card')],
    [
      h.span([h.Class('tb-n'), h.AriaHidden(true)], [n]),
      h.div([], [h.b([], [title]), h.p([], [body])]),
    ],
  )

// SCREEN

export const atlasScreenView = (model: Model, h: H): Html =>
  h.main(
    [h.Class('atlas-main'), h.AriaLabel('Capability atlas')],
    [
      h.div(
        [h.Class('atlas-head')],
        [
          h.div(
            [],
            [
              h.p([h.Class('kicker')], ['All tools']),
              h.h1(
                [h.Class('home-title')],
                ['What can a connection hand you?'],
              ),
            ],
          ),
          h.div(
            [h.Class('atlas-tools')],
            [
              toggle(
                'View',
                model.atlasView,
                [
                  ['map', 'Map'],
                  ['list', 'Full inventory'],
                  ['ladder', 'Nine slots'],
                  ['yours', 'Your server'],
                ],
                view => Message.SelectedAtlasView({ view }),
                h,
              ),
              model.atlasView === 'list'
                ? toggle(
                    'Show',
                    model.lens,
                    [
                      ['family', 'By what it does'],
                      ['server', 'By who exposes it'],
                    ],
                    lens => Message.SelectedLens({ lens }),
                    h,
                  )
                : h.empty,
            ],
          ),
        ],
      ),
      h.div(
        [h.Class('atlas-doors')],
        [
          h.details(
            [h.Class('pop')],
            [
              h.summary([h.Class('pop-btn')], ['MCP in three sentences']),
              h.div(
                [h.Class('pop-panel primer-pop')],
                [
                  primerCard(
                    '1',
                    'A server hands your AI tools',
                    'Each tool is a name, the inputs it takes and a description. That list is all the AI is told.',
                    h,
                  ),
                  primerCard(
                    '2',
                    'The host decides what runs',
                    'The app around the AI chooses which tools it sees and whether to ask you first. MCP leaves that to the host.',
                    h,
                  ),
                  primerCard(
                    '3',
                    'Behind each tool is something real',
                    'A file, a page, a ledger, another model. The list does not show it. Here you can open it and watch.',
                    h,
                  ),
                  h.h4([], ['Seven words you will meet here']),
                  h.dl(
                    [h.Class('facts')],
                    Array.map(glossary, ([word, meaning]) =>
                      h.keyed('div')(
                        word,
                        [],
                        [h.dt([], [word]), h.dd([], [meaning])],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          h.button(
            [
              h.Type('button'),
              h.Class('pop-btn plain'),
              h.OnClick(Message.SelectedStation({ station: 'fetch' })),
            ],
            ['Start the route at step 01'],
          ),
          h.button(
            [
              h.Type('button'),
              h.Class('pop-btn plain'),
              h.OnClick(Message.ClickedNerdEntry()),
            ],
            ['Straight to the wire: raw JSON-RPC'],
          ),
        ],
      ),
      h.div(
        [h.Class('atlas-body')],
        [
          model.atlasView === 'map'
            ? mcpMapView(allMap(model), h, model.canvasFull)
            : model.atlasView === 'yours'
              ? yoursView(model, h)
              : model.atlasView === 'ladder'
                ? ladderView(model, h)
                : h.div(
                    [h.Class('stack')],
                    [inventoryLensView(h), listView(model, h)],
                  ),
          model.atlasView === 'yours' ? h.empty : detailView(model, h),
        ],
      ),
      h.p(
        [h.Class('atlas-foot')],
        [
          `${catalogue.length} capabilities · ${servers.length} simulated servers · every model is a scripted stand-in · no upstream source pinned to a commit yet`,
        ],
      ),
    ],
  )
