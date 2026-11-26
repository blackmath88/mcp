import { hues } from './catalog.ts'
import { SIZE, type SpriteId, spriteIds, sprites } from './sprites.ts'

// Drawing the grids. Three modes from one grid:
// - sticker: shaded, with a one-pixel white outline so it reads on any ground
// - duo: collapsed to the critter's dark / mid / light tones, one pop colour kept
// - plain: shaded, no outline
// Shading is a rule, not hand work: light from the top-left and shade at the
// bottom-right, and an outline that takes a deep tone of the fill it wraps.
// All three look only at the exterior edge, so faces stay crisp.

export type Mode = 'sticker' | 'duo' | 'plain'

const NIGHT = '#120d22'
const SIDES: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

const rgb = (hex: string): readonly [number, number, number] => {
  const value = parseInt(hex.slice(1), 16)
  return [value >> 16, (value >> 8) & 255, value & 255]
}

export const mix = (from: string, to: string, amount: number): string => {
  const [r1, g1, b1] = rgb(from)
  const [r2, g2, b2] = rgb(to)
  const step = (a: number, b: number) =>
    Math.round(a + (b - a) * amount)
      .toString(16)
      .padStart(2, '0')
  return `#${step(r1, r2)}${step(g1, g2)}${step(b1, b2)}`
}

const luminance = (hex: string): number => {
  const [r, g, b] = rgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

// Pure: the colour of one cell, or undefined for empty.
export const cellColour = (
  id: SpriteId,
  frame: 0 | 1,
  mode: Mode,
  i: number,
  j: number,
): string | undefined => {
  const sprite = sprites[id]
  const rows = sprite.frames[frame]
  const at = (x: number, y: number): string => rows[y]?.[x] ?? '.'
  const char = at(i, j)
  if (char === '.') return undefined
  const base = sprite.palette[char]
  if (base === undefined) return undefined
  const hue = hues[id]
  if (mode === 'duo') {
    if (char === hue.pop) return base
    const light = luminance(base)
    return light < 0.3 ? hue.dark : light > 0.82 ? hue.light : hue.mid
  }
  const outside = (x: number, y: number) => at(x, y) === '.'
  const exterior = (x: number, y: number) =>
    outside(x, y) ||
    (at(x, y) === 'k' && SIDES.some(([a, b]) => outside(x + a, y + b)))
  if (char === 'k') {
    const touchesOut = SIDES.some(([a, b]) => outside(i + a, j + b))
    const fill = SIDES.map(([a, b]) => at(i + a, j + b)).find(
      value => value !== '.' && value !== 'k',
    )
    const fillColour = fill === undefined ? undefined : sprite.palette[fill]
    return touchesOut && fillColour !== undefined && j < SIZE - 1
      ? mix(fillColour, NIGHT, 0.62)
      : base
  }
  if (char === 'w' || char === hue.pop) return base
  const lift = exterior(i, j - 1) ? 0.28 : exterior(i - 1, j) ? 0.14 : 0
  const drop = exterior(i, j + 1) ? 0.24 : exterior(i + 1, j) ? 0.14 : 0
  const lit = lift > 0 ? mix(base, '#ffffff', lift) : base
  return drop > 0 ? mix(lit, NIGHT, drop) : lit
}

const cache = new Map<string, HTMLCanvasElement>()

export const drawSprite = (
  id: SpriteId,
  frame: 0 | 1,
  px: number,
  mode: Mode,
): HTMLCanvasElement => {
  const key = `${id}-${frame}-${px}-${mode}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  const pad = mode === 'sticker' ? 1 : 0
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = (SIZE + 2 * pad) * px
  const context = canvas.getContext('2d')
  if (context === null) return canvas
  context.translate(pad * px, pad * px)
  const rows = sprites[id].frames[frame]
  if (mode === 'sticker') {
    context.fillStyle = '#ffffff'
    rows.forEach((row, j) =>
      [...row].forEach((char, i) => {
        if (char === '.') return
        SIDES.forEach(([a, b]) =>
          context.fillRect((i + a) * px, (j + b) * px, px, px),
        )
      }),
    )
  }
  for (let j = 0; j < SIZE; j++)
    for (let i = 0; i < SIZE; i++) {
      const colour = cellColour(id, frame, mode, i, j)
      if (colour === undefined) continue
      context.fillStyle = colour
      context.fillRect(i * px, j * px, px, px)
    }
  cache.set(key, canvas)
  return canvas
}

// A pale mosaic in the critter's hue: about a fifth of the tiles one step
// darker, chosen from a seed so the pattern is stable, and a faint grid.
export const drawMosaic = (
  id: SpriteId,
  width: number,
  height: number,
  cell: number,
): HTMLCanvasElement => {
  const hue = hues[id]
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (context === null) return canvas
  context.fillStyle = hue.tint
  context.fillRect(0, 0, width, height)
  let seed = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 7)
  const random = () => (seed = (seed * 9301 + 49297) % 233280) / 233280
  context.fillStyle = hue.step
  for (let i = 0; i < width / cell; i++)
    for (let j = 0; j < height / cell; j++)
      if (random() < 0.22) context.fillRect(i * cell, j * cell, cell, cell)
  context.strokeStyle = 'rgba(0,0,0,0.06)'
  context.lineWidth = 1
  for (let x = 0; x <= width; x += cell) {
    context.beginPath()
    context.moveTo(x + 0.5, 0)
    context.lineTo(x + 0.5, height)
    context.stroke()
  }
  for (let y = 0; y <= height; y += cell) {
    context.beginPath()
    context.moveTo(0, y + 0.5)
    context.lineTo(width, y + 0.5)
    context.stroke()
  }
  return canvas
}

const PIPS: Readonly<Record<'weird' | 'breaks', ReadonlyArray<string>>> = {
  weird: [
    '...x...',
    '...x...',
    '..xxx..',
    'xxxxxxx',
    '..xxx..',
    '...x...',
    '...x...',
  ],
  breaks: [
    '....xx.',
    '...xx..',
    '..xxxx.',
    '.xxxx..',
    '...xx..',
    '..xx...',
    '.x.....',
  ],
}

const pipUrl = (rows: ReadonlyArray<string>): string => {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 7
  const context = canvas.getContext('2d')
  if (context === null) return ''
  context.fillStyle = '#000'
  rows.forEach((row, j) =>
    [...row].forEach((char, i) => {
      if (char === 'x') context.fillRect(i, j, 1, 1)
    }),
  )
  return canvas.toDataURL()
}

// The art lives in CSS custom properties on the root element, so views
// rendered by Foldkit only carry class names and never hold canvases.
export const installArt = (root: HTMLElement): void => {
  spriteIds.forEach(id => {
    const set = (name: string, canvas: HTMLCanvasElement) =>
      root.style.setProperty(
        `--crit-${id}-${name}`,
        `url(${canvas.toDataURL()})`,
      )
    set('sticker', drawSprite(id, 0, 6, 'sticker'))
    set('big', drawSprite(id, 0, 15, 'duo'))
    set('mosaic', drawMosaic(id, 640, 420, 70))
  })
  root.style.setProperty('--pip-weird', `url(${pipUrl(PIPS.weird)})`)
  root.style.setProperty('--pip-breaks', `url(${pipUrl(PIPS.breaks)})`)
}
