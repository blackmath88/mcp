import { type Html, type HtmlBuilder } from 'foldkit/html'

import type { Message } from './message.ts'

type H = HtmlBuilder<Message>

// The bridge·work credit, the source link and the legal links, the same
// pattern as the lab's other public tools. The operator's Imprint and Privacy
// pages live on bridge-work.ai; the lab adds a short note on what this page
// itself does. The code is open (MIT), so the source is one click away.

export const LAB_PAGE = 'https://bridge-work.ai/lab/tool/mcp-lab/'
export const SOURCE = 'https://github.com/blackmath88/mcp'
export const IMPRINT = 'https://bridge-work.ai/en/imprint/'
export const PRIVACY = 'https://bridge-work.ai/en/privacy/'

const external = (href: string, label: string, h: H): Html =>
  h.a([h.Href(href), h.Target('_blank'), h.Rel('noopener noreferrer')], [label])

export const creditView = (h: H): Html =>
  h.span(
    [h.Class('credit')],
    [
      h.a(
        [
          h.Class('credit-mark'),
          h.Href(LAB_PAGE),
          h.Target('_blank'),
          h.Rel('noopener noreferrer'),
        ],
        ['Built by ', h.b([], ['bridge·work']), ' ↗'],
      ),
      h.span([h.Class('credit-sep'), h.AriaHidden(true)], ['·']),
      external(SOURCE, 'Source on GitHub', h),
      h.span([h.Class('credit-sep'), h.AriaHidden(true)], ['·']),
      external(IMPRINT, 'Imprint', h),
      h.span([h.Class('credit-sep'), h.AriaHidden(true)], ['·']),
      h.details(
        [h.Class('pop credit-privacy')],
        [
          h.summary([h.Class('credit-link')], ['Privacy']),
          h.div(
            [h.Class('pop-panel')],
            [
              h.h4([], ['Privacy in MCP Lab']),
              h.p(
                [],
                [
                  'MCP Lab runs entirely in your browser. What you do in the lab stays on your device and is not uploaded. There are no accounts, no analytics and no tracking, and the fonts are served with the site.',
                ],
              ),
              h.p(
                [],
                [
                  'One exception you start yourself: under “Your server”, “Ask for its tools” sends a request from your browser to the address you type, and that server sees it.',
                ],
              ),
              h.p(
                [],
                [
                  'The hosting provider may process technical connection data to deliver and secure the site.',
                ],
              ),
              h.p(
                [],
                [
                  'Operator and full notice: ',
                  external(PRIVACY, 'bridge-work.ai privacy', h),
                  ' · ',
                  external(IMPRINT, 'imprint', h),
                  '.',
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  )
