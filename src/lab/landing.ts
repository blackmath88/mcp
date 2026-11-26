import { Array } from 'effect'
import { type Html, type HtmlBuilder } from 'foldkit/html'

import type { CapabilityName } from '../domain/capabilities.ts'
import { modules } from '../domain/modules.ts'
import { creditView } from './credit.ts'
import { lineIcon, slotIcons } from './icons.ts'
import { critterToggleView, pixelBandView } from './library.ts'
import { mcpLabMark } from './marks.ts'
import { type MapInput, mcpMapView } from './mcpmap.ts'
import { Message } from './message.ts'
import type { Model } from './model.ts'
import { route } from './story.ts'
import { toolsOf } from './tell.ts'

type H = HtmlBuilder<Message>

// THE LANDING PAGE
//
// Full window, before the lab: one promise, the workshop drawn large with a
// call moving through it, and one way in. The server on it is a showcase put
// together from five of the lab's servers, one tool each, so most of the
// building lights up; it is labelled as such.

const showcase: ReadonlyArray<CapabilityName> = [
  'fetch_page',
  'reserve_cart',
  'remember',
  'find_route',
  'run_as_program',
  'ask_expert',
  'move_crate',
]

const showcaseMap = (model: Model): MapInput => ({
  mode: 'server',
  title: 'a showcase server',
  tools: toolsOf(model, showcase),
  scene: {
    names: {
      web: 'web pages',
      store: 'stored data',
      llm: 'another model',
      world: 'the world',
    },
    gates: {},
    desk: ['← questions for you'],
    building: 'room',
    notes: [],
  },
  isWorking: false,
})

// Stepped ground under the nine kinds of tool, for the critters to stand on.

export const landingView = (model: Model, h: H): Html =>
  h.main(
    [h.Class('landing'), h.AriaLabel('MCP Lab')],
    [
      h.div(
        [h.Class('landing-text')],
        [
          h.p(
            [h.Class('landing-brand')],
            [mcpLabMark(h, 'brandmark'), 'MCP Lab'],
          ),
          h.h1(
            [h.Class('landing-title')],
            ['The AI only sees a list of tools. Open the workshop behind it.'],
          ),
          h.p(
            [h.Class('landing-lede')],
            [
              'MCP is how an AI app asks a program what tools it has, and then uses them. This lab draws every server as the same building and lets you run it: ',
              `${route.length} servers, simulated in your browser, from fetching a page to moving a robot arm.`,
            ],
          ),
          h.div(
            [h.Class('landing-actions')],
            [
              h.button(
                [
                  h.Type('button'),
                  h.Class('btn landing-enter'),
                  h.OnClick(Message.ClickedIntro()),
                ],
                ['Enter the lab'],
              ),
              h.button(
                [
                  h.Type('button'),
                  h.Class('pop-btn plain'),
                  h.OnClick(Message.SelectedStation({ station: 'fetch' })),
                ],
                ['Straight to step 01'],
              ),
              h.button(
                [
                  h.Type('button'),
                  h.Class('pop-btn plain'),
                  h.OnClick(Message.ClickedLibrary()),
                ],
                ['Real servers, out in the world'],
              ),
            ],
          ),
          h.div(
            [h.Class('landing-slots'), h.AriaLabel('Nine kinds of tool')],
            [
              h.p([h.Class('landing-slots-title')], ['Nine kinds of tool']),
              h.ul(
                [],
                Array.map(modules, module =>
                  h.keyed('li')(
                    module.id,
                    [h.Title(module.means)],
                    [
                      lineIcon(
                        slotIcons[module.id],
                        `ic place-${module.place}`,
                        h,
                      ),
                      h.span([], [module.word]),
                    ],
                  ),
                ),
              ),
              h.div(
                [
                  h.Class('landing-terrain'),
                  h.AriaHidden(true),
                  h.DataAttribute('perch', '3'),
                  h.DataAttribute('perch-steps', ''),
                ],
                Array.map(modules, module =>
                  h.keyed('span')(
                    module.id,
                    [h.Class(`terrain-block place-${module.place}`)],
                    [],
                  ),
                ),
              ),
              critterToggleView(h),
            ],
          ),
          h.p(
            [h.Class('landing-foot')],
            [
              'Made-up data, real MCP messages between a client and a server in this page. No model, no account, no tracking; nothing leaves your browser unless you ask a real server for its tools.',
            ],
          ),
          creditView(h),
          pixelBandView(h),
        ],
      ),
      h.div(
        [h.Class('landing-art')],
        [
          mcpMapView(showcaseMap(model), h),
          h.p(
            [h.Class('landing-caption')],
            [
              'A showcase: one tool each from seven of the lab’s servers, so most of the building lights up. Each server on the route lights only its own part.',
            ],
          ),
        ],
      ),
    ],
  )
