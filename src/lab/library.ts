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

const cardView = (entry: Entry, h: H): Html => {
  const kind = kinds.find(value => value === entry.kind) ?? 'popular'
  const evidence = isEvidence(entry.evidence.kind)
    ? entry.evidence.kind
    : 'author'
  return h.keyed('article')(
    `${entry.station}-${entry.kind}-${entry.name}`,
    [h.Class(`lib-card kind-${kind}`)],
    [
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
      fingerprintView(entry, h),
      h.details(
        [h.Class('lib-note')],
        [h.summary([], ['Evidence']), h.p([], [entry.evidence.note])],
      ),
    ],
  )
}

// On each bench, under the workbench.
export const shelfView = (station: Station, h: H): Html =>
  Array.match(entriesFor(station), {
    onEmpty: () => h.empty,
    onNonEmpty: found =>
      h.section(
        [h.Class('lib-shelf'), h.AriaLabel('Out in the world')],
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
            Array.map(found, entry => cardView(entry, h)),
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
              Array.map(entriesFor(step.station), entry => cardView(entry, h)),
            ),
          ],
        ),
      ),
    ],
  )
