import { type Html, type HtmlBuilder } from 'foldkit/html'

import type { Message } from './message.ts'

type H = HtmlBuilder<Message>

// THE TWO MARKS
//
// bridge·work's Signal Mark, as on bridge-work.ai: three squares and one
// carved quarter-arc. The MCP Lab mark is its sibling, built from the same
// grid and colours: the top-left square becomes three bars, a list. The
// AI only sees the list; the rest of the mark is the building behind it,
// and the arc, the brand's sign for a connection, is the way in.
// Colours come from CSS (.mk-*), so both marks follow light and dark.

const square = (x: number, y: number, tone: string, h: H): Html =>
  h.rect([
    h.Class(`mk-${tone}`),
    h.X(String(x)),
    h.Y(String(y)),
    h.Width('42'),
    h.Height('42'),
    h.Rx('3'),
  ])

const arc = (h: H): Html =>
  h.path([h.Class('mk-rose'), h.D('M52 94 Q52 52 94 52 L94 94 Z')])

const bar = (y: number, h: H): Html =>
  h.rect([
    h.Class('mk-teal'),
    h.X('6'),
    h.Y(String(y)),
    h.Width('42'),
    h.Height('10'),
    h.Rx('3'),
  ])

const svgOf = (className: string, parts: ReadonlyArray<Html>, h: H): Html =>
  h.svg(
    [
      h.Class(`mark ${className}`),
      h.ViewBox('0 0 100 100'),
      h.AriaHidden(true),
    ],
    parts,
  )

export const bridgeWorkMark = (h: H, className = ''): Html =>
  svgOf(
    `mark-bw ${className}`,
    [
      square(6, 6, 'teal', h),
      square(52, 6, 'purple', h),
      square(6, 52, 'amber', h),
      arc(h),
    ],
    h,
  )

export const mcpLabMark = (h: H, className = ''): Html =>
  svgOf(
    `mark-lab ${className}`,
    [
      bar(6, h),
      bar(22, h),
      bar(38, h),
      square(52, 6, 'purple', h),
      square(6, 52, 'amber', h),
      arc(h),
    ],
    h,
  )
