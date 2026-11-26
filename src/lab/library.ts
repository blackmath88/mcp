import { Array } from 'effect'
import { type Html, type HtmlBuilder } from 'foldkit/html'

import library from '../../specimens/library.json'
import {
  type ModuleId,
  type NeighbourId,
  modules,
  neighbourIds,
  neighbourNames,
} from '../domain/modules.ts'
import {
  type Critter,
  critterForEntry,
  crittersForStation,
  exampleId,
  ownEntryCritters,
} from './critters/catalog.ts'
import { lineIcon, neighbourIcons, slotIcons } from './icons.ts'
import { Message } from './message.ts'
import type { Model, Station } from './model.ts'
import { stationNames } from './names.ts'
import { route, stepNumber } from './story.ts'

type H = HtmlBuilder<Message>

// OUT IN THE WORLD
//
// The second narrative: for every station, real servers of four kinds, the
// most used, the first, a weird one and one that almost breaks the station's
// idea. Nothing here was installed or run by the lab; every card says what
// its evidence is.

type Kind = 'popular' | 'first' | 'weird' | 'breaking'
type EvidenceKind = 'checked' | 'research' | 'author'

type Entry = Readonly<{
  station: string
  kind: string
  name: string
  by: string
  url: string
  what: string
  why: string
  slots: ReadonlyArray<string>
  reaches: ReadonlyArray<string>
  evidence: Readonly<{ kind: string; note: string }>
}>

const kinds: ReadonlyArray<Kind> = ['popular', 'first', 'weird', 'breaking']

const kindNames: Record<Kind, string> = {
  popular: 'Most used',
  first: 'First',
  weird: 'Weird',
  breaking: 'Almost breaks it',
}

const evidenceNames: Record<EvidenceKind, string> = {
  checked: 'Checked',
  research: 'From research',
  author: 'Not checked',
}

const isEvidence = (value: string): value is EvidenceKind =>
  value === 'checked' || value === 'research' || value === 'author'

const entries: ReadonlyArray<Entry> = library.entries

export const entriesFor = (station: Station): ReadonlyArray<Entry> =>
  Array.flatMap(kinds, kind =>
    entries.filter(entry => entry.station === station && entry.kind === kind),
  )

const isSlot = (value: string): value is ModuleId =>
  modules.some(module => module.id === value)

const isNeighbour = (value: string): value is NeighbourId =>
  neighbourIds.some(id => id === value)

// A small fingerprint of what the README describes: the nine slots, lit
// where it has tools, and what those tools reach.
const fingerprintView = (entry: Entry, h: H): Html =>
  h.div(
    [
      h.Class('lib-print'),
      h.AriaLabel(
        `Described as: ${entry.slots.join(', ')}${entry.reaches.length > 0 ? `; reaches ${entry.reaches.map(id => (isNeighbour(id) ? neighbourNames[id] : id)).join(', ')}` : ''}`,
      ),
    ],
    [
      h.span(
        [h.Class('lib-slots'), h.AriaHidden(true)],
        Array.map(modules, module =>
          lineIcon(
            slotIcons[module.id],
            `ic lib-ic place-${module.place} ${entry.slots.some(slot => isSlot(slot) && slot === module.id) ? 'on' : 'off'}`,
            h,
          ),
        ),
      ),
      Array.match(
        entry.reaches.filter(id => isNeighbour(id)),
        {
          onEmpty: () => h.empty,
          onNonEmpty: reaches =>
            h.span(
              [h.Class('lib-reach'), h.AriaHidden(true)],
              [
                h.span([h.Class('lib-arrow')], ['→']),
                ...Array.map(reaches, id =>
                  isNeighbour(id)
                    ? lineIcon(neighbourIcons[id], 'ic lib-ic nb', h)
                    : h.empty,
                ),
              ],
            ),
        },
      ),
    ],
  )

// THE MENAGERIE ON A CARD
//
// A card whose server has a critter gets its art: a pale mosaic in the
// critter's hue with the critter drawn huge and cropped, a sticker by the
// name, and two meters. The pixels come from CSS custom properties that the
// walker installs; the view only names them.

const pipsView = (label: string, value: number, kind: string, h: H): Html =>
  h.div(
    [h.Class('crit-meter')],
    [
      h.span([], [label]),
      h.span(
        [h.Class(`crit-pips pip-${kind}`), h.AriaLabel(`${value} of 4`)],
        Array.map([0, 1, 2, 3], index =>
          h.i([h.Class(index < value ? 'on' : '')], []),
        ),
      ),
    ],
  )

const critterArtView = (critter: Critter, h: H): Html =>
  h.div(
    [
      h.Class('crit-art'),
      h.AriaHidden(true),
      h.DataAttribute('perch', ''),
      h.DataAttribute('magnet', ''),
    ],
    [
      h.div(
        [h.Class('crit-title')],
        [h.b([], [critter.name]), h.span([], [`“${critter.says}”`])],
      ),
    ],
  )

const critterMetersView = (critter: Critter, h: H): Html =>
  h.div(
    [h.Class('crit-meters')],
    [
      pipsView('Weirdness', critter.weird, 'weird', h),
      pipsView('Breaks the idea', critter.breaks, 'breaks', h),
    ],
  )

export const stickerView = (critter: Critter, h: H): Html =>
  h.span(
    [h.Class(`crit-sticker crit-${critter.sprite}`), h.AriaHidden(true)],
    [],
  )

// Servers that only a critter brings in (not one of the four kinds of the
// library itself) get a card of their own under their station.
const ownCardView = (critter: Critter, h: H): Html =>
  h.keyed('article')(
    `critter-${critter.id}`,
    [
      h.Id(exampleId(critter.station, critter.kind, critter.server)),
      h.Class(`lib-card kind-weird has-critter crit-${critter.sprite}`),
    ],
    [
      critterArtView(critter, h),
      h.div(
        [h.Class('lib-top')],
        [
          h.span([h.Class('lib-kind kind-weird')], ['Weird, too']),
          h.span(
            [
              h.Class(`lib-ev ev-${ownEvidence(critter)}`),
              h.Title(critter.evidence.note),
            ],
            [evidenceNames[ownEvidence(critter)]],
          ),
        ],
      ),
      h.h4(
        [h.Class('lib-name')],
        [
          stickerView(critter, h),
          h.a(
            [h.Href(critter.url), h.Target('_blank'), h.Rel('noreferrer')],
            [critter.server],
          ),
        ],
      ),
      h.p([h.Class('lib-by')], [critter.by]),
      h.p([h.Class('lib-what')], [critter.what]),
      critterMetersView(critter, h),
      h.details(
        [h.Class('lib-note')],
        [h.summary([], ['Evidence']), h.p([], [critter.evidence.note])],
      ),
    ],
  )

const ownEvidence = (critter: Critter): EvidenceKind =>
  isEvidence(critter.evidence.kind) ? critter.evidence.kind : 'author'

const extraCards = (station: string, h: H): ReadonlyArray<Html> =>
  Array.map(
    ownEntryCritters.filter(critter => critter.station === station),
    critter => ownCardView(critter, h),
  )

const cardView = (entry: Entry, h: H): Html => {
  const kind = kinds.find(value => value === entry.kind) ?? 'popular'
  const evidence = isEvidence(entry.evidence.kind)
    ? entry.evidence.kind
    : 'author'
  const critter = critterForEntry(entry.station, entry.kind, entry.name)
  return h.keyed('article')(
    `${entry.station}-${entry.kind}-${entry.name}`,
    [
      h.Id(exampleId(entry.station, entry.kind, entry.name)),
      h.Class(
        `lib-card kind-${kind}${critter === undefined ? '' : ` has-critter crit-${critter.sprite}`}`,
      ),
    ],
    [
      critter === undefined ? h.empty : critterArtView(critter, h),
      h.div(
        [h.Class('lib-top')],
        [
          h.span([h.Class(`lib-kind kind-${kind}`)], [kindNames[kind]]),
          h.span(
            [h.Class(`lib-ev ev-${evidence}`), h.Title(entry.evidence.note)],
            [evidenceNames[evidence]],
          ),
        ],
      ),
      h.h4(
        [h.Class('lib-name')],
        [
          critter === undefined ? h.empty : stickerView(critter, h),
          entry.url === ''
            ? entry.name
            : h.a(
                [h.Href(entry.url), h.Target('_blank'), h.Rel('noreferrer')],
                [entry.name],
              ),
        ],
      ),
      entry.by === '' ? h.empty : h.p([h.Class('lib-by')], [entry.by]),
      h.p([h.Class('lib-what')], [entry.what]),
      h.p([h.Class('lib-why')], [entry.why]),
      critter === undefined ? h.empty : critterMetersView(critter, h),
      fingerprintView(entry, h),
      h.details(
        [h.Class('lib-note')],
        [h.summary([], ['Evidence']), h.p([], [entry.evidence.note])],
      ),
    ],
  )
}

const terrainBlocks = (h: H): ReadonlyArray<Html> =>
  Array.map(modules, module =>
    h.keyed('span')(module.id, [h.Class(`terrain-block place-${module.place}`)]),
  )

const groundClass = (where: string): string =>
  `pixel-ground${where === '' ? '' : ` ground-${where}`}`

// Ground for the critters: nine solid blocks in the slot colours with a
// crumbling underside. Empty space above it is the stage they walk on.
export const groundView = (h: H, where = ''): Html =>
  h.div(
    [
      h.Class(groundClass(where)),
      h.AriaHidden(true),
      h.DataAttribute('perch', '3'),
      h.DataAttribute('perch-steps', ''),
    ],
    terrainBlocks(h),
  )

// The same strip with nothing standing on it, for a page whose critters live
// on a shelf elsewhere.
export const groundSceneryView = (h: H, where = ''): Html =>
  h.div([h.Class(groundClass(where)), h.AriaHidden(true)], terrainBlocks(h))

// The landing's only perch. Wide enough for two columns it is a ledge in the
// empty top-right corner, so the critters are in the first view instead of
// under a column taller than the window; once the page is one column it drops
// back into the flow and the scenery strip above it gives way.
export const critterShelfView = (h: H): Html =>
  h.div(
    [
      h.Class('pixel-ground critter-shelf'),
      h.AriaHidden(true),
      h.DataAttribute('perch', '5'),
      h.DataAttribute('perch-steps', ''),
      h.DataAttribute('magnet', ''),
    ],
    terrainBlocks(h),
  )

type Tile = Readonly<{ id: string; kind: Kind; label: string; name: string }>

const tilesFor = (station: Station): ReadonlyArray<Tile> => [
  ...Array.map(entriesFor(station), entry => {
    const kind = kinds.find(value => value === entry.kind) ?? 'popular'
    return {
      id: exampleId(entry.station, entry.kind, entry.name),
      kind,
      label: kindNames[kind],
      name: entry.name,
    }
  }),
  ...Array.map(
    ownEntryCritters.filter(critter => critter.station === station),
    critter => ({
      id: exampleId(critter.station, critter.kind, critter.server),
      kind: 'weird' as const,
      label: 'Weird, too',
      name: critter.server,
    }),
  ),
]

// Near the top of every step: the real servers of this step as solid colour
// tiles. Their tops are the critters' ground; a tap scrolls to the full card.
export const examplesRowView = (station: Station, h: H): Html =>
  Array.match(tilesFor(station), {
    onEmpty: () => h.empty,
    onNonEmpty: tiles =>
      h.section(
        [
          h.Class('ex-row'),
          h.DataAttribute('station', station),
          h.AriaLabel('Out in the world, this step'),
        ],
        [
          h.div(
            [
              h.Class('ex-tiles'),
              h.DataAttribute('perch', '3'),
              h.DataAttribute('perch-steps', ''),
            ],
            Array.map(tiles, tile =>
              h.keyed('button')(
                tile.id,
                [
                  h.Type('button'),
                  h.Class(`ex-tile kind-${tile.kind}`),
                  h.DataAttribute('ex-target', tile.id),
                  h.DataAttribute('ex-kind', tile.label),
                  h.DataAttribute('ex-name', tile.name),
                ],
                [
                  h.span([h.Class('ex-kind')], [tile.label]),
                  h.b([h.Class('ex-name')], [tile.name]),
                ],
              ),
            ),
          ),
          h.p(
            [h.Class('ex-caption')],
            [
              h.b([], ['Out in the world']),
              ' · real servers like this step. Tap one for its card further down, or tap a critter.',
            ],
          ),
        ],
      ),
  })

// A thin row of pixel squares in the slot colours. Ornament only: it sits
// above or below text, never behind it.
export const pixelBandView = (h: H): Html =>
  h.div([h.Class('pixel-band'), h.AriaHidden(true)], [])

// The walker owns the critters; this switch only carries a marker it
// listens for. Which label shows follows the root's data-critters.
export const critterToggleView = (h: H): Html =>
  h.button(
    [
      h.Type('button'),
      h.Class('pop-btn plain critter-toggle'),
      h.DataAttribute('critter-toggle', ''),
    ],
    [
      h.span([h.Class('when-on')], ['Hide the critters']),
      h.span([h.Class('when-off')], ['Let the critters out']),
    ],
  )

// Under the toolbench: the weird ones of this step, one tap from the shelf.
export const neighboursView = (station: Station, h: H): Html =>
  Array.match(crittersForStation(station), {
    onEmpty: () => h.empty,
    onNonEmpty: found =>
      h.div(
        [h.Class('crit-neighbours'), h.AriaLabel('Weird neighbours')],
        [
          h.span([h.Class('eyebrow')], ['Weird neighbours']),
          ...Array.map(found, critter =>
            h.a(
              [
                h.Href('#out-in-the-world'),
                h.Class('crit-chip'),
                h.DataAttribute('perch', ''),
                h.DataAttribute('magnet', ''),
              ],
              [
                stickerView(critter, h),
                h.span([], [critter.server]),
                h.small(
                  [],
                  [critter.kind === 'breaking' ? 'almost breaks it' : 'weird'],
                ),
              ],
            ),
          ),
        ],
      ),
  })

// On each bench, under the workbench.
export const shelfView = (station: Station, h: H): Html =>
  Array.match(entriesFor(station), {
    onEmpty: () => h.empty,
    onNonEmpty: found =>
      h.section(
        [
          h.Class('lib-shelf'),
          h.Id('out-in-the-world'),
          h.AriaLabel('Out in the world'),
        ],
        [
          h.div(
            [h.Class('lib-head')],
            [
              h.h3([], ['Out in the world']),
              h.p(
                [h.Class('tb-note')],
                [
                  'Real servers like this one: the most used, the first, a weird one, and one that almost breaks the idea. The lab did not install or run them; each card says what its evidence is.',
                ],
              ),
              h.button(
                [
                  h.Type('button'),
                  h.Class('pop-btn plain'),
                  h.OnClick(Message.ClickedLibrary()),
                ],
                ['The whole library'],
              ),
            ],
          ),
          h.div(
            [h.Class('lib-grid')],
            [
              ...Array.map(found, entry => cardView(entry, h)),
              ...extraCards(station, h),
            ],
          ),
        ],
      ),
  })

// The library as its own page: the route again, told through real servers.
export const libraryScreenView = (model: Model, h: H): Html =>
  h.main(
    [h.Class('library'), h.AriaLabel('Out in the world')],
    [
      h.div(
        [h.Class('lib-intro')],
        [
          pixelBandView(h),
          h.p([h.Class('kicker')], ['Out in the world']),
          h.h1([h.Class('home-title')], ['The real servers behind each step']),
          h.p(
            [h.Class('intro-lede')],
            [
              'The route again, told through servers people actually use. For every step: the one most people meet, the one it started with, a weird one, and one that stretches the idea until it almost breaks.',
            ],
          ),
          h.div(
            [h.Class('lib-legend')],
            [
              ...Array.map(kinds, kind =>
                h.span([h.Class(`lib-kind kind-${kind}`)], [kindNames[kind]]),
              ),
              h.span([h.Class('lib-sep')], []),
              h.span([h.Class('lib-ev ev-checked')], ['Checked']),
              h.span([h.Class('tb-note')], ['confirmed in this session']),
              h.span([h.Class('lib-ev ev-research')], ['From research']),
              h.span([h.Class('tb-note')], ['owner research, not verified']),
              h.span([h.Class('lib-ev ev-author')], ['Not checked']),
              h.span([h.Class('tb-note')], ['named from knowledge']),
            ],
          ),
          h.p([h.Class('tb-note')], [library.about]),
          critterToggleView(h),
          groundView(h, 'page'),
        ],
      ),
      ...Array.map(route, step =>
        h.keyed('section')(
          step.station,
          [h.Class('lib-station')],
          [
            h.div(
              [h.Class('lib-station-head')],
              [
                h.span([h.Class('nav-n')], [stepNumber(step.station)]),
                h.h2([], [stationNames[step.station]]),
                h.button(
                  [
                    h.Type('button'),
                    h.Class('pop-btn plain'),
                    h.AriaLabel(`Open step ${stepNumber(step.station)}`),
                    h.OnClick(
                      Message.SelectedStation({ station: step.station }),
                    ),
                  ],
                  [
                    model.station === step.station && model.screen === 'bench'
                      ? 'Back to this step'
                      : 'Open this step',
                  ],
                ),
              ],
            ),
            h.p([h.Class('lib-idea')], [step.idea]),
            h.div(
              [h.Class('lib-grid')],
              [
                ...Array.map(entriesFor(step.station), entry =>
                  cardView(entry, h),
                ),
                ...extraCards(step.station, h),
              ],
            ),
          ],
        ),
      ),
    ],
  )
