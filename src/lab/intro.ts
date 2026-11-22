import { Array } from 'effect'
import { type Html, type HtmlBuilder } from 'foldkit/html'

import { catalogue } from '../domain/capabilities.ts'
import { iconView } from './icons.ts'
import { Message } from './message.ts'
import type { Model } from './model.ts'
import { stationNames } from './names.ts'
import { type StoryStep, route, stepOf } from './story.ts'

type H = HtmlBuilder<Message>

// The front door: what MCP is, in one picture and three sentences, and the
// route through the lab from easy to strange.

const node = (title: string, note: string, tone: string, h: H): Html =>
  h.div([h.Class(`mcp-node ${tone}`)], [h.b([], [title]), h.span([], [note])])

const arrow = (label: string, h: H): Html =>
  h.div(
    [h.Class('mcp-arrow'), h.AriaHidden(true)],
    [h.span([], [label]), h.span([h.Class('mcp-line')], [])],
  )

const pictureView = (h: H): Html =>
  h.div(
    [
      h.Class('mcp-picture'),
      h.Role('img'),
      h.AriaLabel(
        'You talk to an AI app. The app connects to MCP servers. Each server offers tools, and behind each tool is something real.',
      ),
    ],
    [
      node('You', 'ask for something', 'you', h),
      arrow('', h),
      node('AI app', 'the host: the AI and the app around it', 'host', h),
      arrow('MCP', h),
      node('Server', 'a program that offers tools', 'server', h),
      arrow('', h),
      h.div(
        [h.Class('mcp-node tools')],
        [
          h.b([], ['Tools']),
          h.span(
            [h.Class('mcp-sprites')],
            Array.map(
              [
                'read_file',
                'remember',
                'take_snapshot',
                'write_entry',
                'run_as_program',
                'ask_expert',
              ] as const,
              name => iconView(name, h),
            ),
          ),
        ],
      ),
      arrow('', h),
      node('Behind them', 'a file, a page, a ledger, another AI', 'behind', h),
    ],
  )

const stepRow = (model: Model, step: StoryStep, index: number, h: H): Html => {
  const first = catalogue.find(
    capability => capability.specimen === step.station,
  )
  return h.keyed('li')(
    step.station,
    [],
    [
      h.button(
        [
          h.Type('button'),
          h.Class(
            `route-step ${stepOf(model.station) === index && model.savedRuns.length > 0 ? 'here' : ''}`,
          ),
          h.OnClick(Message.SelectedStation({ station: step.station })),
        ],
        [
          h.span([h.Class('route-n')], [String(index).padStart(2, '0')]),
          first === undefined ? h.empty : iconView(first.name, h),
          h.span(
            [h.Class('route-text')],
            [h.b([], [stationNames[step.station]]), h.span([], [step.idea])],
          ),
        ],
      ),
    ],
  )
}

export const introView = (model: Model, h: H): Html =>
  h.main(
    [h.Class('intro'), h.AriaLabel('What is MCP?')],
    [
      h.div(
        [h.Class('intro-head')],
        [
          h.p([h.Class('kicker')], ['MCP Lab']),
          h.h1([h.Class('intro-title')], ['What is MCP?']),
          h.p(
            [h.Class('intro-lede')],
            [
              'MCP, the Model Context Protocol, is a common way for an AI app to ask a program “what tools do you have?”, and then to use them. The AI only ever sees a list: names, inputs, descriptions. What a tool really does stays behind the list. This lab opens it up.',
            ],
          ),
        ],
      ),
      pictureView(h),
      h.div(
        [h.Class('intro-facts')],
        [
          h.p(
            [],
            [
              h.b([], ['1 · ']),
              'A server hands the AI a list of tools. That list is all the AI is told.',
            ],
          ),
          h.p(
            [],
            [
              h.b([], ['2 · ']),
              'The app decides which tools the AI sees and whether to ask you first. MCP leaves that to the app.',
            ],
          ),
          h.p(
            [],
            [
              h.b([], ['3 · ']),
              'Each tool works on something real that the list does not show. That is where the surprises are.',
            ],
          ),
        ],
      ),
      h.div(
        [h.Class('intro-route')],
        [
          h.div(
            [h.Class('intro-route-head')],
            [
              h.h2([], ['The route, from easy to strange']),
              h.button(
                [
                  h.Type('button'),
                  h.Class('btn'),
                  h.OnClick(Message.SelectedStation({ station: 'valley' })),
                ],
                ['Start at step 00'],
              ),
              h.button(
                [
                  h.Type('button'),
                  h.Class('btn ghost'),
                  h.OnClick(Message.ClickedHome()),
                ],
                ['Or explore all tools freely'],
              ),
            ],
          ),
          h.p(
            [h.Class('tb-note')],
            [
              'Each step is one idea, one thing to try, one thing to notice. Everything runs in this page; the data is made up, the MCP messages are real.',
            ],
          ),
          h.ol(
            [h.Class('route-list')],
            Array.map(route, (step, index) => stepRow(model, step, index, h)),
          ),
        ],
      ),
    ],
  )

// The story card on each bench.
export const storyCardView = (model: Model, h: H): Html => {
  const index = stepOf(model.station)
  const step = route[index]
  if (step === undefined) {
    return h.empty
  }
  const next = route[index + 1]
  return h.section(
    [
      h.Class('story-card'),
      h.AriaLabel(`Step ${index} of ${route.length - 1}`),
    ],
    [
      h.div(
        [h.Class('story-top')],
        [
          h.span(
            [h.Class('story-step')],
            [
              `Step ${String(index).padStart(2, '0')} of ${String(route.length - 1).padStart(2, '0')}`,
            ],
          ),
          h.div(
            [h.Class('story-dots'), h.AriaHidden(true)],
            Array.map(route, (_, dot) =>
              h.span(
                [
                  h.Class(
                    `dot ${dot < index ? 'done' : dot === index ? 'now' : ''}`,
                  ),
                ],
                [],
              ),
            ),
          ),
          h.div(
            [h.Class('story-nav')],
            [
              h.button(
                [
                  h.Type('button'),
                  h.Class('btn ghost small'),
                  h.Disabled(index === 0),
                  h.OnClick(Message.ClickedRouteStep({ direction: 'back' })),
                ],
                ['Back'],
              ),
              h.button(
                [
                  h.Type('button'),
                  h.Class('btn small'),
                  h.Disabled(next === undefined),
                  h.OnClick(Message.ClickedRouteStep({ direction: 'next' })),
                ],
                [
                  next === undefined
                    ? 'End of the route'
                    : `Next: ${stationNames[next.station]}`,
                ],
              ),
            ],
          ),
        ],
      ),
      h.p([h.Class('story-idea')], [step.idea]),
      h.div(
        [h.Class('story-do')],
        [
          h.p([], [h.b([], ['Try this: ']), step.tryThis]),
          h.details(
            [h.Class('fold')],
            [h.summary([], ['What to notice']), h.p([], [step.notice])],
          ),
        ],
      ),
    ],
  )
}
