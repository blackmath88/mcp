import { Array, Option, pipe } from 'effect'
import { type Html, type HtmlBuilder } from 'foldkit/html'

import {
  type Capability,
  type CapabilityName,
  type Family,
  catalogue,
  families,
} from '../domain/capabilities.ts'
import { ladder } from '../domain/ladder.ts'
import { listedFromCatalogue, profile } from '../domain/lens.ts'
import {
  BELT_SLOTS,
  beltOf,
  calledTools,
  findCapability,
  isAdvertisedNow,
} from './belt.ts'
import { iconView } from './icons.ts'
import { Message } from './message.ts'
import type { Model, Station } from './model.ts'
import { serverNames, stationNames } from './names.ts'

type H = HtmlBuilder<Message>

// LAYOUT
//
// A hand-made arrangement. Ground groups capabilities by what they do.
// Position carries no measurement: nothing here is a similarity score.

const WIDTH = 1200
const HEIGHT = 584
const CELL = 92
const TILE = 84

type Neighbourhood = Readonly<{
  id: string
  name: string
  x: number
  width: number
}>

const neighbourhoods: ReadonlyArray<Neighbourhood> = [
  { id: 'look', name: 'Read and perceive', x: 20, width: 324 },
  { id: 'keep', name: 'Remember and change', x: 372, width: 404 },
  { id: 'make', name: 'Compose and delegate', x: 796, width: 392 },
]

type Plot = Readonly<{
  family: Family
  neighbourhood: string
  x: number
  y: number
  columns: number
}>

const plots: ReadonlyArray<Plot> = [
  { family: 'read', neighbourhood: 'look', x: 40, y: 84, columns: 3 },
  { family: 'query', neighbourhood: 'look', x: 40, y: 264, columns: 3 },
  { family: 'perceive', neighbourhood: 'look', x: 40, y: 444, columns: 3 },
  { family: 'remember', neighbourhood: 'keep', x: 392, y: 84, columns: 2 },
  { family: 'app', neighbourhood: 'keep', x: 640, y: 84, columns: 1 },
  { family: 'change', neighbourhood: 'keep', x: 392, y: 264, columns: 4 },
  { family: 'compose', neighbourhood: 'make', x: 812, y: 84, columns: 4 },
  { family: 'delegate', neighbourhood: 'make', x: 812, y: 264, columns: 3 },
  { family: 'workflow', neighbourhood: 'make', x: 812, y: 444, columns: 2 },
  { family: 'gateway', neighbourhood: 'make', x: 1004, y: 444, columns: 2 },
]

const plotsIn = (neighbourhood: string): ReadonlyArray<Plot> =>
  Array.filter(plots, plot => plot.neighbourhood === neighbourhood)

type Placed = Readonly<{ capability: Capability; x: number; y: number }>

const inFamily = (family: Family): ReadonlyArray<Capability> =>
  Array.filter(catalogue, capability => capability.family === family)

const placedIn = (plot: Plot): ReadonlyArray<Placed> =>
  Array.map(inFamily(plot.family), (capability, index) => ({
    capability,
    x: plot.x + (index % plot.columns) * CELL,
    y: plot.y + Math.floor(index / plot.columns) * CELL,
  }))

const placed: ReadonlyArray<Placed> = Array.flatMap(plots, placedIn)

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

const neighbourhoodOf = (family: Family): string =>
  pipe(
    plots,
    Array.findFirst(plot => plot.family === family),
    Option.flatMap(plot =>
      Array.findFirst(neighbourhoods, entry => entry.id === plot.neighbourhood),
    ),
    Option.match({ onNone: () => '', onSome: entry => entry.name }),
  )

export const placeOnAtlas = (capability: Capability): string =>
  `${neighbourhoodOf(capability.family)} › ${familyName(capability.family)}`

const percent = (value: number, of: number): string =>
  `${((value / of) * 100).toFixed(3)}%`

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

// ATLAS MAP

const tileView = (
  model: Model,
  entry: Placed,
  called: ReadonlyArray<CapabilityName>,
  h: H,
): Html => {
  const capability = entry.capability
  const maybeSelected = selectedCapability(model)
  const isSelected = Option.contains(model.maybeSelected, capability.name)
  const isKin =
    !isSelected &&
    Option.exists(
      maybeSelected,
      selected => selected.specimen === capability.specimen,
    )
  const wasCalled = called.includes(capability.name)
  return h.button(
    [
      h.Type('button'),
      h.Class(`obj ${isKin ? 'kin' : ''} ${wasCalled ? 'called' : ''}`),
      h.Style({
        left: percent(entry.x, WIDTH),
        top: percent(entry.y, HEIGHT),
        width: percent(TILE, WIDTH),
      }),
      h.AriaPressed(isSelected ? 'true' : 'false'),
      h.AriaLabel(
        `${capability.title}, ${familyName(capability.family)}, exposed by the ${serverNames[capability.specimen]}${wasCalled ? ', called in this tab' : ''}`,
      ),
      h.OnClick(Message.SelectedCapability({ name: capability.name })),
    ],
    [
      iconView(capability.name, h),
      h.span([h.Class('obj-name')], [capability.title]),
      model.lens === 'server'
        ? h.span([h.Class('obj-sub')], [serverNames[capability.specimen]])
        : h.empty,
      wasCalled
        ? h.span([h.Class('obj-mark'), h.AriaHidden(true)], ['called'])
        : h.empty,
    ],
  )
}

const centre = (entry: Placed): Readonly<{ x: number; y: number }> => ({
  x: entry.x + TILE / 2,
  y: entry.y + 26,
})

const linksFor = (
  station: Station,
): ReadonlyArray<readonly [Placed, Placed]> => {
  const members = Array.filter(
    placed,
    entry => entry.capability.specimen === station,
  )
  return Array.zip(members, members.slice(1))
}

const groundView = (model: Model, h: H): Html => {
  const maybeSelected = selectedCapability(model)
  // Only the selected tool's server is drawn. Every server at once is a
  // hairball; the server lens names the server under each object instead.
  const linked: ReadonlyArray<Station> = Option.match(maybeSelected, {
    onNone: () => [],
    onSome: selected => [selected.specimen],
  })
  return h.svg(
    [
      h.Class('ground'),
      h.ViewBox(`0 0 ${WIDTH} ${HEIGHT}`),
      h.PreserveAspectRatio('none'),
      h.AriaHidden(true),
    ],
    [
      ...Array.map(neighbourhoods, entry =>
        h.rect([
          h.Class('region'),
          h.X(String(entry.x)),
          h.Y('16'),
          h.Width(String(entry.width)),
          h.Height(String(HEIGHT - 32)),
          h.Rx('14'),
        ]),
      ),
      ...Array.flatMap(linked, station =>
        Array.map(linksFor(station), ([from, to]) =>
          h.line([
            h.Class(
              `link ${Option.exists(maybeSelected, selected => selected.specimen === station) ? 'on' : ''}`,
            ),
            h.X1(String(centre(from).x)),
            h.Y1(String(centre(from).y)),
            h.X2(String(centre(to).x)),
            h.Y2(String(centre(to).y)),
          ]),
        ),
      ),
    ],
  )
}

const mapView = (model: Model, h: H): Html => {
  const called = calledTools(model.frames)
  return h.div(
    [h.Class('atlas-wrap')],
    [
      h.div(
        [h.Class('atlas')],
        [
          groundView(model, h),
          ...Array.map(neighbourhoods, entry =>
            h.keyed('section')(
              entry.id,
              [h.Class('hood'), h.AriaLabel(entry.name)],
              [
                h.h2(
                  [
                    h.Class('hood-name'),
                    h.Style({
                      left: percent(entry.x + 18, WIDTH),
                      top: percent(28, HEIGHT),
                    }),
                  ],
                  [entry.name],
                ),
                ...Array.flatMap(plotsIn(entry.id), plot => [
                  h.h3(
                    [
                      h.Class('plot-name'),
                      h.Style({
                        left: percent(plot.x + 2, WIDTH),
                        top: percent(plot.y - 22, HEIGHT),
                      }),
                    ],
                    [familyName(plot.family)],
                  ),
                  h.div(
                    [h.Class('plot')],
                    Array.map(placedIn(plot), item =>
                      tileView(model, item, called, h),
                    ),
                  ),
                ]),
              ],
            ),
          ),
        ],
      ),
    ],
  )
}

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

// THE THIRTEEN QUESTIONS (optional: an index, not an order)

const ladderView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('stack')],
    [
      h.p(
        [h.Class('mode')],
        [
          h.b([], ['Thirteen distinctions']),
          ' · each is one question the lab lets you ask, with the tools that answer it. An index for the curious, not an order to follow. A tool can sit under several.',
        ],
      ),
      h.ol(
        [h.Class('ladder')],
        Array.map(ladder, rung =>
          h.keyed('li')(
            `${rung.step}`,
            [h.Class('rungrow')],
            [
              h.span([h.Class('rung-n')], [`${rung.step}`]),
              h.div(
                [],
                [
                  h.b([], [rung.name]),
                  h.p([h.Class('rung-d')], [rung.distinction]),
                ],
              ),
              h.div(
                [h.Class('chiprow')],
                Array.flatMap(rung.capabilities, name =>
                  Option.match(findCapability(name), {
                    onNone: () => [],
                    onSome: capability => [toolChip(model, capability, h)],
                  }),
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
            'Each object is one thing a server can hand over. Pick any of them; there is no order.',
          ],
        ),
        h.p(
          [],
          [
            'The ground groups objects by what they do. These groups are this lab’s teaching aid, not categories of the protocol. Where an object sits is a hand-made arrangement; distance measures nothing.',
          ],
        ),
        h.p(
          [],
          [
            'A server is not a place. Select an object and lines show what else the same server exposes, often across the ground.',
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
              h.p([h.Class('kicker')], ['Capability atlas']),
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
                  ['ladder', 'Thirteen questions'],
                ],
                view => Message.SelectedAtlasView({ view }),
                h,
              ),
              model.atlasView === 'map'
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
        [h.Class('primer')],
        [
          h.div(
            [h.Class('primer-cards')],
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
            ],
          ),
          h.div(
            [h.Class('primer-doors')],
            [
              h.button(
                [
                  h.Type('button'),
                  h.Class('btn'),
                  h.OnClick(Message.ClickedOpenSpecimen({ name: 'remember' })),
                ],
                ['First time? Open the Memory bench'],
              ),
              h.button(
                [
                  h.Type('button'),
                  h.Class('btn ghost'),
                  h.OnClick(Message.ClickedNerdEntry()),
                ],
                ['Straight to the wire: raw JSON-RPC'],
              ),
            ],
          ),
        ],
      ),
      h.div(
        [h.Class('atlas-body')],
        [
          model.atlasView === 'map'
            ? mapView(model, h)
            : model.atlasView === 'ladder'
              ? ladderView(model, h)
              : h.div(
                  [h.Class('stack')],
                  [inventoryLensView(h), listView(model, h)],
                ),
          detailView(model, h),
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

// BELT

const sourceText = (source: 'server' | 'catalogue'): string =>
  source === 'server'
    ? 'its answer to tools/list, just now'
    : 'per the lab’s catalogue · the server has not been asked'

export const beltView = (model: Model, h: H): Html => {
  const belt = beltOf(model)
  const called = calledTools(model.frames)
  const shown = belt.tools.slice(0, BELT_SLOTS)
  const hidden = belt.tools.length - shown.length
  const maybeSelected = pipe(
    selectedCapability(model),
    Option.filter(capability =>
      belt.tools.some(tool => tool.name === capability.name),
    ),
  )
  return h.section(
    [h.Class('belt'), h.AriaLabel('Tool belt')],
    [
      h.div(
        [h.Class('belt-owner')],
        Option.match(belt.owner, {
          onNone: () => [
            h.b([], ['Tool belt']),
            h.span(
              [],
              ['Select something and its server’s tools appear here.'],
            ),
          ],
          onSome: station => [
            h.b([], [`Exposed by the ${serverNames[station]}`]),
            h.span([], [sourceText(belt.source)]),
          ],
        }),
      ),
      h.div(
        [h.Class('belt-slots'), h.Role('group'), h.AriaLabel('Slots')],
        [
          ...Array.map(shown, (capability, index) =>
            h.button(
              [
                h.Type('button'),
                h.Class(
                  `slot ${called.includes(capability.name) ? 'called' : ''}`,
                ),
                h.AriaPressed(
                  Option.contains(model.maybeSelected, capability.name)
                    ? 'true'
                    : 'false',
                ),
                h.AriaLabel(
                  `Slot ${index + 1}: ${capability.title}. Select to inspect.`,
                ),
                h.OnClick(
                  Message.SelectedCapability({ name: capability.name }),
                ),
              ],
              [
                h.span(
                  [h.Class('slot-key'), h.AriaHidden(true)],
                  [`${index + 1}`],
                ),
                iconView(capability.name, h),
                called.includes(capability.name)
                  ? h.span(
                      [h.Class('slot-mark'), h.AriaHidden(true)],
                      ['called'],
                    )
                  : h.empty,
              ],
            ),
          ),
          hidden > 0
            ? h.button(
                [
                  h.Type('button'),
                  h.Class('slot more'),
                  h.OnClick(Message.ClickedOpenInventory()),
                ],
                [`+${hidden} more`],
              )
            : h.empty,
        ],
      ),
      h.p(
        [h.Class('belt-selected'), h.AriaLive('polite')],
        Option.match(maybeSelected, {
          onNone: () => [
            h.span(
              [],
              [
                Array.isReadonlyArrayEmpty(shown)
                  ? ''
                  : 'Press 1 to 9 or click a slot to inspect it. Selecting never runs anything.',
              ],
            ),
          ],
          onSome: capability => [
            h.b([], [capability.title]),
            h.span([], [capability.description]),
          ],
        }),
      ),
      h.button(
        [
          h.Type('button'),
          h.Class('btn ghost small'),
          h.OnClick(Message.ClickedOpenInventory()),
        ],
        [`Full inventory (${catalogue.length})`],
      ),
    ],
  )
}
