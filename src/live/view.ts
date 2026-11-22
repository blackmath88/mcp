import { Option } from 'effect'
import type { Document, Html, HtmlBuilder } from 'foldkit/html'

import {
  interfaceProfile,
  interfaceUnknowns,
} from '../domain/interface-profile.ts'
import type {
  Evidence,
  Invocation,
  RegistryEntry,
  Session,
  Tool,
} from './contract.ts'
import { Message } from './message.ts'
import { AppState, type Model } from './model.ts'
import { ConnectApp } from './mount.ts'
import {
  SpecimenId,
  allowedTools,
  hostName,
  hostVersion,
  specimens,
} from './specimens.ts'

type H = HtmlBuilder<Message>

const button = (
  label: string,
  message: Message,
  disabled: boolean,
  h: H,
): Html =>
  h.button(
    [
      h.Type('button'),
      h.Class('live-button'),
      h.Disabled(disabled),
      h.OnClick(message),
    ],
    [label],
  )

const title = (label: string, h: H): Html =>
  h.h2([h.Class('live-heading')], [label])

const selectedTool = (model: Model): Option.Option<Tool> =>
  Option.flatMap(model.session, session =>
    Option.fromNullishOr(session.tools.find(tool => tool.name === model.tool)),
  )

const inventory = (model: Model, h: H): Html => {
  const busy = model.operation._tag !== 'Idle'
  return h.aside(
    [h.Class('live-inventory'), h.AriaLabel('Inventory')],
    [
      title('Inventory', h),
      h.nav(
        [h.AriaLabel('Live specimens')],
        [
          h.ul(
            [h.Class('live-shelf')],
            SpecimenId.literals.map(id =>
              h.keyed('li')(
                id,
                [],
                [
                  h.button(
                    [
                      h.Type('button'),
                      h.Class('shelf-slot'),
                      h.AriaCurrent(id === model.specimen ? 'page' : 'false'),
                      h.Disabled(busy),
                      h.OnClick(Message.SelectedSpecimen({ specimen: id })),
                    ],
                    [
                      h.span(
                        [h.Class('slot-mark'), h.AriaHidden(true)],
                        [
                          id === 'time'
                            ? '◷'
                            : id === 'everything'
                              ? '≋'
                              : id === 'boundary'
                                ? '◇'
                                : '▤',
                        ],
                      ),
                      h.span(
                        [],
                        [
                          h.strong([], [specimens[id].title]),
                          h.small([], [specimens[id].mode]),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      Option.match(model.session, {
        onNone: () => h.empty,
        onSome: session => toolShelf(model, session, h),
      }),
    ],
  )
}

const toolShelf = (model: Model, session: Session, h: H): Html =>
  h.section(
    [h.Class('tool-shelf')],
    [
      h.h3([], [session.partial ? 'Partial tool listing' : 'Discovered tools']),
      session.tools.length === 0
        ? h.p([], ['No tools have been observed.'])
        : h.empty,
      h.ul(
        [],
        session.tools.map(tool =>
          h.keyed('li')(
            tool.name,
            [],
            [
              h.button(
                [
                  h.Type('button'),
                  h.AriaPressed(String(model.tool === tool.name)),
                  h.OnClick(Message.SelectedTool({ tool: tool.name })),
                ],
                [
                  tool.name,
                  tool.uiUri
                    ? h.span([h.Class('tool-mark')], ['App'])
                    : h.empty,
                ],
              ),
            ],
          ),
        ),
      ),
    ],
  )

const invocationView = (invocation: Invocation, h: H): Html => {
  const result: unknown = JSON.parse(invocation.resultJson)
  const text =
    typeof result === 'object' &&
    result &&
    'content' in result &&
    Array.isArray(result.content)
      ? result.content
          .flatMap((item: unknown) =>
            typeof item === 'object' &&
            item &&
            'text' in item &&
            typeof item.text === 'string'
              ? [item.text]
              : [],
          )
          .join('\n')
      : ''
  return h.div(
    [
      h.Class(invocation.isError ? 'live-error' : 'result-block'),
      h.Role('status'),
    ],
    [
      h.strong(
        [],
        [
          invocation.isError
            ? 'Specimen reported an error'
            : 'Last observed result',
        ],
      ),
      h.p(
        [],
        [
          text ||
            'The server returned structured content. Inspect the result in Backstage.',
        ],
      ),
      h.small(
        [],
        [
          `${invocation.tool} · ${invocation.from === 'app' ? 'App requested' : 'Learner requested'}`,
        ],
      ),
    ],
  )
}

const callControls = (
  model: Model,
  session: Session,
  tool: Tool,
  h: H,
): Html => {
  const busy = model.operation._tag !== 'Idle'
  const allowed = allowedTools[model.specimen].includes(tool.name)
  const canRun = allowed && session.state !== 'failed'
  return h.div(
    [h.Class('live-tool')],
    [
      h.h3([], [tool.title ?? tool.name]),
      tool.description ? h.p([], [tool.description]) : h.empty,
      allowed
        ? h.div(
            [h.Class('tool-controls')],
            [
              model.specimen === 'everything'
                ? h.label(
                    [],
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
                : h.empty,
              model.specimen === 'boundary'
                ? h.fieldset(
                    [h.Class('role-picker')],
                    [
                      h.legend([], ['Synthetic role']),
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
                : h.empty,
              h.div(
                [h.Class('live-actions')],
                [
                  button(
                    model.operation._tag === 'Calling'
                      ? 'Calling…'
                      : session.state === 'stopped'
                        ? 'Retry tool'
                        : model.specimen === 'time'
                          ? 'Open time app'
                          : 'Run tool',
                    Message.ClickedCall(),
                    busy || !canRun,
                    h,
                  ),
                ],
              ),
            ],
          )
        : h.p(
            [h.Class('live-muted')],
            ['This tool is available for metadata inspection in the lab.'],
          ),
    ],
  )
}

const appView = (model: Model, session: Session, h: H): Html =>
  Option.match(model.app, {
    onNone: () => h.empty,
    onSome: resource =>
      h.section(
        [h.Class('app-view'), h.AriaLabel('Upstream app')],
        [
          h.div(
            [h.Class('app-label')],
            [h.strong([], ['Upstream view']), h.code([], [resource.uri])],
          ),
          h.p(
            [h.Role('status'), h.Class('live-muted')],
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
                h.Class('app-mount'),
                h.OnMount(ConnectApp({ resource: app, sessionId: session.id })),
              ]),
            ),
          ),
        ],
      ),
  })

const mcpOnstage = (model: Model, h: H): Html => {
  const busy = model.operation._tag !== 'Idle'
  return h.div(
    [h.Class('live-content')],
    [
      h.div(
        [h.Class('live-actions')],
        [
          button(
            model.operation._tag === 'Discovering'
              ? 'Discovering…'
              : Option.isSome(model.session)
                ? 'Discover again'
                : 'Discover tools',
            Message.ClickedDiscover(),
            busy,
            h,
          ),
          Option.match(model.session, {
            onNone: () => h.empty,
            onSome: session =>
              h.button(
                [
                  h.Type('button'),
                  h.Class('live-button secondary'),
                  h.Disabled(busy || session.state !== 'ready'),
                  h.OnClick(Message.ClickedStop()),
                ],
                [
                  model.operation._tag === 'Stopping'
                    ? 'Stopping…'
                    : 'Stop specimen',
                ],
              ),
          }),
        ],
      ),
      Option.match(model.session, {
        onNone: () => h.empty,
        onSome: session =>
          h.div(
            [h.Class('live-content')],
            [
              session.state === 'stopped'
                ? h.p(
                    [h.Role('status'), h.Class('stopped')],
                    [
                      'Specimen stopped. Retry the tool to inspect the failure.',
                    ],
                  )
                : h.empty,
              Option.match(selectedTool(model), {
                onNone: () => h.empty,
                onSome: tool => callControls(model, session, tool, h),
              }),
              appView(model, session, h),
            ],
          ),
      }),
      Option.match(model.invocation, {
        onNone: () => h.empty,
        onSome: invocation => invocationView(invocation, h),
      }),
    ],
  )
}

const registryRecord = (entry: RegistryEntry, h: H): Html =>
  h.keyed('li')(
    `${entry.name}:${entry.version}`,
    [],
    [
      h.h3([], [entry.name]),
      h.code([h.Class('live-muted')], [entry.version]),
      h.p([], [entry.description]),
      ...entry.packages.map(identifier =>
        h.keyed('p')(
          identifier,
          [h.Class('registry-route')],
          [h.strong([], ['Package']), h.code([], [identifier])],
        ),
      ),
      ...entry.remotes.map(url =>
        h.keyed('p')(
          url,
          [h.Class('registry-route')],
          [h.strong([], ['Remote endpoint']), h.code([], [url])],
        ),
      ),
    ],
  )

const registryOnstage = (model: Model, h: H): Html =>
  h.div(
    [h.Class('live-content')],
    [
      h.form(
        [h.Class('registry-form'), h.OnSubmit(Message.SubmittedSearch())],
        [
          h.label(
            [],
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
              h.Class('live-button'),
              h.Disabled(model.operation._tag !== 'Idle'),
            ],
            [
              model.operation._tag === 'Searching'
                ? 'Searching…'
                : 'Search registry',
            ],
          ),
        ],
      ),
      Option.match(model.registry, {
        onNone: () => h.empty,
        onSome: ({ entries, partial }) =>
          h.div(
            [h.Class('live-content')],
            [
              h.p(
                [h.Role('status')],
                [
                  entries.length === 0
                    ? 'The registry returned no matching records.'
                    : `${entries.length} published records${partial ? ' in the first page' : ''}.`,
                ],
              ),
              h.ul(
                [h.Class('registry-records')],
                entries.map(entry => registryRecord(entry, h)),
              ),
            ],
          ),
      }),
    ],
  )

const onstage = (model: Model, h: H): Html =>
  h.section(
    [h.Class('live-onstage'), h.AriaLabel('Onstage')],
    [
      title('Onstage', h),
      h.h3([h.Class('specimen-title')], [specimens[model.specimen].title]),
      h.p([h.Class('live-muted')], [specimens[model.specimen].description]),
      model.specimen === 'registry'
        ? registryOnstage(model, h)
        : mcpOnstage(model, h),
      Option.match(model.error, {
        onNone: () => h.empty,
        onSome: error => h.p([h.Role('alert'), h.Class('live-error')], [error]),
      }),
    ],
  )

const evidenceView = (events: ReadonlyArray<Evidence>, h: H): Html =>
  h.ol(
    [h.Class('wire-events')],
    events.map(event =>
      h.keyed('li')(
        String(event.seq),
        [],
        [
          h.details(
            [],
            [
              h.summary(
                [h.Class(`event-${event.direction}`)],
                [
                  h.span(
                    [],
                    [
                      event.direction === 'out'
                        ? '→'
                        : event.direction === 'in'
                          ? '←'
                          : '·',
                    ],
                  ),
                  h.code([], [event.label]),
                ],
              ),
              h.time([h.Datetime(event.at)], [event.at]),
              h.pre([], [event.detail]),
            ],
          ),
        ],
      ),
    ),
  )

const profileView = (tool: Tool, h: H): Html =>
  h.details(
    [h.Class('live-detail')],
    [
      h.summary([], ['MCP Lens · advertised interface']),
      h.ul(
        [h.Class('lens-claims')],
        interfaceProfile(tool).map(claim =>
          h.keyed('li')(
            claim.rule,
            [],
            [h.p([], [claim.statement]), h.code([], [claim.evidence])],
          ),
        ),
      ),
      h.h3([], ['Unknown from this listing']),
      h.ul(
        [h.Class('lens-claims')],
        interfaceUnknowns.map(unknown => h.keyed('li')(unknown, [], [unknown])),
      ),
      h.details(
        [],
        [h.summary([], ['Input schema']), h.pre([], [tool.inputSchemaJson])],
      ),
    ],
  )

const backstage = (model: Model, h: H): Html => {
  const specimen = specimens[model.specimen]
  return h.section(
    [h.Class('live-backstage'), h.AriaLabel('Backstage')],
    [
      title('Backstage', h),
      h.dl(
        [h.Class('provenance')],
        [
          h.dt([], ['Host']),
          h.dd([], [`${hostName} ${hostVersion}`]),
          h.dt([], ['Mode']),
          h.dd([], [specimen.mode]),
          h.dt([], ['Source']),
          h.dd(
            [],
            [
              specimen.source
                ? h.a(
                    [
                      h.Href(specimen.source),
                      h.Target('_blank'),
                      h.Rel('noreferrer'),
                    ],
                    [specimen.version],
                  )
                : specimen.version,
            ],
          ),
          ...Option.match(model.session, {
            onNone: () => [],
            onSome: session => [
              h.dt([], ['Observed server']),
              h.dd([], [`${session.server} · ${session.version}`]),
              h.dt([], ['Protocol']),
              h.dd([], [session.protocol]),
            ],
          }),
        ],
      ),
      Option.match(selectedTool(model), {
        onNone: () => h.empty,
        onSome: tool => profileView(tool, h),
      }),
      Option.match(model.invocation, {
        onNone: () => h.empty,
        onSome: invocation =>
          h.details(
            [h.Class('live-detail')],
            [
              h.summary([], [`Last result · ${invocation.tool}`]),
              h.h3([], ['Arguments']),
              h.pre([], [invocation.argumentsJson]),
              h.h3([], ['Result']),
              h.pre([], [invocation.resultJson]),
            ],
          ),
      }),
      model.events.length
        ? h.div(
            [h.Class('wire-channel')],
            [
              h.h3(
                [],
                [
                  model.specimen === 'registry'
                    ? 'Host ↔ Registry'
                    : 'Host ↔ Specimen',
                ],
              ),
              model.dropped
                ? h.p([], [`${model.dropped} older events omitted.`])
                : h.empty,
              evidenceView(model.events, h),
            ],
          )
        : h.p(
            [h.Class('wire-empty')],
            ['Protocol and host events appear here as you use the bench.'],
          ),
      model.appEvents.length
        ? h.div(
            [h.Class('wire-channel')],
            [h.h3([], ['App ↔ Host']), evidenceView(model.appEvents, h)],
          )
        : h.empty,
    ],
  )
}

export const view = (model: Model, h: H): Document => ({
  title: 'Live workbench · MCP Lab',
  body: h.div(
    [h.Class('live-page')],
    [
      h.header(
        [h.Class('titlebar live-nav')],
        [
          h.a(
            [h.Href('/'), h.Class('live-brand')],
            [h.span([h.Class('brandmark'), h.AriaHidden(true)]), 'MCP Lab'],
          ),
          h.nav(
            [h.AriaLabel('Lab views')],
            [
              h.a([h.Href('/')], ['Atlas']),
              h.a([h.Href('/lab/concept.html')], ['Simulated prototype']),
            ],
          ),
        ],
      ),
      h.main(
        [h.Class('live-main')],
        [
          h.div(
            [h.Class('live-intro')],
            [
              h.h1([], ['Live workbench']),
              h.p([], ['Open a specimen and follow what crossed the wire.']),
            ],
          ),
          h.div(
            [h.Class('live-bench')],
            [inventory(model, h), onstage(model, h), backstage(model, h)],
          ),
        ],
      ),
    ],
  ),
})
