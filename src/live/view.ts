import { Option } from 'effect'
import type { Document, Html, HtmlBuilder } from 'foldkit/html'

import {
  interfaceProfile,
  interfaceUnknowns,
} from '../domain/interface-profile.ts'
import { iconView } from '../lab/icons.ts'
import {
  backstageLayout,
  benchShell,
  benchStep,
  brandContents,
  toolbenchLayout,
} from '../lab/layout.ts'
import type {
  Evidence,
  Invocation,
  RegistryEntry,
  Session,
  Tool,
} from './contract.ts'
import { Message } from './message.ts'
import { AppState, type BackstageTab, type Model } from './model.ts'
import { ConnectApp } from './mount.ts'
import {
  type SpecimenId,
  allowedTools,
  hostName,
  hostVersion,
  isRegistry,
  shelf,
  specimens,
} from './specimens.ts'

type H = HtmlBuilder<Message>

const selectedTool = (model: Model): Option.Option<Tool> =>
  Option.flatMap(model.session, session =>
    Option.fromNullishOr(session.tools.find(tool => tool.name === model.tool)),
  )

const instrumentIcon = (tool: Tool, h: H): Html =>
  iconView(
    tool.uiUri
      ? 'get_current_view'
      : tool.name === 'echo'
        ? 'call_live'
        : tool.name === 'request_bridge_edit'
          ? 'write_entry'
          : 'list_inventory',
    h,
  )

const identity = (model: Model, h: H): Html =>
  h.header(
    [h.Class('titlebar')],
    [
      h.p(
        [h.Class('location'), h.AriaLabel('Current location')],
        [
          h.a([h.Class('crumb'), h.Href('/')], ['← Atlas']),
          ' / ',
          h.b([], [specimens[model.specimen].title]),
        ],
      ),
      h.span([h.Class('simtag')], [specimens[model.specimen].mode]),
    ],
  )

const navigation = (model: Model, h: H): Html => {
  const current = isRegistry(model.specimen) ? 'registry' : model.specimen
  return h.nav(
    [h.Class('sidebar'), h.AriaLabel('Specimens')],
    [
      h.div(
        [h.Class('journey-groups')],
        [
          h.a(
            [
              h.Class('brand'),
              h.Href('/'),
              h.AriaLabel('MCP Lab, back to the atlas'),
            ],
            brandContents(h),
          ),
          h.section(
            [h.Class('side-section')],
            [
              h.h2([h.Class('side-title')], ['Live specimens · any order']),
              h.ol(
                [h.Class('journey')],
                shelf.map(id => {
                  const active = id === current
                  const specimen = active ? model.specimen : id
                  const count = active
                    ? Option.map(model.session, session => session.tools.length)
                    : Option.none()
                  return h.keyed('li')(
                    id,
                    [],
                    [
                      h.button(
                        [
                          h.Type('button'),
                          h.Class('rung'),
                          h.AriaCurrent(active ? 'page' : 'false'),
                          h.AriaLabel(
                            `${specimens[id].title} ${specimens[specimen].mode}`,
                          ),
                          h.Disabled(model.operation._tag !== 'Idle'),
                          h.OnClick(Message.SelectedSpecimen({ specimen })),
                        ],
                        [
                          h.span([
                            h.Class(active ? 'dot seen' : 'dot'),
                            h.AriaHidden(true),
                          ]),
                          h.span([h.Class('t')], [specimens[id].title]),
                          h.span(
                            [h.Class('n')],
                            [
                              Option.match(count, {
                                onNone: () =>
                                  id === 'registry' ? 'REST / MCP' : '—',
                                onSome: value =>
                                  `${value} ${value === 1 ? 'tool' : 'tools'}`,
                              }),
                            ],
                          ),
                        ],
                      ),
                    ],
                  )
                }),
              ),
            ],
          ),
          h.a(
            [h.Class('side-note crumb'), h.Href('/lab/concept.html')],
            ['Simulated prototype'],
          ),
        ],
      ),
    ],
  )
}

const runStatus = (model: Model, h: H): Html => {
  if (model.operation._tag !== 'Idle') {
    return h.span(
      [h.Class('pill busy'), h.Role('status')],
      [`${model.operation._tag}…`],
    )
  }
  if (
    Option.isSome(model.error) ||
    Option.exists(model.invocation, result => result.isError)
  ) {
    return h.span([h.Class('pill warn')], ['Failed'])
  }
  if (Option.isSome(model.invocation) || Option.isSome(model.registry)) {
    return h.span([h.Class('pill ok')], ['Done'])
  }
  return h.span([h.Class('pill')], ['Idle'])
}

const questions: Record<SpecimenId, string> = {
  time: 'What happens when a tool opens its own view?',
  everything: 'What does this server actually hand you?',
  boundary: 'Who can change the bridge note?',
  registry: 'What does the registry know about a server?',
  'registry-mcp': 'What does the registry know about a server?',
}

const specimenHeader = (model: Model, h: H): Html => {
  const specimen = specimens[model.specimen]
  return h.div(
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
                [`${specimen.title} · ${specimen.version}`],
              ),
              h.h2([h.Class('question')], [questions[model.specimen]]),
            ],
          ),
        ],
      ),
      h.details(
        [h.Class('fold')],
        [
          h.summary([], ['Where it bends, and the experiment']),
          h.p([], [specimen.description]),
        ],
      ),
      specimen.source
        ? h.details(
            [h.Class('fold')],
            [
              h.summary([], ['Sources (1)']),
              h.p(
                [h.Class('sources')],
                [
                  h.a(
                    [
                      h.Href(specimen.source),
                      h.Target('_blank'),
                      h.Rel('noreferrer'),
                    ],
                    [specimen.version],
                  ),
                ],
              ),
            ],
          )
        : h.empty,
    ],
  )
}

const button = (
  label: string,
  message: Message,
  disabled: boolean,
  classes: string,
  h: H,
): Html =>
  h.button(
    [
      h.Type('button'),
      h.Class(classes),
      h.Disabled(disabled),
      h.OnClick(message),
    ],
    [label],
  )

const sessionControls = (model: Model, h: H): Html =>
  h.div(
    [h.Class('benchtools')],
    [
      isRegistry(model.specimen) ? registryEntrances(model, h) : h.empty,
      model.specimen === 'registry'
        ? h.empty
        : h.div(
            [h.Class('bend')],
            [
              button(
                model.operation._tag === 'Discovering'
                  ? 'Discovering…'
                  : Option.isSome(model.session)
                    ? 'Discover again'
                    : 'Discover tools',
                Message.ClickedDiscover(),
                model.operation._tag !== 'Idle',
                'btn ghost small',
                h,
              ),
              Option.match(model.session, {
                onNone: () => h.empty,
                onSome: session =>
                  button(
                    model.operation._tag === 'Stopping'
                      ? 'Stopping…'
                      : 'Stop specimen',
                    Message.ClickedStop(),
                    model.operation._tag !== 'Idle' ||
                      session.state !== 'ready',
                    'btn ghost small',
                    h,
                  ),
              }),
            ],
          ),
    ],
  )

const signature = (tool: Tool): string => {
  const schema: unknown = JSON.parse(tool.inputSchemaJson)
  const properties =
    typeof schema === 'object' && schema !== null && 'properties' in schema
      ? schema.properties
      : undefined
  const keys =
    typeof properties === 'object' && properties !== null
      ? Object.keys(properties)
      : []
  return `${tool.name}(${keys.join(', ')})`
}

const instrument = (model: Model, tool: Tool, index: number, h: H): Html =>
  h.keyed('button')(
    tool.name,
    [
      h.Type('button'),
      h.Class(
        Option.exists(model.invocation, result => result.tool === tool.name)
          ? 'tb-tool active'
          : 'tb-tool',
      ),
      h.AriaPressed(String(model.tool === tool.name)),
      h.AriaLabel(tool.uiUri ? `${tool.name} App` : tool.name),
      h.OnClick(Message.SelectedTool({ tool: tool.name })),
    ],
    [
      h.span([h.Class('tb-key'), h.AriaHidden(true)], [String(index + 1)]),
      instrumentIcon(tool, h),
      h.span([h.Class('tb-sig')], [signature(tool)]),
      h.span(
        [h.Class(tool.readOnlyHint === true ? 'tb-hint ro' : 'tb-hint')],
        [`readOnlyHint ${tool.readOnlyHint ?? '—'}`],
      ),
      tool.uiUri
        ? h.span([h.Class('tb-workshop')], ['contains a workshop'])
        : h.empty,
    ],
  )

const instruments = (model: Model, h: H): Html =>
  Option.match(model.session, {
    onNone: () =>
      h.div(
        [h.Class('tb-instruments')],
        [
          benchStep(
            '1',
            'Handed to you',
            'from the server’s tools/list answer',
            h,
          ),
          h.p(
            [h.Class('quiet')],
            ['Discover tools to open this server’s inventory.'],
          ),
        ],
      ),
    onSome: session =>
      h.div(
        [h.Class('tb-instruments')],
        [
          benchStep(
            '1',
            `Handed to you by ${session.server}`,
            session.partial
              ? 'from its partial tools/list answer'
              : 'from its tools/list answer just now',
            h,
          ),
          session.tools.length === 0
            ? h.p([h.Class('quiet')], ['No tools have been observed.'])
            : h.div(
                [h.Class('tb-tools')],
                session.tools.map((tool, index) =>
                  instrument(model, tool, index, h),
                ),
              ),
        ],
      ),
  })

const toolDrawer = (model: Model, session: Session, tool: Tool, h: H): Html => {
  const allowed = allowedTools[model.specimen].includes(tool.name)
  const label =
    model.operation._tag === 'Calling'
      ? 'Calling…'
      : session.state === 'stopped'
        ? 'Retry tool'
        : model.specimen === 'time'
          ? 'Open time app'
          : 'Run tool'
  return h.div(
    [h.Class('tb-drawer')],
    [
      h.div(
        [h.Class('tb-drawer-head')],
        [
          h.span([h.Class('bigicon')], [instrumentIcon(tool, h)]),
          h.div(
            [],
            [
              h.h3([], [tool.title ?? tool.name]),
              tool.description
                ? h.p([h.Class('tb-plain')], [tool.description])
                : h.empty,
            ],
          ),
          allowed && model.specimen !== 'registry-mcp'
            ? button(
                label,
                Message.ClickedCall(),
                model.operation._tag !== 'Idle' || session.state === 'failed',
                'btn',
                h,
              )
            : h.empty,
        ],
      ),
      !allowed
        ? h.p(
            [h.Class('tb-quiet')],
            ['This tool is available for metadata inspection in the lab.'],
          )
        : h.empty,
      h.details(
        [h.Class('fold tb-nerd')],
        [
          h.summary([], ['Under the hood: input schema and tool metadata']),
          h.pre([h.Class('page')], [tool.inputSchemaJson]),
          button(
            'Open Lens',
            Message.SelectedBackstageTab({ tab: 'lens' }),
            false,
            'btn ghost small',
            h,
          ),
        ],
      ),
    ],
  )
}

const rolePicker = (model: Model, h: H): Html =>
  h.fieldset(
    [h.Class('ctl live-roles')],
    [
      h.legend([h.Class('eyebrow')], ['Synthetic role']),
      ...(['viewer', 'editor'] as const).map(role =>
        h.keyed('label')(
          role,
          [],
          [
            h.input([
              h.Type('radio'),
              h.Name('synthetic-role'),
              h.Checked(model.role === role),
              h.OnChange(() => Message.UpdatedRole({ role })),
            ]),
            role === 'viewer' ? 'Viewer' : 'Editor',
          ],
        ),
      ),
    ],
  )

const appView = (model: Model, session: Session, h: H): Html =>
  Option.match(model.app, {
    onNone: () =>
      h.p(
        [h.Class('tb-quiet')],
        ['Open the time app to load the upstream view here.'],
      ),
    onSome: resource =>
      h.section(
        [h.Class('card'), h.AriaLabel('Upstream app')],
        [
          h.div(
            [h.Class('cardhead')],
            [
              h.h3([], ['Upstream view']),
              h.code([h.Class('meta mono')], [resource.uri]),
            ],
          ),
          h.p(
            [h.Role('status'), h.Class('tb-quiet')],
            [
              AppState.match(model.appState, {
                Starting: () => 'Starting the Apps bridge…',
                Ready: () => 'Apps bridge initialized',
                Failed: ({ error }) => error,
              }),
            ],
          ),
          h.div(
            [],
            [resource].map(app =>
              h.keyed('div')(`${session.id}:${app.run}`, [
                h.Class('live-app-mount'),
                h.OnMount(ConnectApp({ resource: app, sessionId: session.id })),
              ]),
            ),
          ),
        ],
      ),
  })

const material = (model: Model, h: H): ReadonlyArray<Html> => {
  if (model.specimen === 'registry') {
    return [
      registryForm(
        model,
        'Search registry',
        Message.SubmittedSearch(),
        false,
        h,
      ),
      registryResults(model, h),
    ]
  }
  return Option.match(model.session, {
    onNone: () => [
      h.p(
        [h.Class('tb-quiet')],
        ['The work area opens when the specimen has been discovered.'],
      ),
    ],
    onSome: session => [
      session.state === 'stopped'
        ? h.p(
            [h.Role('status'), h.Class('pill busy')],
            ['Specimen stopped. Retry the tool to inspect the failure.'],
          )
        : h.empty,
      Option.match(selectedTool(model), {
        onNone: () => h.empty,
        onSome: tool =>
          !allowedTools[model.specimen].includes(tool.name)
            ? h.empty
            : model.specimen === 'everything'
              ? h.label(
                  [h.Class('field')],
                  [
                    'Message',
                    h.input([
                      h.Type('text'),
                      h.Maxlength(240),
                      h.Value(model.echoMessage),
                      h.OnInput(value => Message.UpdatedEcho({ value })),
                    ]),
                  ],
                )
              : model.specimen === 'boundary'
                ? rolePicker(model, h)
                : model.specimen === 'registry-mcp'
                  ? registryForm(
                      model,
                      session.state === 'stopped'
                        ? 'Retry tool'
                        : 'Search via MCP',
                      Message.ClickedCall(),
                      session.state === 'failed',
                      h,
                    )
                  : h.empty,
      }),
      model.specimen === 'time' ? appView(model, session, h) : h.empty,
      model.specimen === 'registry-mcp' ? registryResults(model, h) : h.empty,
    ],
  })
}

const resultPayload = (invocation: Invocation): unknown =>
  JSON.parse(invocation.resultJson)

const invocationView = (invocation: Invocation, h: H): Html => {
  const result = resultPayload(invocation)
  const text =
    typeof result === 'object' &&
    result !== null &&
    'content' in result &&
    Array.isArray(result.content)
      ? result.content
          .flatMap((item: unknown) =>
            typeof item === 'object' &&
            item !== null &&
            'text' in item &&
            typeof item.text === 'string'
              ? [item.text]
              : [],
          )
          .join('\n')
      : ''
  return h.div(
    [
      h.Class(invocation.isError ? 'result warn' : 'result ok'),
      h.Role('status'),
    ],
    [
      h.p([], [text || 'The server returned structured content.']),
      h.small(
        [h.Class('tb-note')],
        [
          `${invocation.tool} · ${invocation.from === 'app' ? 'App requested' : 'Learner requested'}`,
        ],
      ),
    ],
  )
}

const resultTray = (model: Model, h: H): ReadonlyArray<Html> => [
  benchStep('3', 'Comes back', 'the result of the last call', h),
  Option.match(model.error, {
    onNone: () => h.empty,
    onSome: error =>
      h.div([h.Class('result warn'), h.Role('alert')], [h.p([], [error])]),
  }),
  Option.match(model.invocation, {
    onNone: () =>
      Option.isSome(model.error) || Option.isSome(model.registry)
        ? h.empty
        : h.p(
            [h.Class('result idle')],
            ['Nothing run yet. The result appears here.'],
          ),
    onSome: invocation => invocationView(invocation, h),
  }),
  Option.match(model.registry, {
    onNone: () => h.empty,
    onSome: page =>
      Option.isSome(model.invocation)
        ? h.empty
        : h.p(
            [h.Class('result ok')],
            [`${page.entries.length} published records returned.`],
          ),
  }),
  model.specimen === 'boundary'
    ? benchStep('4', 'Stays changed', 'after the call is over', h)
    : h.empty,
  model.specimen === 'boundary'
    ? Option.match(model.invocation, {
        onNone: () =>
          h.p([h.Class('tb-quiet')], ['Nothing has run on this bench yet.']),
        onSome: invocation => boundaryRevision(invocation, h),
      })
    : h.empty,
]

const boundaryRevision = (invocation: Invocation, h: H): Html => {
  const result = resultPayload(invocation)
  const receipt =
    typeof result === 'object' &&
    result !== null &&
    'structuredContent' in result
      ? result.structuredContent
      : undefined
  if (
    typeof receipt !== 'object' ||
    receipt === null ||
    !('before' in receipt) ||
    !('after' in receipt) ||
    typeof receipt.before !== 'number' ||
    typeof receipt.after !== 'number'
  ) {
    return h.empty
  }
  return h.p(
    [h.Class(receipt.before === receipt.after ? 'tb-quiet' : 'tb-stamp')],
    [
      receipt.before === receipt.after
        ? `The bridge note stayed at revision ${receipt.after}.`
        : `Bridge note · revision ${receipt.before} → ${receipt.after}`,
    ],
  )
}

const workbench = (model: Model, h: H): Html =>
  h.main(
    [h.Class('workbench'), h.AriaLabel('Workbench')],
    [
      h.div(
        [h.Class('panehead')],
        [
          h.span([h.Class('eyebrow')], ['Onstage · what you see']),
          runStatus(model, h),
        ],
      ),
      specimenHeader(model, h),
      sessionControls(model, h),
      toolbenchLayout(
        {
          host: h.div(
            [h.Class('tb-host')],
            [
              h.span([], [h.b([], ['Host ']), `${hostName} ${hostVersion}`]),
              h.span(
                [h.Class('tb-note')],
                [
                  model.specimen === 'registry'
                    ? 'Official Registry REST'
                    : 'You choose what runs',
                ],
              ),
            ],
          ),
          instruments:
            model.specimen === 'registry' ? h.empty : instruments(model, h),
          drawer: Option.match(
            Option.flatMap(model.session, session =>
              Option.map(selectedTool(model), tool => ({ session, tool })),
            ),
            {
              onNone: () => h.empty,
              onSome: ({ session, tool }) =>
                toolDrawer(model, session, tool, h),
            },
          ),
          materialClass: Option.isSome(model.invocation)
            ? 'tb-material touched'
            : 'tb-material',
          material: [
            benchStep(
              '2',
              'What they work on',
              'the specimen’s inputs and view',
              h,
            ),
            ...material(model, h),
          ],
          tray: resultTray(model, h),
        },
        h,
      ),
    ],
  )

const registryRecord = (entry: RegistryEntry, h: H): Html =>
  h.keyed('li')(
    `${entry.name}:${entry.version}`,
    [h.Class('card')],
    [
      h.h3([], [entry.name]),
      h.code([h.Class('tb-note mono')], [entry.version]),
      h.p([h.Class('desc')], [entry.description]),
      ...entry.packages.map(identifier =>
        h.keyed('p')(
          identifier,
          [h.Class('sources')],
          [`Package · ${identifier}`],
        ),
      ),
      ...entry.remotes.map(url =>
        h.keyed('p')(url, [h.Class('sources')], [`Remote endpoint · ${url}`]),
      ),
    ],
  )

const registryForm = (
  model: Model,
  label: string,
  action: Message,
  disabled: boolean,
  h: H,
): Html =>
  h.form(
    [h.Class('ctl'), h.OnSubmit(action)],
    [
      h.label(
        [h.Class('field')],
        [
          'Registry query',
          h.input([
            h.Type('search'),
            h.Required(true),
            h.Minlength(3),
            h.Maxlength(120),
            h.Value(model.query),
            h.OnInput(value => Message.UpdatedQuery({ value })),
          ]),
        ],
      ),
      h.button(
        [
          h.Type('submit'),
          h.Class('btn'),
          h.Disabled(disabled || model.operation._tag !== 'Idle'),
        ],
        [model.operation._tag === 'Idle' ? label : 'Searching…'],
      ),
    ],
  )

const registryResults = (model: Model, h: H): Html =>
  Option.match(model.registry, {
    onNone: () => h.empty,
    onSome: ({ entries, partial }) =>
      h.div(
        [h.Class('tabpane')],
        [
          h.p(
            [h.Role('status'), h.Class('mode')],
            [
              entries.length === 0
                ? 'The registry returned no matching records.'
                : `${entries.length} published records${partial ? ' in the first page' : ''}.`,
            ],
          ),
          h.ul(
            [h.Class('tabpane')],
            entries.map(entry => registryRecord(entry, h)),
          ),
        ],
      ),
  })

const registryEntrances = (model: Model, h: H): Html =>
  h.div(
    [h.Class('bend')],
    [
      h.span([h.Class('bendlabel')], ['Entrance']),
      h.div(
        [h.Class('seg'), h.Role('group'), h.AriaLabel('Registry entrance')],
        [
          h.button(
            [
              h.Type('button'),
              h.AriaPressed(String(model.specimen === 'registry')),
              h.Disabled(model.operation._tag !== 'Idle'),
              h.OnClick(Message.SelectedSpecimen({ specimen: 'registry' })),
            ],
            ['Direct REST'],
          ),
          h.button(
            [
              h.Type('button'),
              h.AriaPressed(String(model.specimen === 'registry-mcp')),
              h.Disabled(model.operation._tag !== 'Idle'),
              h.OnClick(Message.SelectedSpecimen({ specimen: 'registry-mcp' })),
            ],
            ['Local MCP adapter'],
          ),
        ],
      ),
    ],
  )

const kindOf = (event: Evidence): string => {
  if (event.direction === 'in') {
    return 'res'
  }
  if (event.direction === 'out') {
    return 'req'
  }
  return event.label.toLowerCase().includes('failed') ? 'failed' : 'host'
}

const arrowOf = (event: Evidence): string =>
  event.direction === 'out' ? '→' : event.direction === 'in' ? '←' : '·'

const recentFrames = (model: Model, h: H): Html =>
  h.div(
    [h.Class('card ran')],
    [
      h.div(
        [h.Class('cardhead')],
        [
          h.h3([], ['On the wire']),
          h.span(
            [h.Class('meta')],
            [`${model.events.length} events in this run`],
          ),
        ],
      ),
      model.events.length === 0
        ? h.p([h.Class('side-note')], ['Nothing has crossed yet.'])
        : h.ol(
            [h.Class('wire')],
            model.events
              .slice(-6)
              .reverse()
              .map(event =>
                h.keyed('li')(
                  String(event.seq),
                  [h.DataAttribute('kind', kindOf(event))],
                  [
                    h.span(
                      [h.Class('arrow'), h.AriaHidden(true)],
                      [arrowOf(event)],
                    ),
                    h.span([h.Class('lab')], [event.label]),
                  ],
                ),
              ),
          ),
      button(
        'Open the frames',
        Message.SelectedBackstageTab({ tab: 'frames' }),
        false,
        'btn ghost small',
        h,
      ),
    ],
  )

const fact = (label: string, value: string, h: H): Html =>
  h.div([], [h.dt([], [label]), h.dd([], [value])])

const inspector = (model: Model, h: H): Html =>
  h.aside(
    [h.Class('inspector'), h.AriaLabel('Evidence')],
    [
      recentFrames(model, h),
      h.details(
        [h.Class('fold')],
        [
          h.summary([], ['What is real on this page']),
          h.dl(
            [h.Class('facts')],
            [
              fact('Host', `${hostName} ${hostVersion}`, h),
              fact('Mode', specimens[model.specimen].mode, h),
              fact('Source', specimens[model.specimen].version, h),
              ...Option.match(model.session, {
                onNone: () => [],
                onSome: session => [
                  fact(
                    'Observed server',
                    `${session.server} · ${session.version}`,
                    h,
                  ),
                  fact('Transport', session.transport, h),
                  fact('Protocol', session.protocol, h),
                ],
              }),
            ],
          ),
        ],
      ),
    ],
  )

const traceView = (
  events: ReadonlyArray<Evidence>,
  scope: string,
  peers: readonly [string, string],
  h: H,
): Html =>
  events.length === 0
    ? h.p(
        [h.Class('quiet')],
        ['No events yet. Use the bench to see what crosses.'],
      )
    : h.ol(
        [h.Class('log')],
        events.map(event =>
          h.keyed('li')(
            `${scope}:${event.seq}`,
            [h.DataAttribute('kind', kindOf(event))],
            [
              h.span([h.Class('n')], [String(event.seq)]),
              h.span(
                [h.Class('hop')],
                [
                  event.direction === 'local'
                    ? 'Host'
                    : event.direction === 'out'
                      ? peers.join(' → ')
                      : [peers[1], peers[0]].join(' → '),
                ],
              ),
              h.details(
                [h.Class('lab')],
                [
                  h.summary([], [event.label]),
                  h.time([h.Class('hop'), h.Datetime(event.at)], [event.at]),
                  h.pre([], [event.detail]),
                ],
              ),
            ],
          ),
        ),
      )

const mode = (label: string, detail: string, h: H): Html =>
  h.p([h.Class('mode')], [h.b([], [label]), ` · ${detail}`])

const frameTab = (model: Model, h: H): Html => {
  const direct = model.specimen === 'registry'
  const scope = Option.match(model.session, {
    onNone: () => `request:${model.epoch}`,
    onSome: session => session.id,
  })
  return h.div(
    [h.Class('tabpane')],
    [
      mode(
        direct ? 'Official Registry REST' : 'Actual MCP connection',
        Option.match(model.session, {
          onNone: () => (direct ? 'host ↔ Registry' : 'host ↔ specimen'),
          onSome: session =>
            `${session.transport} · ${session.server} · MCP ${session.protocol}`,
        }),
        h,
      ),
      model.dropped > 0
        ? h.p(
            [h.Class('quietline')],
            [`${model.dropped} older events omitted.`],
          )
        : h.empty,
      traceView(
        model.events,
        scope,
        ['host', direct ? 'Registry' : 'specimen'],
        h,
      ),
    ],
  )
}

const lensTab = (model: Model, h: H): Html =>
  h.div(
    [h.Class('tabpane')],
    [
      mode('MCP Lens', 'advertised interface', h),
      Option.match(selectedTool(model), {
        onNone: () =>
          h.p(
            [h.Class('quiet')],
            ['Select a discovered tool to inspect its claims.'],
          ),
        onSome: tool =>
          h.div(
            [h.Class('card')],
            [
              h.h3([], [tool.name]),
              h.ul(
                [h.Class('text-list')],
                interfaceProfile(tool).map(claim =>
                  h.keyed('li')(
                    claim.rule,
                    [h.Class('desc')],
                    [
                      claim.statement,
                      ' ',
                      h.code([h.Class('mono')], [claim.evidence]),
                    ],
                  ),
                ),
              ),
              h.h3([], ['Unknown from this listing']),
              h.ul(
                [h.Class('text-list')],
                interfaceUnknowns.map(unknown =>
                  h.keyed('li')(unknown, [h.Class('desc')], [unknown]),
                ),
              ),
              h.details(
                [h.Class('fold')],
                [
                  h.summary([], ['Input schema']),
                  h.pre([h.Class('page')], [tool.inputSchemaJson]),
                ],
              ),
            ],
          ),
      }),
    ],
  )

const lastResultTab = (model: Model, h: H): Html =>
  h.div(
    [h.Class('tabpane')],
    [
      Option.match(model.invocation, {
        onNone: () =>
          h.p([h.Class('quiet')], ['No tool result has been observed.']),
        onSome: invocation =>
          h.div(
            [h.Class('card')],
            [
              h.h3([], [invocation.tool]),
              h.h4([], ['Arguments']),
              h.pre([h.Class('page')], [invocation.argumentsJson]),
              h.h4([], ['Result']),
              h.pre([h.Class('page')], [invocation.resultJson]),
            ],
          ),
      }),
    ],
  )

const traceTab = (model: Model, tab: 'app' | 'registry', h: H): Html =>
  h.div(
    [h.Class('tabpane')],
    [
      h.h3([], [tab === 'app' ? 'App ↔ Host' : 'Adapter’s REST receipt']),
      mode(
        tab === 'app' ? 'MCP Apps bridge' : 'Official Registry REST',
        tab === 'app'
          ? 'messages between the embedded app and the host'
          : 'reported by the local MCP adapter',
        h,
      ),
      tab === 'app' && (model.appEvents[0]?.seq ?? 1) > 1
        ? h.p(
            [h.Class('quietline')],
            [`${(model.appEvents[0]?.seq ?? 1) - 1} older events omitted.`],
          )
        : h.empty,
      tab === 'app'
        ? traceView(model.appEvents, 'app', ['host', 'app'], h)
        : traceView(
            model.registryEvents,
            `receipt:${model.epoch}`,
            ['adapter', 'Registry'],
            h,
          ),
    ],
  )

const backstage = (model: Model, h: H): Html => {
  const tabs: ReadonlyArray<readonly [BackstageTab, string]> = [
    ['frames', model.specimen === 'registry' ? 'REST requests' : 'MCP frames'],
    ['lens', 'Lens'],
    ['result', 'Last result'],
    ...(model.specimen === 'time' ? ([['app', 'App messages']] as const) : []),
    ...(model.specimen === 'registry-mcp'
      ? ([['registry', 'REST receipt']] as const)
      : []),
  ]
  return backstageLayout(
    model.backstage,
    Message.ClickedToggleBackstage(),
    tabs.map(([tab, label]) =>
      h.keyed('button')(
        tab,
        [
          h.Type('button'),
          h.AriaPressed(String(model.tab === tab)),
          h.OnClick(Message.SelectedBackstageTab({ tab })),
        ],
        [label],
      ),
    ),
    model.backstage === 'collapsed'
      ? h.empty
      : model.tab === 'frames'
        ? frameTab(model, h)
        : model.tab === 'lens'
          ? lensTab(model, h)
          : model.tab === 'result'
            ? lastResultTab(model, h)
            : traceTab(model, model.tab, h),
    h,
  )
}

const statusbar = (model: Model, h: H): Html =>
  h.footer(
    [h.Class('statusbar')],
    [
      h.span([], [specimens[model.specimen].mode]),
      h.span(
        [],
        [
          Option.match(model.session, {
            onNone: () =>
              model.specimen === 'registry'
                ? 'Official Registry · REST'
                : 'Discover tools to connect',
            onSome: session => `${session.transport} · ${session.state}`,
          }),
        ],
      ),
    ],
  )

export const view = (model: Model, h: H): Document => ({
  title: 'Live workbench · MCP Lab',
  body: benchShell(
    model.backstage,
    {
      titlebar: identity(model, h),
      sidebar: navigation(model, h),
      workbench: workbench(model, h),
      inspector: inspector(model, h),
      panel: backstage(model, h),
      statusbar: statusbar(model, h),
    },
    h,
  ),
})
