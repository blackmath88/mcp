import { Array, Option, pipe } from 'effect'
import { type Document, type Html, type HtmlBuilder } from 'foldkit/html'

import route from '../../specimens/route.json'
import { STAGE_PAUSE_MILLISECONDS } from '../adapters/in-process.ts'
import { type Capability, type RunRecord } from '../domain/capabilities.ts'
import { pathLabel } from '../domain/memory.ts'
import type { ComponentId, EngineEvent } from '../domain/services.ts'
import { NO_ARTIFACT } from '../domain/world.ts'
import recording from '../recordings/entrances.json'
import {
  atlasScreenView,
  evidenceView,
  placeOnAtlas,
  toolChip,
} from './atlas.ts'
import { calledToolOf, findCapability } from './belt.ts'
import { benchView, bendView } from './benches.ts'
import {
  asLater,
  componentNames,
  componentRoles,
  componentsOf,
} from './components.ts'
import { creditView } from './credit.ts'
import { flowOf } from './flow.ts'
import {
  iconView,
  lineIcon,
  neighbourIcons,
  placeOfSlot,
  slotIcons,
} from './icons.ts'
import { introView, storyCardView } from './intro.ts'
import { landingView } from './landing.ts'
import { lensTabView } from './lens-view.ts'
import { libraryScreenView, shelfView } from './library.ts'
import { Message } from './message.ts'
import {
  type BackstageTab,
  type Model,
  Replay,
  RunState,
  type Station,
} from './model.ts'
import { serverNames, stationNames } from './names.ts'
import { type StoryStep, stepNumber, route as storyRoute } from './story.ts'
import { toolbenchView } from './toolbench.ts'
import { finishedRecord } from './update.ts'

type H = HtmlBuilder<Message>

// CONTENT

type Specimen = (typeof route.specimens)[number]

const stationTitle = (station: Station): string => stationNames[station]

const findSpecimen = (station: Station): Option.Option<Specimen> =>
  Array.findFirst(route.specimens, specimen => specimen.id === station)

// DERIVED

const visibleEvents = (model: Model): ReadonlyArray<EngineEvent> =>
  Option.match(finishedRecord(model.run), {
    onNone: () => [],
    onSome: record =>
      Replay.match(model.replay, {
        Complete: () => record.events,
        Paused: ({ cursor }) => Array.take(record.events, cursor),
        Playing: ({ cursor }) => Array.take(record.events, cursor),
      }),
  })

const outcomeText = (record: RunRecord): string => {
  if (record.outcome._tag === 'Failed') {
    return record.outcome.message
  }
  const output = record.outcome.output
  if (output._tag === 'MapRead') {
    return `${output.places.length} places, ${output.paths.length} paths, revision ${output.revision}, span limit ${output.maxSpan}.`
  }
  if (output._tag === 'RouteFound') {
    return `Route: ${output.route.places.join(' → ')} (span ${output.route.span}).`
  }
  if (output._tag === 'MapShown') {
    return `The map app opened, centred on ${output.place}.`
  }
  if (output._tag === 'ViewReported') {
    return output.differsFromToolResult
      ? `The app says it is looking at ${output.place}. That is not where the tool result said.`
      : `The app says it is looking at ${output.place}.`
  }
  if (output._tag === 'BatchDone') {
    return `${output.written} entries written as ${output.mode}. The caller received ${output.resultsReported} result(s).`
  }
  if (output._tag === 'ExpertReplied') {
    return `“${output.reply}”`
  }
  if (output._tag === 'LoopFinished') {
    return `Returned draft ${output.returnedDraft} of ${output.draftsWritten}: ${output.stoppedBecause.replace(/\.$/, '')}.`
  }
  if (output._tag === 'LoopResumed') {
    return output.generationsRedone === 0
      ? 'After the crash it continued at draft 3. Nothing was written twice.'
      : `After the crash it started over. ${output.generationsRedone} drafts were written a second time.`
  }
  if (output._tag === 'ServerProfiled') {
    return `${output.tools.length} tool(s) profiled on ${output.server}. ${output.changed === 0 ? 'Every definition matches its pin.' : `${output.changed} definition changed since it was pinned.`}`
  }
  if (output._tag === 'InventoryListed') {
    return `${output.tools.length} tools are offered. ${output.hidden === 0 ? 'None is hidden.' : `${output.hidden} is hidden by a name collision.`}`
  }
  if (output._tag === 'ToolCalled') {
    return `${output.name} was answered by the ${output.answeredBy}: “${output.answer}”`
  }
  if (output._tag === 'CliGenerated') {
    return `Generated a CLI from schema v${output.schemaVersion}. That schema is now baked in.`
  }
  if (output._tag === 'CratesShipped') {
    return `Shipped via ${output.via}, sending ${output.sentFields.join(' and ')}.`
  }
  if (output._tag === 'WentTo') {
    return `Client ${output.client} went to ${output.place}. Process #${output.childId} served it.`
  }
  if (output._tag === 'WhereAmI') {
    return `Client ${output.client} is told: ${output.place === '' ? 'nowhere yet' : output.place}. Process #${output.childId} answered.`
  }
  if (output._tag === 'FileRead') {
    return `${output.path}: “${output.content}”`
  }
  if (output._tag === 'SnapshotTaken') {
    return `The snapshot lists ${output.entries.length} controls. ${output.notExposed} more are on the page but not in it.`
  }
  if (output._tag === 'Clicked') {
    return `Clicked ${output.target} by ${output.how}. The page is now at revision ${output.pageRevision}.`
  }
  if (output._tag === 'Remembered') {
    return `Stored in ${output.storedAt}. The file now has ${output.factsInFile} line(s).`
  }
  if (output._tag === 'Recalled') {
    return Array.isReadonlyArrayEmpty(output.observations)
      ? `Nothing is stored about ${output.entity} at ${output.readFrom}.`
      : `${output.entity}: ${output.observations.join('; ')}.`
  }
  if (output._tag === 'PlanMade') {
    return `A plan written by ${output.madeBy}. ${output.checkedAgainstMap ? 'Derived from the map.' : 'Not checked against the map.'}`
  }
  if (output._tag === 'PageFetched') {
    return `Returned “${output.title}” from ${output.finalUrl} after ${output.hops.length} hop(s) and ${output.robotsChecks} robots check(s).`
  }
  if (output._tag === 'CartsListed') {
    return output.carts.join(' · ')
  }
  if (output._tag === 'CartReserved') {
    return `Reserved ${output.cart}. Chosen by ${output.chosenBy}.`
  }
  if (output._tag === 'CrateMoved') {
    return output.checked
      ? `${output.reported}`
      : `“${output.reported}” The controller accepted the command. Nothing checked where the crate ended up.`
  }
  if (output._tag === 'SensorRead') {
    return `The sensor sees the crate at ${output.crateAt}.`
  }
  if (output._tag === 'EntryWritten') {
    return `Wrote “${output.load}”. The ledger now has ${output.entriesNow} entr${output.entriesNow === 1 ? 'y' : 'ies'}.`
  }
  return output.artifact.summary
}

const failureOrigin = (record: RunRecord): Option.Option<ComponentId> =>
  pipe(
    record.events,
    Array.findFirst(event => event.kind === 'failed'),
    Option.map(event => event.component),
  )

const askedText = (model: Model, name: string): string =>
  model.approvedLast === name
    ? 'The host asked you first and you allowed it.'
    : model.approval === 'never'
      ? 'The host’s own rule is “never ask”.'
      : 'The host’s rule let it through without asking.'

type Answer = Readonly<{ question: string; answer: string }>

const fiveAnswers = (model: Model): ReadonlyArray<Answer> => {
  const maybeRecord = finishedRecord(model.run)
  const ask = (question: string, answer: (record: RunRecord) => string) => ({
    question,
    answer: Option.match(maybeRecord, { onNone: () => '', onSome: answer }),
  })
  return [
    ask('Who chose the action?', record => {
      const planned = Array.findFirst(
        record.events,
        event => event.operation === 'plan',
      )
      return Option.isSome(planned)
        ? 'You chose the goal. The planner chose which path to build. No model is involved on this page.'
        : 'You, by pressing a button on the bench. No model is involved on this page.'
    }),
    ask('Was anyone asked?', record =>
      record.events.some(event => event.component === 'person')
        ? `Yes, by the server: it sent elicitation/create in the middle of the call and waited for your answer. ${askedText(model, record.capability)}`
        : pipe(
            record.events,
            Array.findFirst(
              event =>
                event.component === 'validator' ||
                event.component === 'robots-policy' ||
                event.component === 'boundary',
            ),
            Option.match({
              onNone: () =>
                `${model.approvedLast === record.capability ? 'Yes.' : 'No.'} ${askedText(model, record.capability)} No component checked the request.`,
              onSome: event =>
                `${model.approvedLast === record.capability ? 'Yes.' : 'No.'} ${askedText(model, record.capability)} The ${componentNames[event.component].toLowerCase()} applied a rule in code.`,
            }),
          ),
    ),
    ask(
      'Where did it run?',
      record =>
        `In this browser tab, across ${
          pipe(
            record.events,
            Array.map(event => event.component),
            Array.dedupe,
          ).length
        } engine components.`,
    ),
    ask('What state changed?', record =>
      pipe(
        record.events,
        Array.filter(event => event.kind === 'state-changed'),
        Array.match({
          onEmpty: () => 'Nothing.',
          onNonEmpty: changes =>
            Array.map(
              changes,
              change =>
                `${componentNames[change.component]}: ${change.operation}.`,
            ).join(' '),
        }),
      ),
    ),
    ask('What evidence reached you?', record =>
      Option.match(failureOrigin(record), {
        onNone: () =>
          `${record.events.length} engine events and the result shown onstage.`,
        onSome: component =>
          `${record.events.length} engine events. The first failure is in the ${componentNames[component].toLowerCase()}.`,
      }),
    ),
  ]
}

// VIEW

export const view = (model: Model, h: H): Document => ({
  title: 'MCP Lab',
  body:
    model.screen === 'landing'
      ? h.div([h.Class('ide landing-shell')], [landingView(model, h)])
      : model.screen === 'intro'
        ? h.div(
            [h.Class('ide shell-atlas')],
            [
              titlebarView(model, h),
              h.nav(
                [h.Class('sidebar'), h.AriaLabel('Specimens')],
                [journeyView(model, h)],
              ),
              introView(model, h),
              statusbarView(model, h),
            ],
          )
        : model.screen === 'library'
          ? h.div(
              [h.Class('ide shell-atlas')],
              [
                titlebarView(model, h),
                h.nav(
                  [h.Class('sidebar'), h.AriaLabel('Specimens')],
                  [journeyView(model, h)],
                ),
                libraryScreenView(model, h),
                statusbarView(model, h),
              ],
            )
          : model.screen === 'home'
            ? h.div(
                [h.Class('ide shell-atlas')],
                [
                  titlebarView(model, h),
                  h.nav(
                    [h.Class('sidebar'), h.AriaLabel('Specimens')],
                    [journeyView(model, h)],
                  ),
                  atlasScreenView(model, h),
                  statusbarView(model, h),
                ],
              )
            : h.div(
                [h.Class(`ide backstage-${model.backstage}`)],
                [
                  titlebarView(model, h),
                  h.nav(
                    [h.Class('sidebar'), h.AriaLabel('Specimens')],
                    [journeyView(model, h)],
                  ),
                  workbenchView(model, h),
                  inspectorView(model, h),
                  backstageView(model, h),
                  statusbarView(model, h),
                ],
              ),
})

const brandView = (h: H): Html =>
  h.button(
    [
      h.Type('button'),
      h.Class('brand'),
      h.AriaLabel('MCP Lab, back to the start'),
      h.OnClick(Message.ClickedLanding()),
    ],
    [
      h.span([h.Class('brandmark'), h.AriaHidden(true)], []),
      h.span([h.Class('brandname')], ['MCP Lab']),
    ],
  )

const titlebarView = (model: Model, h: H): Html =>
  h.header(
    [h.Class('titlebar')],
    [
      h.p(
        [h.Class('location'), h.AriaLabel('Current location')],
        model.screen === 'intro'
          ? [h.b([], ['What is MCP?'])]
          : model.screen === 'library'
            ? [
                h.button(
                  [
                    h.Type('button'),
                    h.Class('crumb'),
                    h.OnClick(Message.ClickedIntro()),
                  ],
                  ['← What is MCP?'],
                ),
                ' / ',
                h.b([], ['Out in the world']),
              ]
            : model.screen === 'home'
              ? [
                  h.button(
                    [
                      h.Type('button'),
                      h.Class('crumb'),
                      h.OnClick(Message.ClickedIntro()),
                    ],
                    ['← What is MCP?'],
                  ),
                  ' / ',
                  h.b([], ['All tools']),
                ]
              : [
                  h.button(
                    [
                      h.Type('button'),
                      h.Class('crumb'),
                      h.OnClick(Message.ClickedIntro()),
                    ],
                    ['← What is MCP?'],
                  ),
                  ' / ',
                  h.button(
                    [
                      h.Type('button'),
                      h.Class('crumb'),
                      h.OnClick(Message.ClickedShowOnAtlas()),
                    ],
                    ['All tools'],
                  ),
                  ' / ',
                  h.b(
                    [],
                    [
                      `${stepNumber(model.station)} · ${stationTitle(model.station)}`,
                    ],
                  ),
                ],
      ),
      h.span(
        [h.Class('simtag')],
        [
          model.connection === 'connected'
            ? 'Real MCP · made-up data'
            : model.connection === 'connecting'
              ? 'Connecting…'
              : 'Offline · made-up data',
        ],
      ),
    ],
  )

// SIDEBAR

// THE ROUTE, as a calm list grouped by the slot each step lights.

const stageLabels: Record<StoryStep['module'], string> = {
  read: 'Read',
  ask: 'Ask',
  write: 'Write',
  compute: 'Compute',
  sequence: 'Sequence',
  share: 'Share',
  invent: 'Invent',
  delegate: 'Delegate',
  act: 'Act',
  around: 'Side trips',
  yours: 'Your own server',
}

const stageIcon = (stage: StoryStep['module'], h: H): Html =>
  stage === 'around'
    ? lineIcon(neighbourIcons.program, 'ic side-ic place-phone', h)
    : stage === 'yours'
      ? lineIcon(neighbourIcons.files, 'ic side-ic place-shelf', h)
      : lineIcon(slotIcons[stage], `ic side-ic place-${placeOfSlot(stage)}`, h)

const wasVisited = (model: Model, station: Station): boolean =>
  model.savedRuns.some(
    entry =>
      entry.station === station && !RunState.isAnyOf(['Idle'])(entry.run),
  )

const stationButton = (model: Model, station: Station, h: H): Html =>
  h.button(
    [
      h.Type('button'),
      h.Class(`nav-row ${wasVisited(model, station) ? 'visited' : ''}`),
      h.AriaCurrent(
        station === model.station && model.screen === 'bench'
          ? 'page'
          : 'false',
      ),
      h.OnClick(Message.SelectedStation({ station })),
    ],
    [
      h.span([h.Class('nav-n')], [stepNumber(station)]),
      h.span([h.Class('nav-t')], [stationTitle(station)]),
    ],
  )

const stagesInOrder: ReadonlyArray<StoryStep['module']> = Array.dedupe(
  Array.map(storyRoute, step => step.module),
)

const journeyView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('journey-groups')],
    [
      brandView(h),
      h.div(
        [h.Class('nav-top')],
        [
          h.button(
            [
              h.Type('button'),
              h.Class('nav-row top'),
              h.AriaCurrent(model.screen === 'intro' ? 'page' : 'false'),
              h.OnClick(Message.ClickedIntro()),
            ],
            [h.span([h.Class('nav-t')], ['What is MCP?'])],
          ),
          h.button(
            [
              h.Type('button'),
              h.Class('nav-row top'),
              h.AriaCurrent(model.screen === 'home' ? 'page' : 'false'),
              h.OnClick(Message.ClickedHome()),
            ],
            [h.span([h.Class('nav-t')], ['All tools and your server'])],
          ),
          h.button(
            [
              h.Type('button'),
              h.Class('nav-row top'),
              h.AriaCurrent(model.screen === 'library' ? 'page' : 'false'),
              h.OnClick(Message.ClickedLibrary()),
            ],
            [h.span([h.Class('nav-t')], ['Out in the world'])],
          ),
        ],
      ),
      h.nav(
        [h.Class('nav'), h.AriaLabel('The route')],
        [
          h.p([h.Class('nav-title')], ['The route']),
          ...Array.map(stagesInOrder, stage =>
            h.keyed('section')(
              stage,
              [
                h.Class(
                  `nav-stage ${stage === 'around' || stage === 'yours' ? 'aside' : ''}`,
                ),
              ],
              [
                h.div(
                  [h.Class('nav-stage-head')],
                  [stageIcon(stage, h), h.span([], [stageLabels[stage]])],
                ),
                h.ul(
                  [h.Class('nav-list')],
                  Array.map(
                    Array.filter(storyRoute, step => step.module === stage),
                    step =>
                      h.keyed('li')(
                        step.station,
                        [],
                        [stationButton(model, step.station, h)],
                      ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ],
  )

// INSPECTOR

const inspectorView = (model: Model, h: H): Html =>
  h.aside(
    [h.Class('inspector'), h.AriaLabel('Evidence')],
    [
      h.div(
        [h.Class('card ran')],
        [
          h.div(
            [h.Class('cardhead')],
            [
              h.h3([], ['On the wire']),
              h.span(
                [h.Class('meta')],
                [`${model.frames.length} frames in this tab`],
              ),
            ],
          ),
          Array.match(Array.takeRight(model.frames, 6), {
            onEmpty: () =>
              h.p([h.Class('side-note')], ['Nothing has crossed yet.']),
            onNonEmpty: frames =>
              h.ol(
                [h.Class('wire')],
                Array.map(frames, (frame, index) =>
                  h.keyed('li')(
                    `${model.frames.length}-${index}`,
                    [
                      h.DataAttribute(
                        'kind',
                        frame.direction === 'client → server' ? 'req' : 'res',
                      ),
                    ],
                    [
                      h.span(
                        [h.Class('arrow'), h.AriaHidden(true)],
                        [frame.direction === 'client → server' ? '→' : '←'],
                      ),
                      Option.match(calledToolOf(frame), {
                        onNone: () => h.span([h.Class('lab')], [frame.label]),
                        onSome: capability =>
                          h.span(
                            [h.Class('lab')],
                            [`${frame.label} `, toolChip(model, capability, h)],
                          ),
                      }),
                    ],
                  ),
                ),
              ),
          }),
          h.button(
            [
              h.Type('button'),
              h.Class('btn ghost small'),
              h.OnClick(Message.SelectedTab({ tab: 'frames' })),
            ],
            ['Open the frames'],
          ),
        ],
      ),
      Option.match(Option.flatMap(model.maybeSelected, findCapability), {
        onNone: () => h.empty,
        onSome: capability =>
          capability.specimen === model.station
            ? h.empty
            : cardView(model, capability, h),
      }),
      Option.match(finishedRecord(model.run), {
        onNone: () => h.empty,
        onSome: () =>
          h.details(
            [h.Class('card fold-card')],
            [
              h.summary([], ['About your last run']),
              Option.match(
                Option.flatMap(finishedRecord(model.run), record =>
                  findCapability(record.capability),
                ),
                {
                  onNone: () => h.empty,
                  onSome: capability =>
                    h.p(
                      [h.Class('producer')],
                      ['Produced by ', toolChip(model, capability, h)],
                    ),
                },
              ),
              fiveView(model, h),
            ],
          ),
      }),
      h.details(
        [h.Class('fold')],
        [
          h.summary([], ['What is real on this page']),
          h.p(
            [h.Class('side-note')],
            [
              'Every run is a real tools/call from a real MCP client to a real MCP server, both in this tab, over an in-memory transport. The data is made up. There is no model and no network; the host asks you only if you set an approval rule on the bench. Discovering an item is not permission to use it; here nothing checks who you are.',
            ],
          ),
        ],
      ),
    ],
  )

const cardView = (model: Model, capability: Capability, h: H): Html =>
  h.div(
    [h.Class('card')],
    [
      h.div(
        [h.Class('detail-head')],
        [
          h.span([h.Class('bigicon')], [iconView(capability.name, h)]),
          h.div(
            [],
            [
              h.h3([], [capability.title]),
              h.p([h.Class('mono')], [capability.name]),
            ],
          ),
        ],
      ),
      h.p([h.Class('desc')], [capability.description]),
      h.p(
        [h.Class('side-note')],
        [
          `Exposed by the ${serverNames[capability.specimen]}. On the map: ${placeOnAtlas(capability)}.`,
        ],
      ),
      h.button(
        [
          h.Type('button'),
          h.Class('btn ghost small'),
          h.OnClick(Message.ClickedShowOnAtlas()),
        ],
        ['Show on the atlas'],
      ),
      h.details(
        [h.Class('fold')],
        [
          h.summary([], ['What is known about it']),
          evidenceView(model, capability, h),
        ],
      ),
      h.details(
        [h.Class('fold')],
        [
          h.summary([], ['Six facts about this item']),
          h.dl(
            [h.Class('facts')],
            [
              factView('What can I observe?', capability.observe, h),
              factView('What can I request?', capability.request, h),
              factView('What does it produce?', capability.produces, h),
              factView('What can change?', capability.changes, h),
              factView('When does it finish?', capability.finishes, h),
              factView(
                'What does it depend on?',
                Array.map(
                  capability.dependsOn,
                  component => componentNames[component],
                ).join(', '),
                h,
              ),
            ],
          ),
        ],
      ),
    ],
  )

const factView = (question: string, answer: string, h: H): Html =>
  h.div([], [h.dt([], [question]), h.dd([], [answer])])

// STATUS BAR

const statusbarView = (model: Model, h: H): Html =>
  h.footer(
    [h.Class('statusbar')],
    [
      creditView(h),
      h.span([], ['Made-up data · real MCP client and server in this tab']),
      h.span([], ['No model · no network']),
      h.span(
        [],
        [
          model.station === 'ask'
            ? `server build: ${model.world.ask.build === 'asks' ? 'asks you' : 'picks itself'}`
            : model.station === 'arm'
              ? 'simulated crane · nothing physical moves'
              : Option.isSome(asLater(model.station))
                ? 'every model here is a scripted stand-in'
                : model.station === 'valley'
                  ? `${model.weather} valley · map revision ${model.world.revision}`
                  : model.station === 'fetch'
                    ? `robots policy: ${model.world.fetchPolicy}`
                    : model.station === 'memory'
                      ? `storage: ${pathLabel[model.world.memory.storagePath]} · server start #${model.serverStarts}`
                      : model.station === 'thinking'
                        ? `build: ${model.world.thinkingMode}`
                        : model.station === 'filesystem'
                          ? `allowed now: ${model.world.files.allowed.join(', ') || 'nothing'}`
                          : model.station === 'cli'
                            ? `server schema v${model.world.cli.serverSchema} · CLI embeds ${model.world.cli.artifactSchema === NO_ARTIFACT ? 'nothing yet' : `v${model.world.cli.artifactSchema}`}`
                            : model.station === 'local-remote'
                              ? `${model.world.gateway.children.length} server process(es) behind the gateway`
                              : model.station === 'perception'
                                ? `page revision ${model.world.page.revision} · ${model.world.page.mode}`
                                : 'reference only · unverified',
        ],
      ),
    ],
  )

// SPECIMEN

const specimenView = (specimen: Specimen, title: string, h: H): Html =>
  h.div(
    [h.Class('specimen')],
    [
      h.div(
        [h.Class('prompt')],
        [
          h.div(
            [],
            [
              h.p(
                [h.Class('kicker')],
                [
                  specimen.anchor.repo === 'no upstream server'
                    ? `${title} · the lab’s own`
                    : `${title} · after ${specimen.anchor.repo}`,
                ],
              ),
              h.h2([h.Class('question')], [specimen.question]),
            ],
          ),
          h.span(
            [h.Class('pill')],
            [
              specimen.status === 'simulated'
                ? 'Simulated here'
                : 'Reference only · not built',
            ],
          ),
        ],
      ),
      h.details(
        [h.Class('pop about')],
        [
          h.summary([h.Class('pop-btn')], ['About this specimen']),
          h.div(
            [h.Class('pop-panel')],
            [
              h.h4([], ['Anchor']),
              h.p(
                [],
                [h.b([], [`${specimen.anchor.repo}. `]), specimen.anchor.note],
              ),
              ...Array.map(specimen.diversions, diversion =>
                h.p(
                  [],
                  [h.b([], [`Diversion, ${diversion.repo}: `]), diversion.note],
                ),
              ),
              h.h4([], ['Where it bends']),
              h.p([], [specimen.bent]),
              h.p([], [h.b([], ['Experiment: ']), specimen.experiment]),
              h.h4(
                [],
                [
                  `Sources (${specimen.sources.length}), ${'checked' in specimen ? 'read, not pinned' : 'unverified'}`,
                ],
              ),
              'checked' in specimen ? h.p([], [specimen.checked]) : h.empty,
              h.ul(
                [h.Class('sources')],
                Array.map(specimen.sources, source =>
                  h.keyed('li')(
                    source,
                    [],
                    [
                      h.a(
                        [
                          h.Href(source),
                          h.Target('_blank'),
                          h.Rel('noreferrer'),
                        ],
                        [source.replace('https://github.com/', '')],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ],
  )

// ONSTAGE

const benchToolsView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('benchtools')],
    [
      bendView(model, h),
      RunState.isAnyOf(['Running'])(model.run)
        ? h.button(
            [
              h.Type('button'),
              h.Class('btn ghost small'),
              h.OnClick(Message.ClickedCancel()),
            ],
            ['Cancel'],
          )
        : h.empty,
      h.button(
        [
          h.Type('button'),
          h.Class('btn ghost small'),
          h.OnClick(Message.ClickedReset()),
        ],
        ['Reset experiment'],
      ),
    ],
  )

// The route server is the lab's own; it has no upstream anchor in route.json.
const valleyHeadView = (h: H): Html =>
  h.div(
    [h.Class('prompt')],
    [
      h.div(
        [],
        [
          h.p([h.Class('kicker')], ['Find or build a route · the lab’s own']),
          h.h2(
            [h.Class('question')],
            ['Does this tool answer a question, or change something?'],
          ),
        ],
      ),
      h.span([h.Class('pill')], ['Simulated here']),
    ],
  )

const workbenchView = (model: Model, h: H): Html =>
  h.main(
    [h.Class('workbench'), h.AriaLabel('Workbench')],
    [
      h.div(
        [h.Class('panehead')],
        [
          h.span([h.Class('eyebrow')], ['Onstage · what you see']),
          model.station === 'code-mode' &&
          model.python !== 'idle' &&
          RunState.isAnyOf(['Idle'])(model.run)
            ? pythonPill(model, h)
            : runPill(model.run, h),
        ],
      ),
      Option.match(findSpecimen(model.station), {
        onNone: () => valleyHeadView(h),
        onSome: specimen =>
          specimenView(specimen, stationTitle(model.station), h),
      }),
      toolbenchView(
        model,
        {
          story: storyCardView(model, h),
          controls: benchToolsView(model, h),
          material: benchView(model, h),
          result:
            model.station === 'code-mode' &&
            model.python !== 'idle' &&
            RunState.isAnyOf(['Idle'])(model.run)
              ? h.p(
                  [h.Class('result')],
                  [
                    `Python ${model.python === 'running' ? 'is running' : model.pythonError === '' ? 'finished' : 'stopped with an error'}. Each ledger.write was its own tools/call; see the frames.`,
                  ],
                )
              : resultView(model, h),
          happened: happenedView(model, h),
          stays: staysView(model, h),
        },
        h,
      ),
      shelfView(model.station, h),
    ],
  )

const happenedView = (model: Model, h: H): Html =>
  Option.match(finishedRecord(model.run), {
    onNone: () => h.empty,
    onSome: record => {
      const shown = visibleEvents(model)
      const isPlaying = Replay.isAnyOf(['Playing'])(model.replay)
      return h.div(
        [h.Class('tb-happened')],
        [
          h.div(
            [h.Class('tb-happened-head')],
            [
              h.b([], ['How it happened']),
              h.span(
                [h.Class('tb-note')],
                [`${shown.length} of ${record.events.length} engine events`],
              ),
              h.button(
                [
                  h.Type('button'),
                  h.Class('btn ghost small'),
                  h.OnClick(
                    isPlaying ? Message.ClickedPause() : Message.ClickedWatch(),
                  ),
                ],
                [isPlaying ? 'Pause' : 'Watch it again'],
              ),
            ],
          ),
          h.div(
            [h.Class('flow'), h.AriaLabel('The path this call took')],
            [
              h.span(
                [h.Class('flow-stop tool reached')],
                [
                  Option.match(findCapability(record.capability), {
                    onNone: () => h.empty,
                    onSome: capability => iconView(capability.name, h),
                  }),
                  h.span([], [record.capability]),
                ],
              ),
              ...Array.flatMap(flowOf(record, shown), stop => [
                h.span(
                  [
                    h.Class(`flow-arrow ${stop.reached ? 'reached' : ''}`),
                    h.AriaHidden(true),
                  ],
                  ['→'],
                ),
                h.span(
                  [
                    h.Class(
                      `flow-stop ${stop.reached ? 'reached' : ''} ${stop.isCurrent && isPlaying ? 'now' : ''} ${stop.changed ? 'changed' : ''} ${stop.failed ? 'failed' : ''}`,
                    ),
                  ],
                  [componentNames[stop.component]],
                ),
              ]),
              h.span(
                [
                  h.Class(
                    `flow-arrow ${shown.length === record.events.length ? 'reached' : ''}`,
                  ),
                  h.AriaHidden(true),
                ],
                ['→'],
              ),
              h.span(
                [
                  h.Class(
                    `flow-stop end ${shown.length === record.events.length ? 'reached' : ''} ${record.outcome._tag === 'Failed' ? 'failed' : ''}`,
                  ),
                ],
                [
                  record.outcome._tag === 'Failed'
                    ? 'error back'
                    : 'result back',
                ],
              ),
            ],
          ),
          h.ol(
            [h.Class('tb-events')],
            Array.map(shown, (event, index) =>
              h.keyed('li')(
                `${event.seq}`,
                [
                  h.Class(
                    `${event.kind} ${index === shown.length - 1 && isPlaying ? 'now' : ''}`,
                  ),
                ],
                [
                  h.span([h.Class('who')], [componentNames[event.component]]),
                  h.span([h.Class('what')], [event.operation]),
                ],
              ),
            ),
          ),
        ],
      )
    },
  })

const staysView = (model: Model, h: H): Html => {
  if (
    model.station === 'code-mode' &&
    model.python !== 'idle' &&
    RunState.isAnyOf(['Idle'])(model.run)
  ) {
    return h.div(
      [h.Class('tb-stamp')],
      [
        h.b([], ['The ledger now holds']),
        h.p(
          [],
          [
            model.world.ledger.entries.length === 0
              ? 'nothing'
              : model.world.ledger.entries.join(', '),
          ],
        ),
        h.p([h.Class('side-note')], ['There is no undo.']),
      ],
    )
  }
  return Option.match(finishedRecord(model.run), {
    onNone: () =>
      h.p([h.Class('tb-quiet')], ['Nothing has run on this bench yet.']),
    onSome: record => {
      const changes = Array.filter(
        visibleEvents(model),
        event =>
          event.kind === 'state-changed' || event.kind === 'artifact-produced',
      )
      return Array.match(changes, {
        onEmpty: () =>
          h.p(
            [h.Class('tb-quiet')],
            [
              !Replay.isAnyOf(['Complete'])(model.replay)
                ? 'Nothing yet, at this point of the replay.'
                : record.outcome._tag === 'Failed'
                  ? 'Nothing. It failed before changing anything.'
                  : 'Nothing. This call left everything as it was.',
            ],
          ),
        onNonEmpty: shown =>
          h.div(
            [h.Class('tb-stamp')],
            [
              ...Array.map(shown, event =>
                h.p(
                  [],
                  [
                    h.b([], [`${componentNames[event.component]}: `]),
                    event.operation,
                  ],
                ),
              ),
              record.outcome._tag === 'Failed'
                ? h.p(
                    [h.Class('side-note')],
                    ['It failed after this. Nothing was rolled back.'],
                  )
                : h.empty,
            ],
          ),
      })
    },
  })
}

const pythonPill = (model: Model, h: H): Html =>
  model.python === 'running'
    ? h.span([h.Class('pill busy')], ['Running Python'])
    : model.python === 'unavailable'
      ? h.span([h.Class('pill warn')], ['Python unavailable'])
      : model.pythonError === ''
        ? h.span([h.Class('pill ok')], ['Python finished'])
        : h.span([h.Class('pill warn')], ['Python stopped'])

const runPill = (run: RunState, h: H): Html =>
  RunState.match(run, {
    Idle: () => h.span([h.Class('pill')], ['Idle']),
    Running: ({ capability }) =>
      h.span([h.Class('pill busy')], [`Running ${capability}`]),
    Succeeded: () => h.span([h.Class('pill ok')], ['Succeeded']),
    Failed: () => h.span([h.Class('pill warn')], ['Failed']),
    Cancelled: () => h.span([h.Class('pill')], ['Cancelled']),
  })

const undoneText = (record: RunRecord): string =>
  record.events.some(event => event.kind === 'state-changed')
    ? 'Something changed before the failure. Check the trace.'
    : record.capability === 'build_path' ||
        record.capability === 'connect_places'
      ? `Nothing was built. The map is still at revision ${record.revisionAfter}.`
      : 'Nothing changed.'

const afterRunView = (record: RunRecord, h: H): Html =>
  h.div(
    [h.Class('afterrun')],
    [
      h.details(
        [h.Class('fold')],
        [
          h.summary([], ['What changed?']),
          pipe(
            record.events,
            Array.filter(event => event.kind === 'state-changed'),
            Array.match({
              onEmpty: () => h.p([], ['Nothing. This run changed no state.']),
              onNonEmpty: changes =>
                h.ul(
                  [],
                  Array.map(changes, change =>
                    h.keyed('li')(
                      String(change.seq),
                      [],
                      [
                        `${componentNames[change.component]}: ${change.operation}. ${change.detail}`,
                      ],
                    ),
                  ),
                ),
            }),
          ),
        ],
      ),
      h.button(
        [
          h.Type('button'),
          h.Class('btn ghost small'),
          h.OnClick(Message.ClickedInspectRun()),
        ],
        ['Inspect run'],
      ),
    ],
  )

const resultView = (model: Model, h: H): Html =>
  RunState.match(model.run, {
    Idle: () =>
      h.p(
        [h.Class('result idle')],
        [
          'Nothing run yet. Use something on the bench; what happens shows here.',
        ],
      ),
    Running: () =>
      h.p(
        [h.Class('result'), h.AriaLive('polite')],
        [
          `The engine is working. Each stage is slowed by ${STAGE_PAUSE_MILLISECONDS} ms so you can cancel.`,
        ],
      ),
    Succeeded: ({ record }) =>
      h.div(
        [h.Class('result ok'), h.AriaLive('polite')],
        [h.p([], [outcomeText(record)]), afterRunView(record, h)],
      ),
    Failed: ({ record }) =>
      h.div(
        [h.Class('result warn'), h.AriaLive('polite')],
        [
          h.p([], [outcomeText(record)]),
          h.p([], [undoneText(record)]),
          afterRunView(record, h),
        ],
      ),
    Cancelled: ({ capability }) =>
      h.p(
        [h.Class('result'), h.AriaLive('polite')],
        [
          `You cancelled ${capability} before the engine reported. On this page state is only replaced when a run reports back, so nothing changed.`,
        ],
      ),
  })

// BACKSTAGE

const tabs: ReadonlyArray<Readonly<{ id: BackstageTab; label: string }>> = [
  { id: 'frames', label: 'MCP frames' },
  { id: 'console', label: 'Call console' },
  { id: 'lens', label: 'Lens' },
  { id: 'engine', label: 'Engine events' },
  { id: 'app', label: 'App messages' },
  { id: 'recording', label: 'Recorded CLI + MCP' },
  { id: 'network', label: 'Network' },
]

const backstageView = (model: Model, h: H): Html =>
  h.section(
    [h.Class('panel'), h.AriaLabel('Backstage')],
    [
      h.div(
        [h.Class('panehead')],
        [
          h.span(
            [h.Class('eyebrow')],
            [
              model.backstage === 'collapsed'
                ? 'Backstage · frames, console, Lens, engine events, recordings'
                : 'Backstage · what actually happened',
            ],
          ),
          h.button(
            [
              h.Type('button'),
              h.Class('toggle'),
              h.AriaExpanded(model.backstage === 'open'),
              h.OnClick(Message.ClickedToggleBackstage()),
            ],
            [model.backstage === 'open' ? 'Collapse' : 'Expand'],
          ),
        ],
      ),
      model.backstage === 'collapsed'
        ? h.empty
        : h.div(
            [h.Class('tabs'), h.Role('group'), h.AriaLabel('Evidence')],
            Array.map(tabs, tab =>
              h.button(
                [
                  h.Type('button'),
                  h.AriaPressed(model.tab === tab.id ? 'true' : 'false'),
                  h.OnClick(Message.SelectedTab({ tab: tab.id })),
                ],
                [tab.label],
              ),
            ),
          ),
      model.backstage === 'collapsed'
        ? h.empty
        : model.tab === 'console'
          ? consoleTabView(model, h)
          : model.tab === 'lens'
            ? lensTabView(model, h)
            : model.tab === 'frames'
              ? framesTabView(model, h)
              : model.tab === 'engine'
                ? engineTabView(model, h)
                : model.tab === 'app'
                  ? appTabView(model, h)
                  : model.tab === 'recording'
                    ? recordingTabView(model, h)
                    : networkView(model, h),
    ],
  )

const modeView = (mode: string, detail: string, h: H): Html =>
  h.p([h.Class('mode')], [h.b([], [mode]), ` · ${detail}`])

const consolePresets: ReadonlyArray<Readonly<{ id: string; label: string }>> = [
  { id: 'valid', label: 'A valid call' },
  { id: 'wrong-arguments', label: 'Wrong arguments' },
  { id: 'no-name', label: 'No tool name' },
  { id: 'unknown-method', label: 'Unknown method' },
  { id: 'not-a-request', label: 'Not a request' },
  { id: 'not-json', label: 'Not JSON' },
]

const consoleTabView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('tabpane')],
    [
      modeView(
        'Your own message',
        'sent exactly as written to the real server in this tab, past the client’s checks. Break it and see what comes back.',
        h,
      ),
      h.div(
        [h.Class('presets'), h.Role('group'), h.AriaLabel('Start from')],
        Array.map(consolePresets, preset =>
          h.button(
            [
              h.Type('button'),
              h.OnClick(Message.ClickedConsolePreset({ preset: preset.id })),
            ],
            [preset.label],
          ),
        ),
      ),
      h.label(
        [h.For('console-text'), h.Class('console-label')],
        ['Message to send'],
      ),
      h.textarea([
        h.Id('console-text'),
        h.Class('console-text'),
        h.Rows(9),
        h.Spellcheck(false),
        h.Value(model.consoleText),
        h.OnInput(value => Message.UpdatedConsoleText({ value })),
      ]),
      h.div(
        [h.Class('replay')],
        [
          h.button(
            [
              h.Type('button'),
              h.Class('send'),
              h.Disabled(model.consoleText.trim() === ''),
              h.OnClick(Message.ClickedSendRaw()),
            ],
            ['Send to the server'],
          ),
          h.span([h.Class('count'), h.AriaLive('polite')], [model.consoleNote]),
        ],
      ),
      h.ol(
        [h.Class('log')],
        Array.map(Array.takeRight(model.frames, 4), (frame, index) =>
          h.keyed('li')(
            `${model.frames.length}-${index}`,
            [
              h.DataAttribute(
                'kind',
                frame.direction === 'client → server' ? 'req' : 'res',
              ),
            ],
            [
              h.span([h.Class('n')], ['·']),
              h.span([h.Class('hop')], [frame.direction]),
              h.details(
                [h.Class('lab'), h.Open(true)],
                [h.summary([], [frame.label]), h.pre([], [frame.json])],
              ),
            ],
          ),
        ),
      ),
    ],
  )

const framesTabView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('tabpane')],
    [
      model.transport === 'mcp-in-tab'
        ? modeView(
            'Actual MCP connection',
            'a real SDK client and a real server, both running in this tab, joined by the in-memory transport. Nothing crossed a network.',
            h,
          )
        : modeView(
            'No MCP connection for this run',
            'the in-tab connection failed, so the engine was called directly. There are no frames to show.',
            h,
          ),
      Array.match(model.frames, {
        onEmpty: () =>
          h.p(
            [h.Class('quiet')],
            ['No frames yet. Run something on this station to see them.'],
          ),
        onNonEmpty: frames =>
          h.ol(
            [h.Class('log')],
            Array.map(frames, (frame, index) =>
              h.keyed('li')(
                String(index),
                [
                  h.DataAttribute(
                    'kind',
                    frame.direction === 'client → server' ? 'req' : 'res',
                  ),
                ],
                [
                  h.span([h.Class('n')], [String(index + 1)]),
                  h.span([h.Class('hop')], [frame.direction]),
                  h.details(
                    [h.Class('lab')],
                    [h.summary([], [frame.label]), h.pre([], [frame.json])],
                  ),
                ],
              ),
            ),
          ),
      }),
    ],
  )

const engineTabView = (model: Model, h: H): Html => {
  const total = Option.match(finishedRecord(model.run), {
    onNone: () => 0,
    onSome: record => record.events.length,
  })
  const shown = visibleEvents(model)
  const isPlaying = Replay.isAnyOf(['Playing'])(model.replay)
  return h.div(
    [h.Class('tabpane')],
    [
      modeView(
        'In-process domain execution',
        'emitted by the engine inside the server handler, in this tab. These are not protocol messages; see MCP frames for those.',
        h,
      ),
      total === 0
        ? h.p(
            [h.Class('quiet')],
            [
              RunState.isAnyOf(['Running'])(model.run)
                ? 'Running. Events appear when the engine reports back.'
                : 'No run yet. Use something on the bench to see what the engine does.',
            ],
          )
        : h.div(
            [h.Class('replay')],
            [
              h.span(
                [h.Class('count'), h.AriaLive('polite')],
                [`Showing ${shown.length} of ${total} events`],
              ),
              h.button(
                [h.Type('button'), h.OnClick(Message.ClickedReplayFromStart())],
                ['From the start'],
              ),
              h.button(
                [
                  h.Type('button'),
                  h.Disabled(shown.length >= total),
                  h.OnClick(Message.ClickedStep()),
                ],
                ['Step'],
              ),
              isPlaying
                ? h.button(
                    [h.Type('button'), h.OnClick(Message.ClickedPause())],
                    ['Pause'],
                  )
                : h.button(
                    [h.Type('button'), h.OnClick(Message.ClickedPlay())],
                    ['Play'],
                  ),
              h.button(
                [
                  h.Type('button'),
                  h.Disabled(shown.length >= total),
                  h.OnClick(Message.ClickedShowAll()),
                ],
                ['Show all'],
              ),
            ],
          ),
      h.ol(
        [h.Class('log')],
        Array.map(shown, event =>
          h.keyed('li')(
            String(event.seq),
            [h.DataAttribute('kind', event.kind)],
            [
              h.span([h.Class('n')], [String(event.seq)]),
              h.span(
                [h.Class('hop')],
                [
                  `${componentNames[event.calledBy]} → ${componentNames[event.component]}`,
                ],
              ),
              h.span([h.Class('kind')], [event.kind]),
              h.span(
                [h.Class('lab')],
                [
                  event.detail === ''
                    ? event.operation
                    : `${event.operation}: ${event.detail}`,
                ],
              ),
            ],
          ),
        ),
      ),
    ],
  )
}

const appTabView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('tabpane')],
    [
      modeView(
        'Application state transitions',
        'the Foldkit messages this page handled, newest last. Your clicks and command results, not the engine and not a protocol.',
        h,
      ),
      Array.match(model.appLog, {
        onEmpty: () =>
          h.p([h.Class('quiet')], ['Nothing yet. Every click lands here.']),
        onNonEmpty: entries =>
          h.ol(
            [h.Class('log')],
            Array.map(entries, entry =>
              h.keyed('li')(
                String(entry.seq),
                [h.DataAttribute('kind', 'app')],
                [
                  h.span([h.Class('n')], [String(entry.seq)]),
                  h.span([h.Class('lab')], [entry.tag]),
                ],
              ),
            ),
          ),
      }),
    ],
  )

const frameLabel = (message: unknown): string => {
  if (typeof message !== 'object' || message === null) {
    return 'message'
  }
  if ('method' in message && typeof message.method === 'string') {
    return message.method
  }
  if ('result' in message) {
    return 'isError' in Object(message.result) &&
      Object(message.result).isError === true
      ? 'result · isError: true'
      : 'result'
  }
  return 'error'
}

const recordingTabView = (model: Model, h: H): Html => {
  if (model.station !== 'valley') {
    return h.div(
      [h.Class('tabpane')],
      [
        h.p(
          [h.Class('quiet')],
          ['No recording for this station yet. The valley has one.'],
        ),
      ],
    )
  }
  const take = model.weather === 'storm' ? recording.storm : recording.calm
  const cliEvents = JSON.stringify(take.cli.stdout.events)
  const matchesLastRun = Option.match(finishedRecord(model.run), {
    onNone: () => false,
    onSome: record => JSON.stringify(record.events) === cliEvents,
  })
  return h.div(
    [h.Class('tabpane')],
    [
      modeView(
        'Recorded external execution',
        `captured ${recording.recordedAt.slice(0, 10)} with Node ${recording.node} and MCP SDK ${recording.mcpSdk} by running the real CLI and the real stdio server (npm run record). This page did not make these calls.`,
        h,
      ),
      h.h3([], [`CLI · ${model.weather} valley`]),
      h.pre([h.Class('cmd')], [take.cli.command]),
      h.p(
        [h.Class('quietline')],
        [
          `Exit code ${take.cli.exitCode} · ${take.cli.stdout.events.length} engine events · revision ${take.cli.stdout.revisionBefore} → ${take.cli.stdout.revisionAfter}`,
        ],
      ),
      h.p(
        [h.Class('quietline')],
        [
          matchesLastRun
            ? 'Its engine events are identical to your last run in this tab: same code, different entrance.'
            : 'Run connect_places from Forge to Dock on a fresh valley in this tab to compare event for event.',
        ],
      ),
      h.h3([], [`MCP over stdio · ${model.weather} valley`]),
      h.ol(
        [h.Class('log')],
        Array.map(take.mcp, (frame, index) =>
          h.keyed('li')(
            String(index),
            [
              h.DataAttribute(
                'kind',
                frame.direction === 'client → server' ? 'req' : 'res',
              ),
            ],
            [
              h.span([h.Class('n')], [String(index + 1)]),
              h.span([h.Class('hop')], [frame.direction]),
              h.details(
                [h.Class('lab')],
                [
                  h.summary([], [frameLabel(frame.message)]),
                  h.pre([], [JSON.stringify(frame.message, null, 2)]),
                ],
              ),
            ],
          ),
        ),
      ),
    ],
  )
}

// FIVE QUESTIONS

const fiveView = (model: Model, h: H): Html =>
  h.dl(
    [h.Class('five')],
    Array.map(fiveAnswers(model), ({ question, answer }) =>
      h.div(
        [],
        [
          h.dt([], [question]),
          h.dd(
            [h.Class(answer === '' ? 'blank' : '')],
            [answer === '' ? 'Run something first.' : answer],
          ),
        ],
      ),
    ),
  )

// NETWORK

const inRunText = (component: ComponentId, record: RunRecord): string => {
  const events = Array.filter(
    record.events,
    event => event.component === component,
  )
  if (component === 'adapter') {
    return 'Carried the request in.'
  }
  if (Array.isArrayEmpty(events)) {
    return 'Not called in this run.'
  }
  const callers = pipe(
    events,
    Array.map(event => componentNames[event.calledBy]),
    Array.dedupe,
  ).join(', ')
  const failedHere = Option.contains(failureOrigin(record), component)
  return `${failedHere ? 'Failed here. ' : ''}Called by ${callers} · ${events.length} events.`
}

const networkView = (model: Model, h: H): Html => {
  const maybeRecord = finishedRecord(model.run)
  const lastRun = (text: (record: RunRecord) => string): string =>
    Option.match(maybeRecord, { onNone: () => 'No run yet.', onSome: text })
  return h.div(
    [h.Class('tabpane')],
    [
      modeView(
        'Components and their responsibilities',
        'the last column is derived from the engine events of your last run, not from a diagram of what should happen.',
        h,
      ),
      h.div(
        [h.Class('tablewrap')],
        [
          h.table(
            [],
            [
              h.thead(
                [],
                [
                  h.tr(
                    [],
                    [
                      h.th([h.Scope('col')], ['Component']),
                      h.th([h.Scope('col')], ['Responsibility']),
                      h.th([h.Scope('col')], ['Where it runs']),
                      h.th([h.Scope('col')], ['In your last run']),
                    ],
                  ),
                ],
              ),
              h.tbody(
                [],
                [
                  networkRow(
                    'You',
                    'Use something on the bench first.',
                    'At the keyboard',
                    lastRun(() => 'Started it.'),
                    h,
                  ),
                  networkRow(
                    'Foldkit app',
                    'Holds the lab state and turns a click into a command.',
                    'This browser tab',
                    lastRun(() => 'Dispatched the command.'),
                    h,
                  ),
                  ...Array.map(componentsOf(model.station), component =>
                    networkRow(
                      componentNames[component],
                      componentRoles[component],
                      'This browser tab',
                      lastRun(record => inRunText(component, record)),
                      h,
                    ),
                  ),
                  networkRow(
                    'CLI adapter',
                    'Another entrance to the same engine.',
                    'A terminal process on your machine',
                    'Not part of runs from this page. See the recording.',
                    h,
                  ),
                  networkRow(
                    'MCP stdio server',
                    'Another entrance: lists the kit as tools and the map as a resource.',
                    'A process started by an MCP client',
                    'Not part of runs from this page. See the recording.',
                    h,
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  )
}

const networkRow = (
  name: string,
  role: string,
  where: string,
  inRun: string,
  h: H,
): Html =>
  h.keyed('tr')(
    name,
    [],
    [
      h.th([h.Scope('row')], [name]),
      h.td([], [role]),
      h.td([], [where]),
      h.td([], [inRun]),
    ],
  )
