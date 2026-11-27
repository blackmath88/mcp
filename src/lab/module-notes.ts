import { Option } from 'effect'

import data from '../../specimens/module-notes.json'
import type { ModuleId } from '../domain/modules.ts'

// WHAT ONE SERVER DOES AT ONE SLOT
//
// A library card says which slots a server claims; it never says what the
// server does there. These notes do, for the handful of servers worth
// stopping at, and each one names the source it was read from. A card with
// no note here falls back to its own what/why text, so the drawing never
// invents a claim about somebody else's server.

export type ModuleNote = Readonly<{
  headline: string
  note: string
  evidenceKind: string
  evidenceNote: string
}>

type RawNote = Readonly<{
  station: string
  kind: string
  name: string
  slots: Readonly<Record<string, Readonly<{ headline: string; note: string }>>>
  evidence: Readonly<{ kind: string; note: string }>
}>

const raw: ReadonlyArray<RawNote> = data.notes

// How many of a server's slots carry a note, so a card can say whether
// picking it will annotate the drawing or only redraw it.
export const noteCount = (
  station: string,
  kind: string,
  name: string,
): number => {
  const found = raw.find(
    entry =>
      entry.station === station && entry.kind === kind && entry.name === name,
  )
  return found === undefined ? 0 : Object.keys(found.slots).length
}

export const noteFor = (
  station: string,
  kind: string,
  name: string,
  slot: ModuleId,
): Option.Option<ModuleNote> => {
  const found = raw.find(
    entry =>
      entry.station === station && entry.kind === kind && entry.name === name,
  )
  const slotNote = found?.slots[slot]
  return found === undefined || slotNote === undefined
    ? Option.none()
    : Option.some({
        headline: slotNote.headline,
        note: slotNote.note,
        evidenceKind: found.evidence.kind,
        evidenceNote: found.evidence.note,
      })
}
