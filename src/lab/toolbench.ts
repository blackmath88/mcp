import { Array, Option, pipe } from 'effect'
import { type Html, type HtmlBuilder } from 'foldkit/html'

import {
  type Capability,
  families,
  inputJsonSchema,
} from '../domain/capabilities.ts'
import { characterNote } from '../domain/foreign.ts'
import {
  type ListedTool,
  listedFromCatalogue,
  profile,
} from '../domain/lens.ts'
import { approvalRules, claimsReadOnly } from './approval.ts'
import { evidenceView } from './atlas.ts'
import { beltOf, calledToolOf, findCapability } from './belt.ts'
import { iconView } from './icons.ts'
import { mcpMapView, serverMap } from './mcpmap.ts'
import { Message } from './message.ts'
import { type Model, RunState } from './model.ts'
import { serverNames } from './names.ts'
import { inputFor } from './update.ts'

type H = HtmlBuilder<Message>

// A server is a toolbench: the instruments it hands you on the front edge,
// what they work on in the middle, what comes back in the tray, and what
// stays changed. Instruments come from the tool list. The work area is drawn
// from the lab's own source; for a server the lab did not write it would stay
// an empty outline.

// Authored: tools whose one call runs a whole process of its own.
const workshops: ReadonlySet<string> = new Set([
  'connect_places',
  'plan_steps',
  'run_as_program',
  'deliver_plan',
  'refine_plan',
  'crash_and_resume',
  'call_tool',
])

const isRunning = (model: Model): boolean =>
  RunState.isAnyOf(['Running'])(model.run)

const activeName = (model: Model): Option.Option<string> =>
  RunState.match(model.run, {
    Idle: () => Option.none(),
    Running: ({ capability }) => Option.some(capability),
    Succeeded: ({ record }) => Option.some(record.capability),
    Failed: ({ record }) => Option.some(record.capability),
    Cancelled: ({ capability }) => Option.some(capability),
  })

const callsOf = (model: Model, name: string): number =>
  model.frames.filter(frame =>
    Option.exists(calledToolOf(frame), capability => capability.name === name),
  ).length

const listedFor = (model: Model, capability: Capability): ListedTool =>
  pipe(
    model.tools,
    Array.findFirst(tool => tool.name === capability.name),
    Option.match({
      onNone: () => listedFromCatalogue(capability),
      onSome: tool => tool,
    }),
  )

const rawFor = (
  model: Model,
  capability: Capability,
): Readonly<{ json: string; isObserved: boolean }> =>
  pipe(
    model.tools,
    Array.findFirst(tool => tool.name === capability.name && tool.json !== ''),
    Option.match({
      onNone: () => ({
        json: JSON.stringify(
          {
            name: capability.name,
            title: capability.title,
            description: capability.description,
            inputSchema: inputJsonSchema(capability),
            annotations: { readOnlyHint: claimsReadOnly(capability.name) },
          },
          null,
          2,
        ),
        isObserved: false,
      }),
      onSome: tool => ({ json: tool.json, isObserved: true }),
    }),
  )

// PARTS

const stepLabel = (n: string, title: string, note: string, h: H): Html =>
  h.div(
    [h.Class('tb-label')],
    [
      h.span([h.Class('tb-n'), h.AriaHidden(true)], [n]),
      h.b([], [title]),
      h.span([h.Class('tb-note')], [note]),
    ],
  )

const hostView = (model: Model, h: H): Html => {
  const rule = approvalRules.find(entry => entry.id === model.approval)
  return h.details(
    [h.Class('pop right host-pop')],
    [
      h.summary(
        [h.Class('pop-btn')],
        [h.span([h.Class('muted')], ['Host: ']), rule?.label ?? ''],
      ),
      h.div(
        [h.Class('pop-panel')],
        [
          h.p(
            [],
            [
              h.b([], ['Does the AI app ask you before a call? ']),
              'MCP leaves this to the app. Pick its rule:',
            ],
          ),
          h.div(
            [h.Class('seg'), h.Role('group'), h.AriaLabel('Approval rule')],
            Array.map(approvalRules, entry =>
              h.button(
                [
                  h.Type('button'),
                  h.AriaPressed(model.approval === entry.id ? 'true' : 'false'),
                  h.OnClick(Message.SelectedApprovalRule({ rule: entry.id })),
                ],
                [entry.label],
              ),
            ),
          ),
          h.p([h.Class('tb-note')], [rule?.means ?? '']),
        ],
      ),
    ],
  )
}

const mapRowView = (model: Model, story: Html, h: H): Html => {
  const belt = beltOf(model)
  return h.div(
    [h.Class('tb-maprow')],
    [
      story,
      h.div(
        [h.Class('tb-mapcol')],
        [
          stepLabel(
            '1',
            `What the ${serverNames[model.station]} hands the AI`,
            belt.source === 'server'
              ? 'its tools/list answer, drawn as a workshop · click a slot or a tool to look behind it'
              : 'the lab’s catalogue, drawn as a workshop · click a slot or a tool to look behind it',
            h,
          ),
          mcpMapView(serverMap(model), h),
        ],
      ),
    ],
  )
}

const pendingView = (model: Model, h: H): Html =>
  Option.match(model.pending, {
    onNone: () =>
      model.declined === ''
        ? h.empty
        : h.div(
            [h.Class('tb-ask declined'), h.AriaLive('polite')],
            [
              h.b([], [`You declined ${model.declined}.`]),
              h.p(
                [],
                [
                  'Nothing reached the server and nothing changed. A real host would tell the model it was declined.',
                ],
              ),
            ],
          ),
    onSome: pending =>
      h.div(
        [
          h.Class('tb-ask'),
          h.Role('alertdialog'),
          h.AriaLabel('The host asks'),
        ],
        [
          h.b([], ['The host asks you']),
          pending.kind === 'program'
            ? h.p(
                [],
                [
                  'Run this Python program? You approve it once; every ledger.write inside it then runs without asking again.',
                ],
              )
            : h.p(
                [],
                [
                  h.code([], [`${pending.name}(${pending.inputJson})`]),
                  claimsReadOnly(pending.name)
                    ? ' The server says it is read-only.'
                    : ' The server does not say it is read-only.',
                ],
              ),
          h.div(
            [h.Class('ctl')],
            [
              h.button(
                [
                  h.Type('button'),
                  h.Class('btn'),
                  h.OnClick(Message.ClickedApprove()),
                ],
                ['Allow'],
              ),
              h.button(
                [
                  h.Type('button'),
                  h.Class('btn ghost'),
                  h.OnClick(Message.ClickedDeny()),
                ],
                ['Deny'],
              ),
            ],
          ),
        ],
      ),
  })

const drawerView = (model: Model, h: H): Html =>
  pipe(
    model.maybeSelected,
    Option.flatMap(findCapability),
    Option.filter(capability => capability.specimen === model.station),
    Option.match({
      onNone: () => h.empty,
      onSome: capability => {
        const family = families.find(entry => entry.id === capability.family)
        const raw = rawFor(model, capability)
        const listed = listedFor(model, capability)
        const claims = profile([listed]).tools[0]?.claims ?? []
        const args = JSON.stringify(inputFor(capability.name, model))
        return h.section(
          [h.Class('tb-drawer'), h.AriaLabel(`About ${capability.name}`)],
          [
            h.div(
              [h.Class('tb-drawer-head')],
              [
                h.span([h.Class('bigicon')], [iconView(capability.name, h)]),
                h.div(
                  [],
                  [
                    h.h3([], [capability.title]),
                    h.p(
                      [h.Class('tb-plain')],
                      [
                        capability.description,
                        family === undefined
                          ? ''
                          : ` In this lab’s words: it ${family.means}.`,
                        workshops.has(capability.name)
                          ? ' One call to it runs a whole process of its own.'
                          : '',
                      ],
                    ),
                  ],
                ),
                h.button(
                  [
                    h.Type('button'),
                    h.Class('btn'),
                    h.Disabled(isRunning(model)),
                    h.OnClick(Message.ClickedRun({ name: capability.name })),
                  ],
                  ['Use it'],
                ),
              ],
            ),
            h.details(
              [h.Class('fold tb-nerd')],
              [
                h.summary(
                  [],
                  [
                    'Under the hood: what the model receives, what gets sent, what Lens reads',
                  ],
                ),
                h.div(
                  [h.Class('tb-nerd-grid')],
                  [
                    h.div(
                      [],
                      [
                        h.h4(
                          [],
                          [
                            raw.isObserved
                              ? 'The tools/list entry, as received'
                              : 'The entry, from the lab’s catalogue',
                          ],
                        ),
                        h.pre([h.Class('page')], [raw.json]),
                        h.p(
                          [h.Class('side-note')],
                          [characterNote(listed.description)],
                        ),
                      ],
                    ),
                    h.div(
                      [],
                      [
                        h.h4([], ['“Use it” would send']),
                        h.pre(
                          [h.Class('page')],
                          [
                            JSON.stringify(
                              {
                                jsonrpc: '2.0',
                                method: 'tools/call',
                                params: {
                                  name: capability.name,
                                  arguments: JSON.parse(args),
                                },
                              },
                              null,
                              2,
                            ),
                          ],
                        ),
                        h.h4([], ['Lens reads from the entry']),
                        h.ul(
                          [h.Class('claims')],
                          Array.map(claims, claim =>
                            h.keyed('li')(
                              claim.rule,
                              [
                                h.Class(
                                  `claim ${claim.isWarning ? 'warn' : ''}`,
                                ),
                              ],
                              [
                                h.span([h.Class('rule')], [claim.rule]),
                                h.span(
                                  [h.Class('claim-text')],
                                  [claim.statement],
                                ),
                                h.span(
                                  [h.Class('basis')],
                                  [
                                    `${claim.basis === 'declared' ? 'declared' : 'inferred'} · ${claim.evidence}`,
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                        h.h4([], ['What is known about it']),
                        evidenceView(model, capability, h),
                        h.button(
                          [
                            h.Type('button'),
                            h.Class('btn ghost small'),
                            h.OnClick(Message.ClickedShowOnAtlas()),
                          ],
                          ['Show it on the atlas'],
                        ),
                        h.p(
                          [h.Class('side-note')],
                          [
                            `Called ${callsOf(model, capability.name)} time(s) in this tab. The other hints (destructiveHint, idempotentHint, openWorldHint) are not sent; the spec then reads them as true, false and true.`,
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ],
        )
      },
    }),
  )

// THE BENCH

export type BenchParts = Readonly<{
  story: Html
  controls: Html
  material: ReadonlyArray<Html>
  result: Html
  happened: Html
  stays: Html
}>

export const toolbenchView = (model: Model, parts: BenchParts, h: H): Html =>
  h.section(
    [h.Class('toolbench'), h.AriaLabel('Toolbench')],
    [
      mapRowView(model, parts.story, h),
      h.div([h.Class('tb-controls')], [parts.controls, hostView(model, h)]),
      drawerView(model, h),
      h.div(
        [h.Class('tb-main')],
        [
          h.div(
            [
              h.Class(
                `tb-material ${Option.isSome(activeName(model)) ? 'touched' : ''} ${isRunning(model) ? 'working' : ''}`,
              ),
            ],
            [
              stepLabel(
                '2',
                'What they work on',
                Option.match(activeName(model), {
                  onNone: () =>
                    'drawn from the lab’s own source; a tool list alone would not show this',
                  onSome: name =>
                    isRunning(model)
                      ? `${name} is working on this now`
                      : `${name} worked on this · drawn from the lab’s own source`,
                }),
                h,
              ),
              ...parts.material,
            ],
          ),
          h.aside(
            [h.Class('tb-tray'), h.AriaLabel('What comes back')],
            [
              stepLabel('3', 'Comes back', 'the result of the last call', h),
              pendingView(model, h),
              parts.result,
              parts.happened,
              stepLabel('4', 'Stays changed', 'after the call is over', h),
              parts.stays,
            ],
          ),
        ],
      ),
    ],
  )
