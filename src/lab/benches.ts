import { Array, Option, pipe } from 'effect'
import { type Html, type HtmlBuilder } from 'foldkit/html'

import {
  type CapabilityName,
  type RunRecord,
  catalogue,
} from '../domain/capabilities.ts'
import { fieldsOf, helpText } from '../domain/cli-snapshot.ts'
import { siteUrls } from '../domain/fetch.ts'
import { filePaths, rootChoices } from '../domain/files.ts'
import { clients, gatewayPlaces } from '../domain/gateway.ts'
import { inventoryOf } from '../domain/later.ts'
import { observations, pathLabel } from '../domain/memory.ts'
import { controls } from '../domain/perception.ts'
import { callerThoughts } from '../domain/thinking.ts'
import {
  LAUNCH_DIRECTORIES,
  NO_ARTIFACT,
  NO_SNAPSHOT,
  type Path,
  type PlaceId,
  isAllowed,
  joins,
} from '../domain/world.ts'
import { Message } from './message.ts'
import { type Model, RunState, type Station, maxSpanIn } from './model.ts'
import { serverNames } from './names.ts'
import { finishedRecord } from './update.ts'

type H = HtmlBuilder<Message>

// PARTS

const isRunning = (model: Model): boolean =>
  RunState.isAnyOf(['Running'])(model.run)

const run = (name: CapabilityName, input: unknown): Message =>
  Message.ClickedRunWith({ name, inputJson: JSON.stringify(input) })

const action = (
  model: Model,
  label: string,
  message: Message,
  h: H,
  tone: 'primary' | 'quiet' = 'quiet',
): Html =>
  h.button(
    [
      h.Type('button'),
      h.Class(tone === 'primary' ? 'btn' : 'btn ghost small'),
      h.Disabled(isRunning(model)),
      h.OnClick(message),
    ],
    [label],
  )

type Choice = Readonly<{ label: string; isChosen: boolean; message: Message }>

const chips = (label: string, choices: ReadonlyArray<Choice>, h: H): Html =>
  h.div(
    [h.Class('moverow'), h.Role('group'), h.AriaLabel(label)],
    [
      h.span([h.Class('eyebrow')], [label]),
      ...Array.map(choices, choice =>
        h.button(
          [
            h.Type('button'),
            h.Class('chip'),
            h.AriaPressed(choice.isChosen ? 'true' : 'false'),
            h.OnClick(choice.message),
          ],
          [choice.label],
        ),
      ),
    ],
  )

const lines = (
  items: ReadonlyArray<string>,
  empty: string,
  h: H,
  style: 'plain' | 'mono' = 'plain',
): Html =>
  Array.match(items, {
    onEmpty: () => h.p([h.Class('none')], [empty]),
    onNonEmpty: shown =>
      h.ul(
        [h.Class(style === 'mono' ? 'lines plain-list' : 'lines text-list')],
        Array.map(shown, (item, index) =>
          h.keyed('li')(`${index}`, [], [item]),
        ),
      ),
  })

const cell = (
  title: string,
  where: string,
  body: ReadonlyArray<Html>,
  isActive: boolean,
  h: H,
  tag:
    | Readonly<{ text: string; tone: 'ok' | 'warn' | 'quiet' }>
    | undefined = undefined,
): Html =>
  h.div(
    [h.Class(`placebox ${isActive ? 'active' : ''}`)],
    [
      h.div(
        [h.Class('cellhead')],
        [
          h.h3([], [title]),
          tag === undefined
            ? h.empty
            : h.span([h.Class(`tag ${tag.tone}`)], [tag.text]),
        ],
      ),
      h.p([h.Class('where')], [where]),
      ...body,
    ],
  )

const strip = (cells: ReadonlyArray<Html>, h: H): Html =>
  h.div([h.Class('places')], cells)

const row = (children: ReadonlyArray<Html>, h: H): Html =>
  h.div([h.Class('ctl')], children)

const lastOutput = (model: Model) =>
  Option.flatMap(finishedRecord(model.run), record =>
    record.outcome._tag === 'Succeeded'
      ? Option.some(record.outcome.output)
      : Option.none(),
  )

// BENDS

type Bend = Readonly<{ label: string; choices: ReadonlyArray<Choice> }>

const setting = (
  current: string,
  key: string,
  options: ReadonlyArray<readonly [string, string]>,
): ReadonlyArray<Choice> =>
  Array.map(options, ([value, label]) => ({
    label,
    isChosen: current === value,
    message: Message.SelectedSetting({ setting: `${key}=${value}` }),
  }))

const bendOf = (model: Model): Bend => {
  const world = model.world
  if (model.station === 'valley') {
    return {
      label: 'Weather',
      choices: [
        {
          label: `Calm · span limit ${maxSpanIn('calm')}`,
          isChosen: model.weather === 'calm',
          message: Message.SelectedWeather({ weather: 'calm' }),
        },
        {
          label: `Storm · span limit ${maxSpanIn('storm')}`,
          isChosen: model.weather === 'storm',
          message: Message.SelectedWeather({ weather: 'storm' }),
        },
      ],
    }
  }
  if (model.station === 'fetch') {
    return {
      label: 'Robots policy',
      choices: [
        {
          label: 'Check every hop',
          isChosen: world.fetchPolicy === 'every-hop',
          message: Message.SelectedPolicy({ policy: 'every-hop' }),
        },
        {
          label: 'First URL only',
          isChosen: world.fetchPolicy === 'first-hop',
          message: Message.SelectedPolicy({ policy: 'first-hop' }),
        },
        {
          label: 'Never check',
          isChosen: world.fetchPolicy === 'none',
          message: Message.SelectedPolicy({ policy: 'none' }),
        },
      ],
    }
  }
  if (model.station === 'memory') {
    return {
      label: 'Storage path',
      choices: [
        {
          label: 'Package cache (default)',
          isChosen: world.memory.storagePath === 'package-cache',
          message: Message.SelectedStoragePath({
            storagePath: 'package-cache',
          }),
        },
        {
          label: 'Home folder',
          isChosen: world.memory.storagePath === 'home',
          message: Message.SelectedStoragePath({ storagePath: 'home' }),
        },
      ],
    }
  }
  if (model.station === 'thinking') {
    return {
      label: 'What is inside',
      choices: [
        {
          label: 'Records your thoughts',
          isChosen: world.thinkingMode === 'record',
          message: Message.SelectedThinkingMode({ mode: 'record' }),
        },
        {
          label: 'Computes from the map',
          isChosen: world.thinkingMode === 'compute',
          message: Message.SelectedThinkingMode({ mode: 'compute' }),
        },
        {
          label: 'Asks another model',
          isChosen: world.thinkingMode === 'consult',
          message: Message.SelectedThinkingMode({ mode: 'consult' }),
        },
      ],
    }
  }
  if (model.station === 'filesystem') {
    return {
      label: 'Server build',
      choices: [
        {
          label: 'Roots replace',
          isChosen: world.files.build === 'default',
          message: Message.SelectedFsBuild({ build: 'default' }),
        },
        {
          label: 'Roots only narrow',
          isChosen: world.files.build === 'confine',
          message: Message.SelectedFsBuild({ build: 'confine' }),
        },
        {
          label: 'Before the fix',
          isChosen: world.files.build === 'pre-fix',
          message: Message.SelectedFsBuild({ build: 'pre-fix' }),
        },
      ],
    }
  }
  if (model.station === 'perception') {
    return {
      label: 'Perception',
      choices: [
        {
          label: 'Snapshot only',
          isChosen: world.page.mode === 'snapshot',
          message: Message.SelectedPerception({ mode: 'snapshot' }),
        },
        {
          label: 'Coordinates on',
          isChosen: world.page.mode === 'vision',
          message: Message.SelectedPerception({ mode: 'vision' }),
        },
      ],
    }
  }
  if (model.station === 'cli') {
    return {
      label: 'Server schema',
      choices: [
        {
          label: 'Server schema v1',
          isChosen: world.cli.serverSchema === 1,
          message: Message.SelectedServerSchema({ version: 1 }),
        },
        {
          label: 'v2 adds destination',
          isChosen: world.cli.serverSchema === 2,
          message: Message.SelectedServerSchema({ version: 2 }),
        },
      ],
    }
  }
  if (model.station === 'local-remote') {
    return {
      label: 'Gateway build',
      choices: [
        {
          label: 'One shared process',
          isChosen: world.gateway.build === 'shared',
          message: Message.SelectedGatewayBuild({ build: 'shared' }),
        },
        {
          label: 'A process per connection',
          isChosen: world.gateway.build === 'per-connection',
          message: Message.SelectedGatewayBuild({ build: 'per-connection' }),
        },
      ],
    }
  }
  if (model.station === 'apps') {
    return {
      label: 'App tools',
      choices: setting(world.app.tools, 'app', [
        ['on', 'App can be asked'],
        ['off', 'App cannot be asked'],
      ]),
    }
  }
  if (model.station === 'code-mode') {
    return {
      label: 'Fault',
      choices: setting(world.ledger.fault, 'fault', [
        ['none', 'All writes succeed'],
        ['after-second', 'Third write fails'],
      ]),
    }
  }
  if (model.station === 'delegation') {
    return {
      label: 'Handoff',
      choices: setting(world.handoff.context, 'context', [
        ['full', 'Map sent along'],
        ['none', 'Map left out'],
      ]),
    }
  }
  if (model.station === 'iteration') {
    return {
      label: 'Criteria',
      choices: setting(world.loop.criteria, 'criteria', [
        ['satisfiable', 'Criteria can be met'],
        ['contradictory', 'Criteria contradict'],
      ]),
    }
  }
  if (model.station === 'inspector') {
    return {
      label: 'Subject',
      choices: setting(world.inspection.subject, 'subject', [
        ['pinned', 'Listing as pinned'],
        ['changed', 'Listing changed since'],
      ]),
    }
  }
  return {
    label: 'Naming',
    choices: setting(world.net.naming, 'naming', [
      ['first-wins', 'First name wins'],
      ['prefixed', 'Names carry the backend'],
    ]),
  }
}

const bendLabels: Record<Station, string> = {
  valley: 'Weather',
  fetch: 'Robots policy',
  memory: 'Storage path',
  thinking: 'What is inside',
  filesystem: 'Server build',
  perception: 'Coordinates',
  cli: 'Server schema',
  'local-remote': 'Process per connection',
  apps: 'App can be asked',
  'code-mode': 'Third write fails',
  delegation: 'Map left out',
  iteration: 'Criteria contradict',
  network: 'Name collision',
  inspector: 'Listing changed since pinned',
}

export const bendLabel = (station: Station): string => bendLabels[station]

export const bendView = (model: Model, h: H): Html => {
  const bend = bendOf(model)
  return h.div(
    [h.Class('bend')],
    [
      h.span([h.Class('bendlabel')], ['Bend it']),
      h.div(
        [h.Class('seg'), h.Role('group'), h.AriaLabel(bend.label)],
        Array.map(bend.choices, choice =>
          h.button(
            [
              h.Type('button'),
              h.AriaPressed(choice.isChosen ? 'true' : 'false'),
              h.OnClick(choice.message),
            ],
            [choice.label],
          ),
        ),
      ),
    ],
  )
}

// 00 · VALLEY

const SCALE = 100

const routeOf = (record: RunRecord): ReadonlyArray<PlaceId> => {
  if (record.outcome._tag === 'Failed') {
    return []
  }
  const output = record.outcome.output
  return output._tag === 'RouteFound' || output._tag === 'PlacesConnected'
    ? output.route.places
    : []
}

const isOnRoute = (path: Path, route: ReadonlyArray<PlaceId>): boolean =>
  pipe(
    Array.zip(route, route.slice(1)),
    Array.some(([a, b]) => joins(path, a, b)),
  )

const valleyBench = (model: Model, h: H): ReadonlyArray<Html> => {
  const world = model.world
  const route = Option.match(finishedRecord(model.run), {
    onNone: () => [],
    onSome: routeOf,
  })
  const at = (id: PlaceId) =>
    Array.findFirst(world.places, place => place.id === id)
  const goal = { from: model.from, to: model.to }
  const placeChoices = (
    current: PlaceId,
    toMessage: (value: string) => Message,
  ): ReadonlyArray<Choice> =>
    Array.map(world.places, place => ({
      label: place.name,
      isChosen: place.id === current,
      message: toMessage(place.id),
    }))
  return [
    chips(
      'From',
      placeChoices(model.from, value => Message.SelectedFrom({ value })),
      h,
    ),
    chips(
      'To',
      placeChoices(model.to, value => Message.SelectedTo({ value })),
      h,
    ),
    row(
      [
        action(model, 'Read the map', run('read_map', {}), h),
        action(model, 'Find a route', run('find_route', goal), h),
        action(model, 'Build this path', run('build_path', goal), h),
        action(
          model,
          'Connect them, any way',
          run('connect_places', goal),
          h,
          'primary',
        ),
      ],
      h,
    ),
    h.svg(
      [
        h.Class('map'),
        h.ViewBox('0 0 800 420'),
        h.Role('img'),
        h.AriaLabel(
          `Map of the valley at revision ${world.revision}. The line below names every path.`,
        ),
      ],
      [
        ...Array.flatMap(world.paths, path =>
          Option.match(Option.all([at(path.from), at(path.to)]), {
            onNone: () => [],
            onSome: ([from, to]) => [
              h.line([
                h.Class(
                  `path ${path.builtInRevision > 0 ? 'built' : ''} ${isOnRoute(path, route) ? 'route' : ''}`,
                ),
                h.X1(String(from.x * SCALE)),
                h.Y1(String(from.y * SCALE)),
                h.X2(String(to.x * SCALE)),
                h.Y2(String(to.y * SCALE)),
              ]),
            ],
          }),
        ),
        ...Array.flatMap(world.places, place => [
          h.circle([
            h.Class(
              `place ${place.id === model.from || place.id === model.to ? 'chosen' : ''}`,
            ),
            h.Cx(String(place.x * SCALE)),
            h.Cy(String(place.y * SCALE)),
            h.R('13'),
            h.OnClick(Message.SelectedTo({ value: place.id })),
          ]),
          h.text(
            [
              h.Class('place-label'),
              h.X(String(place.x * SCALE)),
              h.Y(String(place.y * SCALE + 42)),
              h.TextAnchor('middle'),
            ],
            [place.name],
          ),
        ]),
      ],
    ),
    h.p(
      [h.Class('pathlist')],
      [
        `Revision ${world.revision} · span limit ${world.maxSpan} · paths: `,
        Array.map(
          world.paths,
          path =>
            `${path.from}–${path.to} (${path.span}${path.builtInRevision > 0 ? ', built' : ''})`,
        ).join(', '),
      ],
    ),
    Array.match(world.artifacts, {
      onEmpty: () => h.empty,
      onNonEmpty: artifacts =>
        strip(
          [
            cell(
              'Artifacts in the valley',
              'kept by the artifact store',
              [
                lines(
                  Array.map(
                    artifacts,
                    artifact => `${artifact.id}: ${artifact.summary}`,
                  ),
                  'nothing yet',
                  h,
                ),
              ],
              true,
              h,
            ),
          ],
          h,
        ),
    }),
  ]
}

// 01 · FETCH

type Hop = Readonly<{
  url: string
  robots: string
  answer: string
  isBad: boolean
}>

const hopsOf = (record: RunRecord): ReadonlyArray<Hop> => {
  const gets = Array.filter(record.events, event =>
    event.operation.startsWith('GET '),
  )
  return Array.map(gets, (get, index) => {
    const hop = index + 1
    const maybeCheck = Array.findFirst(
      record.events,
      event =>
        event.operation === `check robots.txt for hop ${hop}` ||
        event.operation === `robots.txt not consulted for hop ${hop}`,
    )
    return {
      url: get.operation.slice('GET '.length),
      robots: Option.match(maybeCheck, {
        onNone: () => 'not consulted',
        onSome: check =>
          check.operation.startsWith('robots.txt not')
            ? 'not consulted'
            : check.kind === 'failed'
              ? 'disallowed'
              : 'allowed',
      }),
      answer: get.detail,
      isBad: get.kind === 'failed',
    }
  })
}

const refusedHop = (record: RunRecord): Option.Option<string> =>
  pipe(
    record.events,
    Array.findFirst(
      event => event.component === 'robots-policy' && event.kind === 'failed',
    ),
    Option.map(event => event.detail),
  )

const fetchBench = (model: Model, h: H): ReadonlyArray<Html> => {
  const maybeRecord = finishedRecord(model.run)
  return [
    chips(
      'Fetch',
      Array.map(siteUrls, url => ({
        label: url.replace('https://valley.test', ''),
        isChosen: Option.isSome(maybeRecord) && model.url === url,
        message: Message.ClickedFetch({ url }),
      })),
      h,
    ),
    Option.match(maybeRecord, {
      onNone: () =>
        h.p(
          [h.Class('empty')],
          [
            'Pick a page above. It is fetched at once and the chain of hops appears here.',
          ],
        ),
      onSome: record =>
        h.ol(
          [h.Class('chain')],
          [
            ...Array.map(hopsOf(record), (hop, index) =>
              h.keyed('li')(
                `${index}`,
                [h.Class('hop-card')],
                [
                  h.span([h.Class('where')], [`Hop ${index + 1}`]),
                  h.b([], [hop.url.replace('https://valley.test', '')]),
                  h.span(
                    [
                      h.Class(
                        `tag ${hop.robots === 'allowed' ? 'ok' : hop.robots === 'disallowed' ? 'bad' : 'warn'}`,
                      ),
                    ],
                    [`robots.txt: ${hop.robots}`],
                  ),
                  h.span([h.Class('where')], [hop.answer]),
                ],
              ),
            ),
            Option.match(refusedHop(record), {
              onNone: () => h.empty,
              onSome: detail =>
                h.keyed('li')(
                  'refused',
                  [h.Class('hop-card refused')],
                  [
                    h.span([h.Class('where')], ['Stopped here']),
                    h.b([], ['not fetched']),
                    h.span([h.Class('tag bad')], ['robots.txt: disallowed']),
                    h.span([h.Class('where')], [detail]),
                  ],
                ),
            }),
          ],
        ),
    }),
    Option.match(lastOutput(model), {
      onNone: () => h.empty,
      onSome: output =>
        output._tag === 'PageFetched'
          ? h.div(
              [h.Class('card')],
              [
                h.h3([], ['What came back']),
                h.pre([h.Class('page')], [output.markdown]),
              ],
            )
          : h.empty,
    }),
  ]
}

// 02 · MEMORY

const memoryBench = (model: Model, h: H): ReadonlyArray<Html> => {
  const memory = model.world.memory
  const facts = (list: typeof memory.home) =>
    lines(
      Array.map(list, fact => `${fact.entity} ${fact.observation}`),
      'empty',
      h,
    )
  const useFolder = (storagePath: 'package-cache' | 'home') =>
    memory.storagePath === storagePath
      ? h.empty
      : action(
          model,
          'Point the server here',
          Message.SelectedStoragePath({ storagePath }),
          h,
        )
  return [
    chips(
      'Tell it that Workshop A',
      Array.map(observations, observation => ({
        label: observation,
        isChosen: false,
        message: run('remember', { entity: 'Workshop A', observation }),
      })),
      h,
    ),
    row(
      [
        action(
          model,
          'Ask what it knows about Workshop A',
          run('recall', { entity: 'Workshop A' }),
          h,
          'primary',
        ),
      ],
      h,
    ),
    strip(
      [
        cell(
          'The conversation',
          'in the client · gone when the client restarts',
          [
            lines(model.conversation, 'empty', h),
            action(
              model,
              'Restart the client',
              Message.ClickedRestartClient(),
              h,
            ),
          ],
          false,
          h,
        ),
        cell(
          'The server process',
          `start #${model.serverStarts} · reads the file on every call`,
          [
            h.p([h.Class('none')], ['holds nothing between calls']),
            action(
              model,
              'Restart the server',
              Message.ClickedRestartServer(),
              h,
            ),
          ],
          false,
          h,
        ),
        cell(
          'Package cache',
          `${pathLabel['package-cache']} · wiped on reinstall`,
          [
            facts(memory.packageCache),
            action(
              model,
              'Reinstall the package',
              Message.ClickedReinstallPackage(),
              h,
            ),
            useFolder('package-cache'),
          ],
          memory.storagePath === 'package-cache',
          h,
          memory.storagePath === 'package-cache'
            ? { text: 'in use', tone: 'ok' }
            : undefined,
        ),
        cell(
          'Home folder',
          `${pathLabel.home} · survives reinstall`,
          [facts(memory.home), useFolder('home')],
          memory.storagePath === 'home',
          h,
          memory.storagePath === 'home'
            ? { text: 'in use', tone: 'ok' }
            : undefined,
        ),
      ],
      h,
    ),
  ]
}

// 03 · THINKING

const thinkingBench = (model: Model, h: H): ReadonlyArray<Html> => [
  row(
    [
      action(
        model,
        'Ask it to plan Forge to Dock',
        run('plan_steps', {
          from: 'forge',
          to: 'dock',
          thoughts: callerThoughts,
        }),
        h,
        'primary',
      ),
    ],
    h,
  ),
  strip(
    [
      cell(
        'Your thoughts',
        'sent along with the call',
        [lines(callerThoughts, 'none', h)],
        false,
        h,
      ),
      Option.match(lastOutput(model), {
        onNone: () =>
          cell(
            'The plan that comes back',
            'nothing yet',
            [
              h.p(
                [h.Class('none')],
                ['Ask, then switch what is inside and ask again.'],
              ),
            ],
            true,
            h,
          ),
        onSome: output =>
          output._tag === 'PlanMade'
            ? cell(
                'The plan that came back',
                `written by ${output.madeBy}`,
                [lines(output.steps, 'empty', h)],
                true,
                h,
                output.checkedAgainstMap
                  ? { text: 'derived from the map', tone: 'ok' }
                  : { text: 'not checked against the map', tone: 'warn' },
              )
            : h.empty,
      }),
    ],
    h,
  ),
]

// 04 · FILESYSTEM

const filesystemBench = (model: Model, h: H): ReadonlyArray<Html> => {
  const files = model.world.files
  return [
    chips(
      'The client sends root',
      [
        ...Array.map(rootChoices, root => ({
          label: root,
          isChosen: files.clientRoots.includes(root),
          message: Message.ClickedSendRoot({ root }),
        })),
        {
          label: 'revokes all',
          isChosen: false,
          message: Message.ClickedRevokeRoots(),
        },
      ],
      h,
    ),
    strip(
      [
        cell(
          'Set at launch',
          'command line · never changes',
          [lines(LAUNCH_DIRECTORIES, 'nothing', h, 'mono')],
          false,
          h,
        ),
        cell(
          'Sent by the client',
          'roots · last update',
          [lines(files.clientRoots, 'nothing', h, 'mono')],
          false,
          h,
        ),
        cell(
          'What the server enforces now',
          files.note,
          [lines(files.allowed, 'nothing', h, 'mono')],
          true,
          h,
        ),
      ],
      h,
    ),
    h.div(
      [h.Class('filelist'), h.Role('group'), h.AriaLabel('Read a file')],
      Array.map(filePaths, path =>
        h.button(
          [
            h.Type('button'),
            h.Class('file'),
            h.Disabled(isRunning(model)),
            h.OnClick(run('read_file', { path })),
          ],
          [
            h.span([h.Class('file-path')], [path]),
            h.span(
              [h.Class(`tag ${isAllowed(files, path) ? 'ok' : 'bad'}`)],
              [
                isAllowed(files, path)
                  ? 'readable now'
                  : 'outside the boundary',
              ],
            ),
          ],
        ),
      ),
    ),
  ]
}

// 05 · PERCEPTION

const controlState = (model: Model, id: string): string => {
  const page = model.world.page
  if (id === 'gate') {
    return page.gate ? 'open' : 'closed'
  }
  if (id === 'lever') {
    return page.lever ? 'pulled' : 'up'
  }
  if (id === 'valve') {
    return page.valve ? 'open' : 'shut'
  }
  return `rung ${page.bell} time(s)`
}

const perceptionBench = (model: Model, h: H): ReadonlyArray<Html> => {
  const page = model.world.page
  const hasSnapshot = page.snapshotRevision !== NO_SNAPSHOT
  const isFresh = page.snapshotRevision === page.revision
  return [
    row(
      [
        action(
          model,
          'Take a snapshot',
          run('take_snapshot', {}),
          h,
          'primary',
        ),
      ],
      h,
    ),
    h.div(
      [h.Class('twoup')],
      [
        h.div(
          [h.Class('placebox framed')],
          [
            h.div(
              [h.Class('cellhead')],
              [h.h3([], ['The page, as you see it'])],
            ),
            h.p(
              [h.Class('where')],
              [
                `revision ${page.revision} · click a control to have the tool click it`,
              ],
            ),
            h.div(
              [h.Class('tiles')],
              Array.map(controls, control =>
                h.button(
                  [
                    h.Type('button'),
                    h.Class('tile'),
                    h.Disabled(isRunning(model)),
                    h.OnClick(run('click', { target: control.id })),
                  ],
                  [
                    h.b([], [control.label]),
                    h.span([], [controlState(model, control.id)]),
                    h.small([], [control.madeOf]),
                  ],
                ),
              ),
            ),
          ],
        ),
        cell(
          'The page, as the tool perceives it',
          !hasSnapshot
            ? 'no snapshot taken yet'
            : `snapshot of revision ${page.snapshotRevision}`,
          [
            hasSnapshot
              ? lines(
                  Array.flatMap(controls, (control, index) =>
                    control.inSnapshot
                      ? [
                          `r${page.snapshotRevision}e${index + 1} · button · “${control.label}”`,
                        ]
                      : [],
                  ),
                  'nothing',
                  h,
                  'mono',
                )
              : h.p([h.Class('none')], ['nothing']),
            h.p(
              [h.Class('where')],
              [
                page.mode === 'vision'
                  ? 'Coordinates are on: the tool can click any point, without knowing what is there.'
                  : 'The Lever and the Valve have no role or name, so they never appear here.',
              ],
            ),
          ],
          true,
          h,
          !hasSnapshot
            ? undefined
            : isFresh
              ? { text: 'current', tone: 'ok' }
              : { text: 'stale', tone: 'warn' },
        ),
      ],
    ),
  ]
}

// 06 · CLI

const cliBench = (model: Model, h: H): ReadonlyArray<Html> => {
  const cli = model.world.cli
  const hasArtifact = cli.artifactSchema !== NO_ARTIFACT
  const isStale = hasArtifact && cli.artifactSchema !== cli.serverSchema
  return [
    h.p([h.Class('goal')], ['You want to ship 3 crates to the dock.']),
    strip(
      [
        cell(
          'The server, right now',
          `schema v${cli.serverSchema}`,
          [
            lines(
              [`ship_crates(${fieldsOf(cli.serverSchema).join(', ')})`],
              'nothing',
              h,
              'mono',
            ),
          ],
          false,
          h,
        ),
        cell(
          'The generated CLI',
          hasArtifact
            ? `embeds schema v${cli.artifactSchema}`
            : 'not generated yet',
          [
            hasArtifact
              ? lines([helpText(cli.artifactSchema)], 'nothing', h, 'mono')
              : h.p([h.Class('none')], ['nothing']),
            row(
              [
                action(
                  model,
                  hasArtifact ? 'Generate again' : 'Generate it',
                  run('generate_cli', {}),
                  h,
                ),
                action(
                  model,
                  'Ship through it',
                  run('call_generated', {}),
                  h,
                  'primary',
                ),
              ],
              h,
            ),
          ],
          true,
          h,
          !hasArtifact
            ? undefined
            : isStale
              ? { text: 'stale, and it cannot know', tone: 'warn' }
              : { text: 'matches the server', tone: 'ok' },
        ),
        cell(
          'A live call',
          'embeds nothing · lists the tools every time',
          [action(model, 'Ship with a live call', run('call_live', {}), h)],
          false,
          h,
        ),
      ],
      h,
    ),
  ]
}

// 07 · LOCAL AND REMOTE

const gatewayBench = (model: Model, h: H): ReadonlyArray<Html> => {
  const gateway = model.world.gateway
  const clientCell = (client: string) =>
    cell(
      `Client ${client}`,
      'a separate connection to the gateway',
      [
        chips(
          'Go to',
          Array.map(gatewayPlaces, place => ({
            label: place,
            isChosen: false,
            message: run('go_to', { client, place }),
          })),
          h,
        ),
        row(
          [
            action(
              model,
              'Where am I?',
              run('where_am_i', { client }),
              h,
              'primary',
            ),
            action(
              model,
              'Reconnect',
              Message.ClickedClientEvent({ client, event: 'reconnect' }),
              h,
            ),
            action(
              model,
              'Vanish',
              Message.ClickedClientEvent({ client, event: 'vanish' }),
              h,
            ),
          ],
          h,
        ),
      ],
      false,
      h,
    )
  return [
    h.div([h.Class('twoup')], Array.map(clients, clientCell)),
    strip(
      Array.match(gateway.children, {
        onEmpty: () => [
          cell(
            'No server process yet',
            'one is spawned when a client first connects',
            [],
            false,
            h,
          ),
        ],
        onNonEmpty: children =>
          Array.map(children, child =>
            cell(
              `Server process #${child.id}`,
              child.orphaned
                ? `was client ${child.owner}’s · still running`
                : child.owner === 'shared'
                  ? 'shared by every client'
                  : `owned by client ${child.owner}’s connection`,
              [
                h.p(
                  [],
                  [
                    child.place === ''
                      ? 'current place: none'
                      : `current place: ${child.place}`,
                  ],
                ),
              ],
              !child.orphaned,
              h,
              child.orphaned ? { text: 'orphaned', tone: 'warn' } : undefined,
            ),
          ),
      }),
      h,
    ),
    row(
      [
        action(
          model,
          'Session timeout passes',
          Message.ClickedPassTimeout(),
          h,
        ),
      ],
      h,
    ),
  ]
}

// 08 · APPS

const APP_PLACES: ReadonlyArray<
  Readonly<{ id: string; name: string; x: number; y: number }>
> = [
  { id: 'forge', name: 'Forge', x: 110, y: 150 },
  { id: 'mill', name: 'Mill', x: 270, y: 150 },
  { id: 'kiln', name: 'Kiln', x: 430, y: 90 },
  { id: 'dock', name: 'Dock', x: 590, y: 150 },
]

const appPlaceName = (id: string): string =>
  Option.match(
    Array.findFirst(APP_PLACES, place => place.id === id),
    { onNone: () => 'nowhere yet', onSome: place => place.name },
  )

const appBench = (model: Model, h: H): ReadonlyArray<Html> => {
  const app = model.world.app
  const isOpen = app.view !== ''
  const isStale = isOpen && app.modelKnows !== app.view
  const readings: ReadonlyArray<
    Readonly<{
      id: 'person' | 'model' | 'server'
      label: string
      value: string
      note: string
    }>
  > = [
    {
      id: 'person',
      label: 'On your screen',
      value: appPlaceName(app.view),
      note: 'What the app shows right now. You moved it; no tool was called.',
    },
    {
      id: 'model',
      label: 'Model’s last view',
      value: `${appPlaceName(app.modelKnows)}${isStale ? ' · out of date' : ''}`,
      note: isStale
        ? 'The model still holds what the last tool result told it. Nothing reported your move.'
        : 'What the model was last told matches the screen.',
    },
    {
      id: 'server',
      label: 'Tool result',
      value: appPlaceName(app.shown),
      note: 'Returned once, when the app opened. It does not update itself.',
    },
  ]
  return [
    h.div(
      [h.Class('appbench')],
      [
        h.div(
          [h.Class('appmap')],
          [
            h.svg(
              [
                h.Class(
                  `map appsvg reading-${model.reading} ${isOpen ? '' : 'closed'}`,
                ),
                h.ViewBox('0 0 700 240'),
                h.Role('img'),
                h.AriaLabel(
                  isOpen
                    ? `Interactive map. The screen shows ${appPlaceName(app.view)}; the model was last told ${appPlaceName(app.modelKnows)}.`
                    : 'The map app is not open yet.',
                ),
              ],
              [
                h.line([
                  h.Class('path'),
                  h.X1('110'),
                  h.Y1('150'),
                  h.X2('270'),
                  h.Y2('150'),
                ]),
                h.line([
                  h.Class('path'),
                  h.X1('430'),
                  h.Y1('90'),
                  h.X2('590'),
                  h.Y2('150'),
                ]),
                ...Array.flatMap(APP_PLACES, place => [
                  place.id === app.shown
                    ? h.circle([
                        h.Class('mark shown'),
                        h.Cx(String(place.x)),
                        h.Cy(String(place.y)),
                        h.R('34'),
                      ])
                    : h.empty,
                  place.id === app.modelKnows
                    ? h.circle([
                        h.Class('mark model'),
                        h.Cx(String(place.x)),
                        h.Cy(String(place.y)),
                        h.R('27'),
                      ])
                    : h.empty,
                  place.id === app.view
                    ? h.rect([
                        h.Class('mark screen'),
                        h.X(String(place.x - 60)),
                        h.Y(String(place.y - 50)),
                        h.Width('120'),
                        h.Height('100'),
                        h.Rx('8'),
                      ])
                    : h.empty,
                  h.circle([
                    h.Class('place'),
                    h.Cx(String(place.x)),
                    h.Cy(String(place.y)),
                    h.R('12'),
                    h.OnClick(Message.ClickedMapPlace({ place: place.id })),
                  ]),
                  h.text(
                    [
                      h.Class('place-label'),
                      h.X(String(place.x)),
                      h.Y(String(place.y + 80)),
                      h.TextAnchor('middle'),
                    ],
                    [place.name],
                  ),
                ]),
              ],
            ),
            chips(
              isOpen ? 'Move the map to' : 'Choose where to open',
              Array.map(APP_PLACES, place => ({
                label: place.name,
                isChosen: (isOpen ? app.view : model.place) === place.id,
                message: Message.ClickedMapPlace({ place: place.id }),
              })),
              h,
            ),
          ],
        ),
        h.div(
          [h.Class('readout')],
          [
            h.span([h.Class('eyebrow')], ['Read this map as']),
            ...Array.map(readings, reading =>
              h.button(
                [
                  h.Type('button'),
                  h.Class(`reading ${reading.id}`),
                  h.AriaPressed(
                    model.reading === reading.id ? 'true' : 'false',
                  ),
                  h.OnClick(Message.SelectedReading({ reading: reading.id })),
                ],
                [
                  h.span([h.Class('reading-label')], [reading.label]),
                  h.b([], [reading.value]),
                ],
              ),
            ),
            h.p(
              [h.Class('reading-note'), h.AriaLive('polite')],
              [
                pipe(
                  readings,
                  Array.findFirst(reading => reading.id === model.reading),
                  Option.match({
                    onNone: () => '',
                    onSome: reading => reading.note,
                  }),
                ),
              ],
            ),
            isOpen
              ? action(
                  model,
                  'Ask the app where it is looking',
                  Message.ClickedRun({ name: 'get_current_view' }),
                  h,
                  'primary',
                )
              : action(
                  model,
                  `Open the map at ${appPlaceName(model.place)}`,
                  Message.ClickedRun({ name: 'show_map' }),
                  h,
                  'primary',
                ),
          ],
        ),
      ],
    ),
  ]
}

// 09 · CODE MODE

const lastLine = (text: string): string =>
  text
    .split('\n')
    .filter(line => line.trim() !== '')
    .at(-1)
    ?.replace(/^pyodide\.ffi\.JsException: (Error: )?/, '') ?? text

const codeBench = (model: Model, h: H): ReadonlyArray<Html> => [
  h.div(
    [h.Class('twoup wide-left')],
    [
      h.div(
        [h.Class('placebox framed')],
        [
          h.div(
            [h.Class('cellhead')],
            [
              h.h3([], ['Your program']),
              h.span([h.Class('tag ok')], ['real Python, in this tab']),
            ],
          ),
          h.label(
            [h.For('program'), h.Class('where')],
            ['Edit it. Every ledger.write is a real tools/call.'],
          ),
          h.textarea([
            h.Id('program'),
            h.Class('console-text'),
            h.Rows(10),
            h.Spellcheck(false),
            h.Value(model.program),
            h.OnInput(value => Message.UpdatedProgram({ value })),
          ]),
          row(
            [
              h.button(
                [
                  h.Type('button'),
                  h.Class('btn'),
                  h.Disabled(model.python === 'running' || isRunning(model)),
                  h.OnClick(Message.ClickedRunPython()),
                ],
                [model.python === 'running' ? 'Running…' : 'Run this program'],
              ),
            ],
            h,
          ),
        ],
      ),
      h.div(
        [h.Class('stack')],
        [
          cell(
            'The ledger',
            'append only · no undo',
            [lines(model.world.ledger.entries, 'empty', h)],
            true,
            h,
          ),
          cell(
            'What Python printed',
            model.python === 'unavailable'
              ? 'the Python runtime could not be loaded on this page'
              : model.python === 'idle'
                ? 'the runtime loads the first time you run'
                : model.python === 'running'
                  ? 'running'
                  : model.pythonError === ''
                    ? 'finished without an error'
                    : 'stopped with an error',
            [
              model.pythonOutput === ''
                ? h.empty
                : h.pre([h.Class('page')], [model.pythonOutput]),
              model.pythonError === ''
                ? h.empty
                : h.p([h.Class('page bad')], [lastLine(model.pythonError)]),
              model.pythonError === ''
                ? h.empty
                : h.details(
                    [h.Class('fold')],
                    [
                      h.summary([], ['Full traceback']),
                      h.pre([h.Class('page')], [model.pythonError]),
                    ],
                  ),
            ],
            false,
            h,
            model.pythonError === ''
              ? undefined
              : { text: 'traceback', tone: 'warn' },
          ),
        ],
      ),
    ],
  ),
  row(
    [
      h.span([h.Class('eyebrow')], ['Or let the fixed versions run']),
      action(model, 'Three separate calls', run('run_as_calls', {}), h),
      action(model, 'One program on the server', run('run_as_program', {}), h),
    ],
    h,
  ),
]

// 10 · DELEGATION

const delegationBench = (model: Model, h: H): ReadonlyArray<Html> => {
  const maybeReply = Option.flatMap(lastOutput(model), output =>
    output._tag === 'ExpertReplied' ? Option.some(output) : Option.none(),
  )
  return [
    row(
      [
        h.span([h.Class('eyebrow')], ['Same expert, three contracts']),
        action(model, 'Ask a question', run('ask_expert', {}), h),
        action(model, 'Have a plan reviewed', run('review_plan', {}), h),
        action(
          model,
          'Have a plan delivered',
          run('deliver_plan', {}),
          h,
          'primary',
        ),
      ],
      h,
    ),
    strip(
      [
        cell(
          'What is handed over',
          'the expert sees only this',
          [
            lines(
              model.world.handoff.context === 'full'
                ? ['the goal', 'the map of the valley']
                : ['the goal'],
              'nothing',
              h,
            ),
          ],
          false,
          h,
        ),
        cell(
          'What came back',
          Option.match(maybeReply, {
            onNone: () => 'nothing yet',
            onSome: reply => `contract: ${reply.contract}`,
          }),
          [
            lines(
              Option.match(maybeReply, {
                onNone: () => [],
                onSome: reply => [
                  reply.reply,
                  `Next step is owned by: ${reply.nextStepOwner}.`,
                ],
              }),
              'Pick a contract above.',
              h,
            ),
          ],
          true,
          h,
          Option.match(maybeReply, {
            onNone: () => undefined,
            onSome: reply =>
              reply.grounded
                ? { text: 'based on the map', tone: 'ok' as const }
                : { text: 'never saw the map', tone: 'warn' as const },
          }),
        ),
        cell(
          'Stored artifacts',
          'only "deliver" writes here',
          [
            lines(
              Array.map(model.world.artifacts, artifact => artifact.summary),
              'none',
              h,
            ),
          ],
          false,
          h,
        ),
      ],
      h,
    ),
  ]
}

// 11 · ITERATION

const iterationBench = (model: Model, h: H): ReadonlyArray<Html> => {
  const maybeOutput = lastOutput(model)
  return [
    row(
      [
        action(model, 'Run the loop', run('refine_plan', {}), h, 'primary'),
        action(
          model,
          'Crash it mid-loop, then resume',
          run('crash_and_resume', {}),
          h,
        ),
      ],
      h,
    ),
    chips(
      'Engine',
      [
        {
          label: 'in memory',
          isChosen: model.world.loop.engine === 'in-memory',
          message: Message.SelectedSetting({ setting: 'engine=in-memory' }),
        },
        {
          label: 'durable',
          isChosen: model.world.loop.engine === 'durable',
          message: Message.SelectedSetting({ setting: 'engine=durable' }),
        },
      ],
      h,
    ),
    Option.match(maybeOutput, {
      onNone: () =>
        h.p([h.Class('empty')], ['Run the loop and its drafts line up here.']),
      onSome: output =>
        output._tag === 'LoopFinished'
          ? h.ol(
              [h.Class('chain')],
              Array.makeBy(output.draftsWritten, index => {
                const draft = index + 1
                const maybeRating = Option.fromNullishOr(output.ratings[index])
                return h.keyed('li')(
                  `${draft}`,
                  [
                    h.Class(
                      `hop-card ${draft === output.returnedDraft ? 'chosen' : ''}`,
                    ),
                  ],
                  [
                    h.span([h.Class('where')], [`Draft ${draft}`]),
                    h.b(
                      [],
                      [
                        Option.match(maybeRating, {
                          onNone: () => 'never rated',
                          onSome: rating => rating.toLowerCase(),
                        }),
                      ],
                    ),
                    draft === output.returnedDraft
                      ? h.span([h.Class('tag ok')], ['returned to you'])
                      : Option.isNone(maybeRating)
                        ? h.span([h.Class('tag warn')], ['written, unread'])
                        : h.empty,
                  ],
                )
              }),
            )
          : output._tag === 'LoopResumed'
            ? strip(
                [
                  cell(
                    'Before the crash',
                    `engine: ${output.engine}`,
                    [
                      h.p(
                        [],
                        [`${output.generationsBeforeCrash} drafts written`],
                      ),
                    ],
                    false,
                    h,
                  ),
                  cell(
                    'After the restart',
                    output.generationsRedone === 0
                      ? 'continued at draft 3'
                      : 'started over',
                    [
                      h.p(
                        [],
                        [`${output.generationsRedone} drafts written again`],
                      ),
                    ],
                    true,
                    h,
                    output.generationsRedone === 0
                      ? { text: 'nothing paid twice', tone: 'ok' }
                      : { text: 'paid twice', tone: 'warn' },
                  ),
                ],
                h,
              )
            : h.empty,
    }),
    h.p(
      [h.Class('where')],
      [
        'The rule, as read in the reference code: stop at a draft rated good, refine at most three times, hand back the best rated, not the last.',
      ],
    ),
  ]
}

// 12 · NETWORK

const networkBench = (model: Model, h: H): ReadonlyArray<Html> => {
  const world = model.world
  const inventory = inventoryOf(world)
  return [
    row([action(model, 'List the inventory', run('list_inventory', {}), h)], h),
    h.div(
      [h.Class('twoup')],
      [
        h.div(
          [h.Class('placebox framed')],
          [
            h.div(
              [h.Class('cellhead')],
              [
                h.h3([], ['One entrance']),
                h.span(
                  [h.Class(`tag ${inventory.length === 4 ? 'ok' : 'warn'}`)],
                  [`${inventory.length} of 4 tools visible`],
                ),
              ],
            ),
            h.p([h.Class('where')], ['click a tool to call it']),
            h.div(
              [h.Class('filelist')],
              Array.map(inventory, entry =>
                h.button(
                  [
                    h.Type('button'),
                    h.Class('file'),
                    h.Disabled(isRunning(model)),
                    h.OnClick(run('call_tool', { name: entry.name })),
                  ],
                  [
                    h.span([h.Class('file-path')], [entry.name]),
                    h.span(
                      [h.Class('tag quiet')],
                      [
                        entry.backend === 'forge-backend'
                          ? 'forge backend'
                          : 'dock backend',
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        h.div(
          [h.Class('stack')],
          [
            cell('Forge backend', 'offers inspect and ship', [], false, h, {
              text: 'up',
              tone: 'ok',
            }),
            cell(
              'Dock backend',
              'offers inspect and weigh',
              [
                action(
                  model,
                  world.net.dock === 'up' ? 'Take it down' : 'Bring it back',
                  Message.SelectedSetting({
                    setting: world.net.dock === 'up' ? 'dock=down' : 'dock=up',
                  }),
                  h,
                ),
              ],
              false,
              h,
              world.net.dock === 'up'
                ? { text: 'up', tone: 'ok' }
                : { text: 'down, still listed', tone: 'warn' },
            ),
          ],
        ),
      ],
    ),
  ]
}

// 13 · INSPECT THE INSPECTOR

const inspectorBench = (model: Model, h: H): ReadonlyArray<Html> => {
  const maybeProfile = Option.flatMap(lastOutput(model), output =>
    output._tag === 'ServerProfiled' ? Option.some(output) : Option.none(),
  )
  return [
    chips(
      'Point it at',
      pipe(
        catalogue,
        Array.map(capability => capability.specimen),
        Array.dedupe,
        Array.filter(specimen => specimen !== 'inspector'),
        Array.map(specimen => ({
          label: serverNames[specimen],
          isChosen: Option.exists(
            maybeProfile,
            profiled => profiled.server === specimen,
          ),
          message: run('profile_server', { name: specimen }),
        })),
      ),
      h,
    ),
    row(
      [
        action(
          model,
          'Point it at itself, once',
          run('profile_self', {}),
          h,
          'primary',
        ),
      ],
      h,
    ),
    Option.match(maybeProfile, {
      onNone: () =>
        h.p(
          [h.Class('empty')],
          ['Pick a server. The inspector reads its listing and nothing else.'],
        ),
      onSome: profiled =>
        h.div(
          [h.Class('stack')],
          [
            h.div(
              [h.Class('filelist')],
              Array.map(profiled.tools, tool =>
                h.keyed('div')(
                  tool.name,
                  [h.Class('file')],
                  [
                    h.span([h.Class('file-path')], [tool.name]),
                    h.span([h.Class('mono')], [tool.rules.join(' ')]),
                    h.span([h.Class('mono')], [tool.fingerprint]),
                    h.span(
                      [
                        h.Class(
                          `tag ${tool.drift === 'changed' ? 'bad' : 'quiet'}`,
                        ),
                      ],
                      [
                        tool.drift === 'changed'
                          ? 'changed since pinned'
                          : 'matches its pin',
                      ],
                    ),
                  ],
                ),
              ),
            ),
            strip(
              [
                cell(
                  'One claim it can support',
                  'and what it rests on',
                  [h.p([], [profiled.supported])],
                  true,
                  h,
                  { text: 'declared by the server', tone: 'ok' },
                ),
                cell(
                  'One thing it cannot establish',
                  profiled.isSelf
                    ? 'about itself'
                    : 'about any server, from a listing',
                  [h.p([], [profiled.cannotEstablish])],
                  false,
                  h,
                  { text: 'unknown', tone: 'warn' },
                ),
              ],
              h,
            ),
            profiled.isSelf
              ? h.p(
                  [h.Class('where')],
                  [
                    'One snapshot. There is no tool here that profiles a profile.',
                  ],
                )
              : h.empty,
          ],
        ),
    }),
    h.p(
      [h.Class('where')],
      [
        'Rule ids are explained in the Lens tab in Backstage. Inside this bench the inspected server is the lab’s own catalogue; no connection is made.',
      ],
    ),
  ]
}

// DISPATCH

export const benchView = (model: Model, h: H): ReadonlyArray<Html> => {
  if (model.station === 'valley') {
    return valleyBench(model, h)
  }
  if (model.station === 'fetch') {
    return fetchBench(model, h)
  }
  if (model.station === 'memory') {
    return memoryBench(model, h)
  }
  if (model.station === 'thinking') {
    return thinkingBench(model, h)
  }
  if (model.station === 'filesystem') {
    return filesystemBench(model, h)
  }
  if (model.station === 'perception') {
    return perceptionBench(model, h)
  }
  if (model.station === 'cli') {
    return cliBench(model, h)
  }
  if (model.station === 'local-remote') {
    return gatewayBench(model, h)
  }
  if (model.station === 'apps') {
    return appBench(model, h)
  }
  if (model.station === 'code-mode') {
    return codeBench(model, h)
  }
  if (model.station === 'delegation') {
    return delegationBench(model, h)
  }
  if (model.station === 'iteration') {
    return iterationBench(model, h)
  }
  if (model.station === 'inspector') {
    return inspectorBench(model, h)
  }
  return networkBench(model, h)
}
