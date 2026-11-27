import { Array, Option } from 'effect'
import { type Html, type HtmlBuilder } from 'foldkit/html'

import library from '../../specimens/library.json'
import {
  isModuleId,
  isNeighbourId,
  modules,
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
import {
  type CanvasNote,
  type MapInput,
  emptyMap,
  entryMap,
  mcpMapView,
} from './mcpmap.ts'
import { noteFor } from './module-notes.ts'
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

// A small fingerprint of what the README describes: the nine slots, lit
// where it has tools, and what those tools reach.
const fingerprintView = (entry: Entry, h: H): Html =>
  h.span(
    [
      h.Class('lib-print'),
      h.AriaLabel(
        `Described as: ${entry.slots.join(', ')}${entry.reaches.length > 0 ? `; reaches ${entry.reaches.map(id => (isNeighbourId(id) ? neighbourNames[id] : id)).join(', ')}` : ''}`,
      ),
    ],
    [
      h.span(
        [h.Class('lib-slots'), h.AriaHidden(true)],
        Array.map(modules, module =>
          lineIcon(
            slotIcons[module.id],
            `ic lib-ic place-${module.place} ${entry.slots.some(slot => isModuleId(slot) && slot === module.id) ? 'on' : 'off'}`,
            h,
          ),
        ),
      ),
      Array.match(
        entry.reaches.filter(id => isNeighbourId(id)),
        {
          onEmpty: () => h.empty,
          onNonEmpty: reaches =>
            h.span(
              [h.Class('lib-reach'), h.AriaHidden(true)],
              [
                h.span([h.Class('lib-arrow')], ['→']),
                ...Array.map(reaches, id =>
                  isNeighbourId(id)
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

const terrainBlocks = (h: H): ReadonlyArray<Html> =>
  Array.map(modules, module =>
    h.keyed('span')(module.id, [
      h.Class(`terrain-block place-${module.place}`),
    ]),
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

// THE LIBRARY AS ITS OWN PAGE
//
// The route again, told through real servers: a rail of mini cards beside
// the same workshop canvas the lab draws everywhere else. Picking a card
// draws that server — its slots lit, the rest ghosted — so a server that
// does one thing is read by what it does not do, and two servers can be
// compared by changing the selection.

export const entryId = (entry: Entry): string =>
  exampleId(entry.station, entry.kind, entry.name)

// What the building is called under the name. The kind is the only thing
// that separates entries sharing a station and a shape.
const kindCaptions: Record<Kind, string> = {
  popular: 'the most used',
  first: 'the first',
  weird: 'a weird one',
  breaking: 'almost breaks it',
}

export const kindOf = (entry: Entry): Kind =>
  kinds.find(value => value === entry.kind) ?? 'popular'

const shapeWords = (entry: Entry): string =>
  `${entry.slots.join(', ')}${
    entry.reaches.length > 0
      ? `; reaches ${entry.reaches
          .map(id => (isNeighbourId(id) ? neighbourNames[id] : id))
          .join(', ')}`
      : ''
  }`

const stationLabel = (station: string): string => {
  const step = route.find(entry => entry.station === station)
  return step === undefined ? station : stationNames[step.station]
}

// A server only a critter brings in is an Entry like any other: its card
// carries the same shape, so it draws and reads the same way.
export const critterEntry = (critter: Critter): Entry => ({
  station: critter.station,
  kind: critter.kind,
  name: critter.server,
  by: critter.by,
  url: critter.url,
  what: critter.what,
  why: '',
  slots: critter.slots,
  reaches: critter.reaches,
  evidence: critter.evidence,
})

export const ownEntriesFor = (station: string): ReadonlyArray<Entry> =>
  Array.map(
    ownEntryCritters.filter(critter => critter.station === station),
    critterEntry,
  )

const allEntries: ReadonlyArray<Entry> = [
  ...entries,
  ...Array.map(ownEntryCritters, critterEntry),
]

export const pickedEntry = (model: Model): Option.Option<Entry> =>
  Option.flatMap(model.maybeExample, id =>
    Option.fromNullishOr(allEntries.find(entry => entryId(entry) === id)),
  )

// A card shrunk to what the canvas cannot say: which of the four kinds it
// is, who made it, and the fingerprint. The prose moves to the panel under
// the drawing, so only the selected server carries its full text.
export const miniCardView = (entry: Entry, isPicked: boolean, h: H): Html => {
  const kind = kindOf(entry)
  const critter = critterForEntry(entry.station, entry.kind, entry.name)
  return h.keyed('button')(
    entryId(entry),
    [
      h.Type('button'),
      h.Id(entryId(entry)),
      h.Class(
        `lib-mini kind-${kind}${isPicked ? ' picked' : ''}${
          critter === undefined ? '' : ` crit-${critter.sprite}`
        }`,
      ),
      h.AriaPressed(isPicked ? 'true' : 'false'),
      h.AriaLabel(
        `${entry.name}, ${kindNames[kind]}. Described as: ${shapeWords(entry)}. Draw it in the workshop.`,
      ),
      h.OnClick(Message.SelectedExample({ id: entryId(entry) })),
    ],
    [
      h.span([h.Class(`lib-kind kind-${kind}`)], [kindNames[kind]]),
      h.b(
        [h.Class('lib-mini-name')],
        [critter === undefined ? h.empty : stickerView(critter, h), entry.name],
      ),
      entry.by === '' ? h.empty : h.span([h.Class('lib-by')], [entry.by]),
      fingerprintView(entry, h),
    ],
  )
}

export const exampleDetailView = (entry: Entry, h: H): Html => {
  const kind = kindOf(entry)
  const evidence = isEvidence(entry.evidence.kind)
    ? entry.evidence.kind
    : 'author'
  const critter = critterForEntry(entry.station, entry.kind, entry.name)
  return h.div(
    [
      h.Class(
        `lib-detail kind-${kind}${critter === undefined ? '' : ` crit-${critter.sprite}`}`,
      ),
    ],
    [
      h.div(
        [h.Class('lib-top')],
        [
          h.span([h.Class(`lib-kind kind-${kind}`)], [kindNames[kind]]),
          h.span([h.Class('tb-note')], [stationLabel(entry.station)]),
          h.span(
            [h.Class(`lib-ev ev-${evidence}`), h.Title(entry.evidence.note)],
            [evidenceNames[evidence]],
          ),
        ],
      ),
      h.h3(
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
      critter === undefined ? h.empty : critterArtView(critter, h),
      critter === undefined ? h.empty : critterMetersView(critter, h),
      h.details(
        [h.Class('lib-note')],
        [h.summary([], ['Evidence']), h.p([], [entry.evidence.note])],
      ),
    ],
  )
}

const emptyDetailView = (h: H): Html =>
  h.div(
    [h.Class('lib-detail empty')],
    [
      h.p(
        [h.Class('lib-what')],
        [
          'Pick a server to draw it. Every one is drawn as the same building, with only the slots its own card names lit — so what the card does not name is part of the picture.',
        ],
      ),
    ],
  )

const stageCanvasView = (model: Model, h: H): Html => {
  const picked = pickedEntry(model)
  return h.div(
    [h.Class('lib-canvas-col')],
    [
      h.p(
        [h.Class('lib-said'), h.AriaLive('polite')],
        [
          Option.match(picked, {
            onNone: () => 'No server picked yet.',
            onSome: entry =>
              `Drawing ${entry.name}, ${kindCaptions[kindOf(entry)]}: described as ${shapeWords(entry)}.`,
          }),
        ],
      ),
      Option.match(picked, {
        onNone: () => mcpMapView(emptyMap(), h, model.canvasFull),
        onSome: entry =>
          mcpMapView(
            exampleMapOf(entry, model.maybeModule),
            h,
            model.canvasFull,
            undefined,
            moduleNoteOf(model, entry, h),
          ),
      }),
      Option.match(picked, {
        onNone: () => emptyDetailView(h),
        onSome: entry => exampleDetailView(entry, h),
      }),
    ],
  )
}

const railStationView = (
  model: Model,
  step: (typeof route)[number],
  h: H,
): Html =>
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
              h.OnClick(Message.SelectedStation({ station: step.station })),
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
        [h.Class('lib-minis')],
        [
          ...Array.map(entriesFor(step.station), entry =>
            miniCardView(
              entry,
              Option.contains(model.maybeExample, entryId(entry)),
              h,
            ),
          ),
          ...Array.map(ownEntriesFor(step.station), entry =>
            miniCardView(
              entry,
              Option.contains(model.maybeExample, entryId(entry)),
              h,
            ),
          ),
        ],
      ),
    ],
  )

// The bench shows the step's own server until an example of THAT step is
// picked, so a selection made on the library page does not follow you onto
// an unrelated bench.
export const pickedEntryHere = (model: Model): Option.Option<Entry> =>
  Option.filter(pickedEntry(model), entry => entry.station === model.station)

export const exampleMapOf = (
  entry: Entry,
  openModule: Option.Option<string> = Option.none(),
): MapInput =>
  entryMap({ ...entry, subtitle: kindCaptions[kindOf(entry)] }, openModule)

// The card pinned to an opened slot. A researched note if there is one for
// this server and this slot, otherwise the card's own words, labelled so
// the difference is visible rather than smoothed over.
export const moduleNoteOf = (
  model: Model,
  entry: Entry,
  h: H,
): CanvasNote | undefined => {
  const slot = Option.getOrUndefined(
    Option.filter(model.maybeModule, isModuleId),
  )
  // The full window already shows the whole note in the bubble itself.
  if (
    model.canvasFull ||
    slot === undefined ||
    !entry.slots.some(value => value === slot)
  ) {
    return undefined
  }
  const module = modules.find(value => value.id === slot)
  const found = noteFor(entry.station, entry.kind, entry.name, slot)
  return {
    slot,
    body: h.div(
      [h.Class('ws-note-body'), h.Role('note')],
      [
        h.div(
          [h.Class('ws-note-top')],
          [
            lineIcon(slotIcons[slot], `ic lib-ic place-${module?.place}`, h),
            h.b([], [module?.word ?? slot]),
            h.button(
              [
                h.Type('button'),
                h.Class('ws-note-close'),
                h.AriaLabel('Close this note'),
                h.OnClick(Message.ClosedModule()),
              ],
              ['×'],
            ),
          ],
        ),
        Option.match(found, {
          onNone: () => h.p([], [entry.what]),
          onSome: note => h.p([], [note.note]),
        }),
        Option.match(found, {
          onNone: () =>
            h.p(
              [h.Class('ws-note-src')],
              ['From this server’s card. No note yet for this slot.'],
            ),
          onSome: note =>
            h.p(
              [h.Class('ws-note-src'), h.Title(note.evidenceNote)],
              [
                evidenceNames[
                  isEvidence(note.evidenceKind) ? note.evidenceKind : 'author'
                ],
                ' · ',
                note.evidenceNote,
              ],
            ),
        }),
      ],
    ),
  }
}

// This step's real servers, as a rail beside the drawing.
export const exampleRailView = (model: Model, h: H): Html =>
  Array.match(entriesFor(model.station), {
    onEmpty: () => h.empty,
    onNonEmpty: found =>
      h.div(
        [h.Class('tb-rail'), h.AriaLabel('Real servers like this step')],
        [
          h.span([h.Class('eyebrow')], ['Out in the world']),
          h.p(
            [h.Class('tb-note')],
            [
              'Real servers like this step. Pick one and the drawing becomes that server, as its own page describes it.',
            ],
          ),
          ...Array.map(found, entry =>
            miniCardView(
              entry,
              Option.contains(model.maybeExample, entryId(entry)),
              h,
            ),
          ),
          ...Array.map(ownEntriesFor(model.station), entry =>
            miniCardView(
              entry,
              Option.contains(model.maybeExample, entryId(entry)),
              h,
            ),
          ),
          Option.match(pickedEntryHere(model), {
            onNone: () => h.empty,
            onSome: () =>
              h.button(
                [
                  h.Type('button'),
                  h.Class('pop-btn plain tb-rail-back'),
                  h.OnClick(Message.ClearedExample()),
                ],
                ['Back to this step’s server'],
              ),
          }),
        ],
      ),
  })

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
              'The route again, told through servers people actually use. For every step: the one most people meet, the one it started with, a weird one, and one that stretches the idea until it almost breaks. Pick any of them and it is drawn as the same workshop, so you can read them against each other.',
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
      h.div(
        [h.Class('lib-stage')],
        [
          stageCanvasView(model, h),
          h.section(
            [h.Class('lib-rail'), h.AriaLabel('The servers, step by step')],
            Array.map(route, step => railStationView(model, step, h)),
          ),
        ],
      ),
    ],
  )
