// Draws the tool sprites and writes src/lab/sprites.ts.
// Run: node scripts/draw-sprites.mjs
//
// Each sprite is built from a few shapes on a 24 by 24 grid, then outlined.
// Letters are paint, not meaning:
//   K outline  P white  L lemon  S blush  R red  O orange  Y yellow
//   N green    C cyan   B blue   V violet H pink M steel   D navy  G glass
import { writeFileSync } from 'node:fs'

const SIZE = 24

const make = () => {
  const cells = Array.from({ length: SIZE }, () => Array(SIZE).fill('.'))
  const set = (x, y, c) => {
    const px = Math.round(x)
    const py = Math.round(y)
    if (px >= 0 && py >= 0 && px < SIZE && py < SIZE) cells[py][px] = c
  }
  const rect = (x, y, w, h, c) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c)
  }
  const rr = (x, y, w, h, c, r = 1) => {
    rect(x, y, w, h, c)
    for (let j = 0; j < r; j++)
      for (let i = 0; i < r - j; i++) {
        set(x + i, y + j, '.')
        set(x + w - 1 - i, y + j, '.')
        set(x + i, y + h - 1 - j, '.')
        set(x + w - 1 - i, y + h - 1 - j, '.')
      }
  }
  const circle = (cx, cy, r, c) => {
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++)
        if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) set(x, y, c)
  }
  const line = (x0, y0, x1, y1, c, t = 1) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
    for (let s = 0; s <= steps; s++)
      rect(
        Math.round(x0 + ((x1 - x0) * s) / steps),
        Math.round(y0 + ((y1 - y0) * s) / steps),
        t,
        t,
        c,
      )
  }
  const poly = (points, c) => {
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        let inside = false
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const [xi, yi] = points[i]
          const [xj, yj] = points[j]
          if (
            yi > y + 0.5 !== yj > y + 0.5 &&
            x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi
          )
            inside = !inside
        }
        if (inside) set(x, y, c)
      }
  }
  const dots = (points, c) => points.forEach(([x, y]) => set(x, y, c))
  const outline = () => {
    const edge = []
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++)
        if (
          cells[y][x] === '.' &&
          [
            [x - 1, y],
            [x + 1, y],
            [x, y - 1],
            [x, y + 1],
          ].some(([i, j]) => cells[j]?.[i] && !'.K'.includes(cells[j][i]))
        )
          edge.push([x, y])
    dots(edge, 'K')
  }
  return { cells, set, rect, rr, circle, line, poly, dots, outline }
}

const bubble = (g, fill) => {
  g.rr(2, 3, 20, 14, fill, 2)
  g.poly(
    [
      [6, 16],
      [12, 16],
      [6, 22],
    ],
    fill,
  )
}

const terminal = (g, x, y, w, h, bar) => {
  g.rect(x, y, w, h, 'D')
  g.rect(x, y, w, 3, bar)
  g.dots([[x + 1, y + 1]], 'R')
  g.dots([[x + 3, y + 1]], 'Y')
  g.dots([[x + 5, y + 1]], 'N')
  g.dots(
    [
      [x + 2, y + 5],
      [x + 3, y + 6],
      [x + 2, y + 7],
    ],
    'N',
  )
  g.rect(x + 5, y + 6, Math.min(5, w - 7), 1, 'C')
}

const bench = g => {
  g.rect(2, 13, 20, 3, 'Y')
  g.rect(3, 16, 18, 1, 'O')
  g.rect(4, 17, 3, 5, 'B')
  g.rect(17, 17, 3, 5, 'B')
  g.rect(7, 19, 10, 1, 'D')
}

const envelope = (g, x, y, w, h) => {
  g.rect(x, y, w, h, 'P')
  g.line(x, y, x + w / 2 - 1, y + h / 2, 'H')
  g.line(x + w - 1, y, x + w / 2, y + h / 2, 'H')
  g.rect(x, y + h - 2, w, 2, 'S')
}

const sprites = {
  read_map: g => {
    g.rect(2, 5, 7, 14, 'G')
    g.rect(9, 7, 6, 14, 'P')
    g.rect(15, 5, 7, 14, 'G')
    g.circle(5.5, 9.5, 2.2, 'N')
    g.rect(17, 14, 4, 3, 'N')
    g.line(4, 16, 8, 13, 'R')
    g.line(10, 15, 14, 12, 'R')
    g.line(16, 11, 18, 9, 'R')
    g.circle(19, 7.5, 2, 'H')
    g.set(18, 7, 'P')
    g.line(9, 7, 9, 20, 'M')
    g.line(15, 5, 15, 18, 'M')
    g.outline()
  },
  read_file: g => {
    g.rect(5, 2, 14, 20, 'P')
    for (let y = 2; y <= 6; y++)
      for (let x = 14; x <= 18; x++)
        g.set(x, y, 18 - x + (y - 2) < 4 ? '.' : 'C')
    g.rect(7, 5, 5, 2, 'H')
    g.rect(7, 10, 10, 1, 'D')
    g.rect(7, 13, 10, 1, 'M')
    g.rect(7, 16, 7, 1, 'M')
    g.rect(7, 19, 9, 1, 'M')
    g.outline()
  },
  fetch_page: g => {
    g.rect(3, 2, 12, 17, 'P')
    for (let y = 2; y <= 5; y++)
      for (let x = 11; x <= 14; x++)
        g.set(x, y, 14 - x + (y - 2) < 3 ? '.' : 'H')
    g.rect(5, 6, 5, 1, 'D')
    g.rect(5, 9, 7, 1, 'M')
    g.rect(5, 12, 4, 1, 'M')
    g.circle(16, 16, 6, 'B')
    g.rect(12, 13, 4, 2, 'N')
    g.rect(14, 15, 3, 3, 'N')
    g.rect(18, 17, 3, 2, 'N')
    g.rect(17, 11, 2, 2, 'N')
    g.dots(
      [
        [12, 12],
        [13, 11],
      ],
      'C',
    )
    g.outline()
  },
  find_route: g => {
    bubble(g, 'L')
    g.rect(9, 5, 6, 2, 'V')
    g.rect(8, 6, 2, 2, 'V')
    g.rect(14, 6, 2, 3, 'V')
    g.rect(12, 9, 3, 2, 'V')
    g.rect(11, 10, 2, 2, 'V')
    g.rect(11, 13, 2, 2, 'V')
    g.outline()
  },
  where_am_i: g => {
    bubble(g, 'G')
    g.circle(12, 8.5, 3.6, 'R')
    g.poly(
      [
        [9, 10],
        [15, 10],
        [12, 15.5],
      ],
      'R',
    )
    g.circle(12, 8.5, 1.3, 'P')
    g.outline()
  },
  get_current_view: g => {
    bubble(g, 'S')
    g.rect(6, 5, 12, 9, 'D')
    g.rect(7, 6, 10, 7, 'G')
    g.rect(11, 7, 2, 5, 'B')
    g.rect(9, 9, 6, 1, 'B')
    g.outline()
  },
  take_snapshot: g => {
    g.rr(2, 7, 20, 13, 'V', 1)
    g.rect(8, 4, 7, 3, 'D')
    g.rect(17, 5, 3, 2, 'Y')
    g.rect(3, 18, 18, 1, 'H')
    g.circle(11.5, 13, 5, 'D')
    g.circle(11.5, 13, 3.8, 'C')
    g.circle(11.5, 13, 2, 'B')
    g.dots(
      [
        [10, 11],
        [9, 12],
      ],
      'P',
    )
    g.rect(18, 9, 2, 2, 'R')
    g.outline()
  },
  click: g => {
    g.poly(
      [
        [5, 2],
        [5, 18],
        [9, 14],
        [12, 20],
        [15, 19],
        [12, 13],
        [17, 13],
      ],
      'P',
    )
    g.outline()
    g.line(18, 5, 20, 3, 'Y')
    g.line(19, 9, 22, 9, 'H')
    g.line(14, 4, 14, 1, 'C')
  },
  remember: g => {
    g.rr(4, 2, 13, 20, 'H', 1)
    g.rect(7, 5, 8, 13, 'P')
    g.rect(8, 8, 6, 1, 'M')
    g.rect(8, 11, 6, 1, 'M')
    g.rect(8, 14, 4, 1, 'M')
    for (const y of [4, 7, 10, 13, 16, 19]) g.rect(3, y, 2, 1, 'M')
    g.line(19, 3, 18, 5, 'R', 3)
    g.line(18, 6, 14, 14, 'Y', 3)
    g.rect(13, 17, 2, 2, 'L')
    g.set(13, 19, 'D')
    g.outline()
  },
  recall: g => {
    g.rect(6, 3, 12, 9, 'P')
    g.rect(7, 2, 4, 1, 'H')
    g.rect(8, 5, 8, 1, 'D')
    g.rect(8, 7, 6, 1, 'M')
    g.rect(8, 9, 7, 1, 'M')
    g.rr(2, 11, 20, 11, 'B', 1)
    g.rect(4, 14, 16, 6, 'C')
    g.rect(9, 16, 6, 2, 'Y')
    g.outline()
  },
  build_path: g => {
    g.rr(3, 3, 17, 7, 'M', 1)
    g.rect(9, 3, 4, 7, 'D')
    g.rect(10, 10, 3, 12, 'O')
    g.rect(10, 17, 3, 5, 'R')
    g.outline()
  },
  go_to: g => {
    g.line(11, 15, 16, 6, 'M', 2)
    g.rr(2, 17, 20, 5, 'B', 1)
    g.rect(6, 15, 12, 2, 'D')
    g.circle(17.5, 5, 3, 'R')
    g.set(16, 4, 'P')
    g.outline()
  },
  write_entry: g => {
    g.circle(12, 4.5, 3.2, 'V')
    g.rect(10, 7, 4, 6, 'V')
    g.rr(6, 12, 12, 4, 'O', 1)
    g.rect(4, 16, 16, 2, 'D')
    g.rect(4, 18, 16, 2, 'R')
    g.set(11, 3, 'P')
    g.outline()
    g.rect(5, 22, 3, 1, 'R')
    g.rect(10, 22, 5, 1, 'R')
    g.rect(17, 22, 2, 1, 'R')
  },
  list_carts: g => {
    g.rect(3, 9, 18, 7, 'O')
    g.rect(4, 10, 16, 2, 'Y')
    g.line(1, 6, 4, 9, 'M', 2)
    g.circle(7, 18.5, 2.6, 'D')
    g.circle(17, 18.5, 2.6, 'D')
    g.set(7, 18, 'M')
    g.set(17, 18, 'M')
    g.outline()
  },
  reserve_cart: g => {
    g.rect(2, 13, 14, 5, 'O')
    g.rect(3, 14, 12, 1, 'Y')
    g.circle(5, 20, 2.1, 'D')
    g.circle(13, 20, 2.1, 'D')
    g.rr(12, 1, 11, 9, 'P', 2)
    g.poly(
      [
        [14, 9],
        [17, 9],
        [14, 12],
      ],
      'P',
    )
    g.rect(16, 3, 3, 1, 'B')
    g.rect(18, 4, 1, 2, 'B')
    g.rect(17, 5, 1, 1, 'B')
    g.rect(17, 7, 1, 1, 'B')
    g.outline()
  },
  move_crate: g => {
    g.rect(3, 20, 18, 2, 'M')
    g.rect(4, 6, 3, 14, 'Y')
    g.rect(4, 4, 16, 3, 'Y')
    g.rect(17, 7, 1, 6, 'M')
    g.rr(13, 13, 9, 7, 'O', 1)
    g.rect(14, 15, 7, 1, 'R')
    g.rect(5, 8, 1, 1, 'O')
    g.rect(5, 12, 1, 1, 'O')
    g.outline()
  },
  read_sensor: g => {
    g.rr(2, 8, 9, 8, 'M', 1)
    g.circle(6.5, 12, 2.4, 'D')
    g.set(6, 11, 'C')
    g.poly(
      [
        [11, 10],
        [22, 4],
        [22, 20],
        [11, 14],
      ],
      'L',
    )
    g.rr(16, 10, 6, 5, 'O', 1)
    g.rect(4, 16, 3, 5, 'M')
    g.outline()
  },
  run_as_calls: g => {
    g.rect(4, 2, 16, 20, 'P')
    g.rect(6, 4, 4, 4, 'R')
    g.rect(6, 10, 4, 4, 'H')
    g.rect(6, 16, 4, 4, 'O')
    for (const y of [5, 11, 17]) {
      g.rect(12, y, 6, 1, 'D')
      g.rect(12, y + 2, 4, 1, 'M')
    }
    g.outline()
  },
  call_live: g => {
    g.rect(7, 2, 2, 5, 'M')
    g.rect(15, 2, 2, 5, 'M')
    g.rr(4, 7, 16, 8, 'Y', 1)
    g.rect(7, 15, 10, 2, 'O')
    g.rect(9, 17, 6, 2, 'O')
    g.rect(11, 19, 2, 3, 'D')
    g.rect(13, 20, 7, 2, 'D')
    g.circle(8.5, 10.5, 1.3, 'R')
    g.rect(12, 10, 5, 1, 'P')
    g.outline()
  },
  call_generated: g => {
    terminal(g, 2, 3, 20, 17, 'V')
    g.rect(4, 13, 7, 1, 'H')
    g.rect(4, 16, 4, 1, 'P')
    g.outline()
  },
  generate_cli: g => {
    terminal(g, 5, 2, 14, 11, 'H')
    bench(g)
    g.outline()
  },
  run_as_program: g => {
    g.rect(6, 2, 12, 11, 'P')
    g.rect(8, 4, 3, 1, 'V')
    g.rect(12, 4, 4, 1, 'C')
    g.rect(9, 6, 5, 1, 'H')
    g.rect(9, 8, 3, 1, 'N')
    g.rect(13, 8, 3, 1, 'O')
    g.rect(8, 10, 2, 1, 'V')
    bench(g)
    g.outline()
  },
  connect_places: g => {
    g.rect(5, 2, 14, 11, 'G')
    g.rect(13, 3, 4, 2, 'N')
    g.rect(6, 10, 3, 2, 'N')
    g.line(9, 6, 15, 9, 'D')
    g.circle(8, 5.5, 1.6, 'R')
    g.circle(16, 9.5, 1.6, 'B')
    bench(g)
    g.outline()
  },
  plan_steps: g => {
    g.rect(6, 2, 12, 11, 'P')
    g.rect(8, 4, 2, 2, 'N')
    g.rect(11, 4, 5, 1, 'D')
    g.rect(8, 7, 2, 2, 'N')
    g.rect(11, 7, 5, 1, 'D')
    g.rect(8, 10, 2, 2, 'M')
    g.rect(11, 10, 4, 1, 'M')
    bench(g)
    g.outline()
  },
  ask_expert: g => {
    envelope(g, 2, 8, 18, 13)
    g.circle(18, 6.5, 4.6, 'B')
    g.dots(
      [
        [17, 4],
        [18, 4],
        [19, 5],
        [18, 6],
        [18, 7],
        [18, 9],
      ],
      'P',
    )
    g.outline()
  },
  review_plan: g => {
    envelope(g, 2, 4, 18, 13)
    g.circle(18, 16.5, 4.6, 'N')
    g.dots(
      [
        [16, 17],
        [17, 18],
        [18, 17],
        [19, 16],
        [20, 15],
      ],
      'P',
    )
    g.outline()
  },
  deliver_plan: g => {
    g.rr(2, 6, 20, 16, 'V', 1)
    g.rect(2, 6, 20, 4, 'H')
    g.rect(2, 10, 20, 1, 'D')
    g.rect(10, 6, 4, 16, 'Y')
    g.rect(4, 15, 5, 4, 'P')
    g.rect(5, 16, 3, 1, 'D')
    g.outline()
  },
  refine_plan: g => {
    g.circle(12, 12.5, 9, 'N')
    g.circle(12, 12.5, 5.2, '.')
    g.rect(13, 2, 10, 7, '.')
    g.poly(
      [
        [12, 1],
        [12, 10],
        [18.5, 5.5],
      ],
      'N',
    )
    g.circle(12, 12.5, 2, 'Y')
    g.outline()
  },
  crash_and_resume: g => {
    g.rect(10, 1, 4, 4, 'B')
    g.rect(10, 19, 4, 4, 'B')
    g.rect(1, 10, 4, 4, 'B')
    g.rect(19, 10, 4, 4, 'B')
    g.rect(4, 4, 3, 3, 'B')
    g.rect(17, 4, 3, 3, 'B')
    g.rect(4, 17, 3, 3, 'B')
    g.rect(17, 17, 3, 3, 'B')
    g.circle(12, 12, 7.6, 'B')
    g.circle(12, 12, 4.6, 'D')
    g.poly(
      [
        [13.5, 6],
        [8.5, 13],
        [11.5, 13],
        [10.5, 18.5],
        [15.5, 11],
        [12.5, 11],
      ],
      'Y',
    )
    g.outline()
  },
  list_inventory: g => {
    g.rect(11, 1, 2, 21, 'D')
    g.poly(
      [
        [3, 3],
        [18, 3],
        [21, 5.5],
        [18, 8],
        [3, 8],
      ],
      'C',
    )
    g.rect(5, 5, 8, 1, 'P')
    g.poly(
      [
        [21, 11],
        [6, 11],
        [3, 13.5],
        [6, 16],
        [21, 16],
      ],
      'H',
    )
    g.rect(10, 13, 8, 1, 'P')
    g.rect(8, 21, 8, 2, 'N')
    g.outline()
  },
  call_tool: g => {
    g.rect(3, 4, 4, 5, 'B')
    g.line(4, 9, 9, 13, 'B', 4)
    g.rect(17, 4, 4, 5, 'H')
    g.line(16, 9, 11, 13, 'H', 4)
    g.rect(10, 15, 4, 7, 'V')
    g.rect(9, 14, 6, 2, 'D')
    g.rect(2, 2, 6, 2, 'D')
    g.rect(16, 2, 6, 2, 'D')
    g.outline()
  },
  profile_server: g => {
    g.rect(2, 3, 13, 16, 'P')
    g.rect(4, 5, 6, 1, 'D')
    g.rect(4, 8, 8, 1, 'M')
    g.rect(4, 11, 5, 1, 'M')
    g.rect(4, 14, 7, 1, 'M')
    g.line(17, 17, 20, 20, 'V', 2)
    g.circle(13.5, 13.5, 5.2, 'V')
    g.circle(13.5, 13.5, 3.6, 'G')
    g.dots(
      [
        [12, 12],
        [11, 13],
      ],
      'P',
    )
    g.outline()
  },
  profile_self: g => {
    g.line(15, 15, 20, 20, 'H', 2)
    g.circle(10, 10, 7.6, 'H')
    g.circle(10, 10, 5.8, 'G')
    g.circle(10, 10, 3.2, 'H')
    g.circle(10, 10, 1.8, 'G')
    g.dots(
      [
        [7, 7],
        [6, 8],
      ],
      'P',
    )
    g.outline()
  },
  show_map: g => {
    g.rect(2, 3, 20, 18, 'D')
    g.rect(2, 3, 20, 3, 'H')
    g.dots([[3, 4]], 'R')
    g.dots([[5, 4]], 'Y')
    g.dots([[7, 4]], 'N')
    g.rect(3, 7, 18, 10, 'G')
    g.circle(7, 10.5, 2.5, 'N')
    g.rect(14, 12, 5, 4, 'N')
    g.line(8, 12, 15, 13, 'R')
    g.circle(16.5, 9.5, 1.6, 'R')
    g.rect(3, 18, 18, 2, 'P')
    g.rect(4, 18, 4, 2, 'C')
    g.rect(9, 18, 4, 2, 'Y')
    g.outline()
  },
}

const body = Object.entries(sprites)
  .map(([name, draw]) => {
    const g = make()
    draw(g)
    return `  ${name}: [\n${g.cells.map(row => `    '${row.join('')}',`).join('\n')}\n  ],`
  })
  .join('\n')

writeFileSync(
  new URL('../src/lab/sprites.ts', import.meta.url),
  `// Generated by scripts/draw-sprites.mjs. Edit the script, not this file.
import type { CapabilityName } from '../domain/capabilities.ts'

export const ICON_SIZE = ${SIZE}

export const sprites: Record<CapabilityName, ReadonlyArray<string>> = {
${body}
}
`,
)
console.log(`${Object.keys(sprites).length} sprites at ${SIZE}x${SIZE}`)
