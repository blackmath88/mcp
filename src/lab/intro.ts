import { Array } from 'effect'
import { type Html, type HtmlBuilder } from 'foldkit/html'

import { catalogue } from '../domain/capabilities.ts'
import { iconView } from './icons.ts'
import { groundView } from './library.ts'
import { Message } from './message.ts'
import type { Model } from './model.ts'
import { stationNames } from './names.ts'
import {
  type StoryStep,
  route,
  stageNames,
  stepNumber,
  stepOf,
} from './story.ts'
import { tellView } from './tell.ts'

type H = HtmlBuilder<Message>

// The front door: what MCP is, told in five scenes beside one changing
// drawing (tell.ts), then the route through the lab from easy to strange.

const stepRow = (model: Model, step: StoryStep, h: H): Html => {
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
          h.Class('route-step'),
          h.OnClick(Message.SelectedStation({ station: step.station })),
        ],
        [
          h.span([h.Class('route-n')], [stepNumber(step.station)]),
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

const stages: ReadonlyArray<StoryStep['module']> = Array.dedupe(
  Array.map(route, step => step.module),
)

const routeView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('route-stages')],
    Array.map(stages, stage =>
      h.keyed('section')(
        stage,
        [
          h.Class(
            `route-stage ${stage === 'around' || stage === 'yours' ? 'aside' : ''}`,
          ),
        ],
        [
          h.h3([h.Class('route-stage-name')], [stageNames[stage]]),
          h.ol(
            [h.Class('route-list')],
            Array.map(
              Array.filter(route, step => step.module === stage),
              step => stepRow(model, step, h),
            ),
          ),
        ],
      ),
    ),
  )

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
              'MCP, the Model Context Protocol, is how an AI app finds out what another program can do for it, and then asks it to do it. Five short scenes; scroll, and the drawing changes with the story.',
            ],
          ),
          groundView(h, 'page'),
        ],
      ),
      tellView(model, h),
      h.div(
        [h.Class('intro-route')],
        [
          h.div(
            [h.Class('intro-route-head')],
            [h.h2([], ['The route: up the ladder, one slot at a time'])],
          ),
          h.p(
            [h.Class('tb-note')],
            [
              'Each step is one server: one idea, one thing to try, one thing to notice. Everything runs in this page; the data is made up, the MCP messages are real.',
            ],
          ),
          routeView(model, h),
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
      h.AriaLabel(`Step ${index + 1} of ${route.length}`),
    ],
    [
      h.div(
        [h.Class('story-top')],
        [
          h.span(
            [h.Class('story-step')],
            [
              `Step ${String(index + 1).padStart(2, '0')} of ${route.length} · ${stageNames[step.module]}`,
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
