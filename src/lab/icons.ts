import { Array, pipe } from 'effect'
import { type Html, type HtmlBuilder } from 'foldkit/html'

import type { CapabilityName } from '../domain/capabilities.ts'
import { ICON_SIZE, sprites } from './sprites.ts'

// One pixel sprite per capability, drawn on a 24 by 24 grid by
// scripts/draw-sprites.mjs. The same sprite is used on the atlas, in the
// inventory, on the belt, in the inspector and in the run evidence, so a tool
// is one recognisable object everywhere.
//
// Letters are paint, not meaning. Colour here never stands for a family, for
// success or for permission.

export { ICON_SIZE, sprites }

const materials = [
  'K',
  'P',
  'L',
  'S',
  'R',
  'O',
  'Y',
  'N',
  'C',
  'B',
  'V',
  'H',
  'M',
  'D',
  'G',
] as const

// One path per material: each pixel is a unit square.
const pathFor = (rows: ReadonlyArray<string>, material: string): string =>
  pipe(
    rows,
    Array.flatMap((row, y) =>
      Array.flatMap([...row], (letter, x) =>
        letter === material ? [`M${x} ${y}h1v1h-1z`] : [],
      ),
    ),
    Array.join(''),
  )

const isFill = (letter: string | undefined): boolean =>
  letter !== undefined && letter !== '.' && letter !== 'K'

// Cel shading. Light comes from the upper left: a filled pixel under or
// beside an outline on that side is lit; one resting on the lower right edge
// is in shade. Two overlay paths shade every paint without a bigger palette.
const overlayPath = (
  rows: ReadonlyArray<string>,
  wanted: 'lit' | 'shade',
): string =>
  pipe(
    rows,
    Array.flatMap((row, y) =>
      Array.flatMap([...row], (letter, x) => {
        if (!isFill(letter)) {
          return []
        }
        const isLit = !isFill(rows[y - 1]?.[x]) || !isFill(row[x - 1])
        const isShade = !isFill(rows[y + 1]?.[x]) || !isFill(row[x + 1])
        const kind =
          isLit && !isShade ? 'lit' : isShade && !isLit ? 'shade' : ''
        return kind === wanted ? [`M${x} ${y}h1v1h-1z`] : []
      }),
    ),
    Array.join(''),
  )

export const iconView = <Message>(
  name: CapabilityName,
  h: HtmlBuilder<Message>,
): Html =>
  h.svg(
    [
      h.Class('px'),
      h.ViewBox(`0 0 ${ICON_SIZE} ${ICON_SIZE}`),
      h.ShapeRendering('crispEdges'),
      h.AriaHidden(true),
    ],
    [
      ...Array.flatMap(materials, material => {
        const d = pathFor(sprites[name], material)
        return d === '' ? [] : [h.path([h.Class(`px-${material}`), h.D(d)])]
      }),
      h.path([h.Class('px-lit'), h.D(overlayPath(sprites[name], 'lit'))]),
      h.path([h.Class('px-shade'), h.D(overlayPath(sprites[name], 'shade'))]),
    ],
  )
