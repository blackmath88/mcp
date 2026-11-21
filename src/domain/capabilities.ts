import { Effect, Result, Schema } from 'effect'

import {
  CliGenerated,
  CratesShipped,
  callGenerated,
  callLive,
  generateCli,
} from './cli-snapshot.ts'
import {
  MapRead,
  PathBuilt,
  PlacesConnected,
  RouteFound,
  buildPath,
  connectPlaces,
  findRoute,
  readMap,
} from './engine.ts'
import {
  type DomainError,
  InvalidInput,
  UnknownCapability,
  describeError,
} from './errors.ts'
import { PageFetched, fetchPage, siteUrls } from './fetch.ts'
import { FileRead, filePaths, readFile } from './files.ts'
import {
  WentTo,
  WhereAmI,
  clients,
  gatewayPlaces,
  goTo,
  whereAmI,
} from './gateway.ts'
import {
  BatchDone,
  EntryWritten,
  ExpertReplied,
  InventoryListed,
  LoopFinished,
  LoopResumed,
  MapShown,
  SELF,
  ServerProfiled,
  ToolCalled,
  ViewReported,
  askExpert,
  callTool,
  crashAndResume,
  deliverPlan,
  getCurrentView,
  listInventory,
  profileServer,
  refinePlan,
  reviewPlan,
  runAsCalls,
  runAsProgram,
  showMap,
  writeLoad,
} from './later.ts'
import {
  Recalled,
  Remembered,
  entities,
  observations,
  recall,
  remember,
} from './memory.ts'
import {
  Clicked,
  SnapshotTaken,
  click,
  controlIds,
  takeSnapshot,
} from './perception.ts'
import {
  type ComponentId,
  EngineEvent,
  Pace,
  Trace,
  WorldStore,
} from './services.ts'
import { PlanMade, planSteps } from './thinking.ts'
import { PlaceId, type World, placeIds } from './world.ts'

// CATALOGUE

export const CapabilityName = Schema.Literals([
  'read_map',
  'find_route',
  'build_path',
  'connect_places',
  'fetch_page',
  'remember',
  'recall',
  'plan_steps',
  'read_file',
  'take_snapshot',
  'click',
  'generate_cli',
  'call_live',
  'call_generated',
  'go_to',
  'where_am_i',
  'show_map',
  'get_current_view',
  'run_as_calls',
  'run_as_program',
  'ask_expert',
  'review_plan',
  'deliver_plan',
  'refine_plan',
  'crash_and_resume',
  'list_inventory',
  'profile_server',
  'profile_self',
  'call_tool',
  'write_entry',
])
export type CapabilityName = typeof CapabilityName.Type

export type Affordance = 'readable' | 'queryable' | 'operable' | 'program'

// Teaching groups chosen by this lab. They are not categories of the MCP
// protocol, which only knows tools, resources and prompts.
export type Family =
  | 'read'
  | 'query'
  | 'perceive'
  | 'remember'
  | 'change'
  | 'app'
  | 'compose'
  | 'delegate'
  | 'workflow'
  | 'gateway'

export const families: ReadonlyArray<
  Readonly<{ id: Family; name: string; means: string }>
> = [
  {
    id: 'read',
    name: 'Read',
    means: 'hands back something that already exists',
  },
  { id: 'query', name: 'Query', means: 'answers a question you put to it' },
  {
    id: 'perceive',
    name: 'Perceive',
    means: 'changes what can be seen at all',
  },
  {
    id: 'remember',
    name: 'Remember',
    means: 'keeps something beyond this call',
  },
  { id: 'change', name: 'Change', means: 'alters state somewhere' },
  {
    id: 'app',
    name: 'Interactive app',
    means: 'returns an interface a person then uses',
  },
  {
    id: 'compose',
    name: 'Compose',
    means: 'decides its own steps and runs them',
  },
  {
    id: 'delegate',
    name: 'Delegate',
    means: 'passes the work to another intelligence',
  },
  {
    id: 'workflow',
    name: 'Workflow',
    means: 'keeps going across steps and failures',
  },
  { id: 'gateway', name: 'Gateway', means: 'stands in front of other servers' },
]

export type Specimen =
  | 'valley'
  | 'fetch'
  | 'memory'
  | 'thinking'
  | 'filesystem'
  | 'perception'
  | 'cli'
  | 'local-remote'
  | 'apps'
  | 'code-mode'
  | 'delegation'
  | 'iteration'
  | 'network'
  | 'inspector'

export type Capability = Readonly<{
  name: CapabilityName
  specimen: Specimen
  title: string
  affordance: Affordance
  family: Family
  description: string
  input:
    | 'none'
    | 'endpoints'
    | 'url'
    | 'fact'
    | 'entity'
    | 'thoughts'
    | 'path'
    | 'target'
    | 'client-place'
    | 'client'
    | 'place'
    | 'tool-name'
    | 'load'
  observe: string
  request: string
  produces: string
  changes: string
  finishes: string
  dependsOn: ReadonlyArray<ComponentId>
}>

export const catalogue: ReadonlyArray<Capability> = [
  {
    name: 'read_map',
    family: 'read',
    title: 'Map',
    affordance: 'readable',
    description:
      'Read the map of the valley: every place, every path and the span limit.',
    specimen: 'valley',
    input: 'none',
    observe: 'Places, paths, the current revision and the span limit.',
    request: 'Nothing. It takes no input.',
    produces: 'A snapshot of the map.',
    changes: 'Nothing.',
    finishes: 'Immediately.',
    dependsOn: ['map', 'world-store'],
  },
  {
    name: 'find_route',
    family: 'query',
    title: 'Route finder',
    affordance: 'queryable',
    description:
      'Find the shortest route between two places along existing paths.',
    specimen: 'valley',
    input: 'endpoints',
    observe: 'Whether two places are connected, and how far apart.',
    request: 'A start and an end place.',
    produces: 'A route, or the answer that none exists.',
    changes: 'Nothing.',
    finishes: 'Immediately.',
    dependsOn: ['map', 'world-store'],
  },
  {
    name: 'build_path',
    family: 'change',
    title: 'Path builder',
    affordance: 'operable',
    description:
      'Build one new path between two places. Refused when the span exceeds the limit or the path exists.',
    specimen: 'valley',
    input: 'endpoints',
    observe: 'Nothing beyond the result.',
    request: 'The two places to join directly.',
    produces: 'A path artifact.',
    changes: 'The map gains a path and its revision goes up by one.',
    finishes: 'Immediately, or not at all.',
    dependsOn: ['map', 'validator', 'world-store', 'artifact-store'],
  },
  {
    name: 'connect_places',
    family: 'compose',
    title: 'Connection workshop',
    affordance: 'program',
    description:
      'Connect two places by any means: inspect the map, plan the shortest missing link, validate it, build it and report.',
    specimen: 'valley',
    input: 'endpoints',
    observe: 'The map, through its own inspection.',
    request: 'A goal: two places that should be connected.',
    produces: 'A connection report, and a path artifact if it built one.',
    changes: 'It may build a path. It decides which one.',
    finishes: 'After four stages, or stops at the first that fails.',
    dependsOn: ['planner', 'map', 'validator', 'world-store', 'artifact-store'],
  },
  {
    name: 'fetch_page',
    family: 'read',
    specimen: 'fetch',
    title: 'Page fetcher',
    affordance: 'queryable',
    description:
      'Fetch a page of the synthetic site valley.test and return it as Markdown. Follows redirects.',
    input: 'url',
    observe: 'A page of valley.test, as Markdown.',
    request: 'One URL.',
    produces: 'Text. Nothing is stored.',
    changes: 'Nothing in the valley. It does make requests in your name.',
    finishes: 'After at most three redirects.',
    dependsOn: ['fetcher', 'robots-policy', 'synthetic-web'],
  },
  {
    name: 'remember',
    family: 'remember',
    specimen: 'memory',
    title: 'Remember',
    affordance: 'operable',
    description:
      'Store one observation about an entity in the knowledge graph.',
    input: 'fact',
    observe: 'Nothing beyond a confirmation.',
    request: 'An entity and one statement about it.',
    produces: 'A line in a file.',
    changes: 'The file at the configured storage path grows by one line.',
    finishes: 'Immediately.',
    dependsOn: ['memory-graph', 'disk'],
  },
  {
    name: 'recall',
    family: 'remember',
    specimen: 'memory',
    title: 'Recall',
    affordance: 'queryable',
    description: 'Return everything stored about an entity.',
    input: 'entity',
    observe: 'Every stored statement about one entity, in storage order.',
    request: 'An entity name.',
    produces: 'A list. It may be empty or contradict itself.',
    changes: 'Nothing.',
    finishes: 'Immediately.',
    dependsOn: ['memory-graph', 'disk'],
  },
  {
    name: 'plan_steps',
    family: 'compose',
    specimen: 'thinking',
    title: 'Step planner',
    affordance: 'program',
    description: 'Think step by step about a goal and return an ordered plan.',
    input: 'thoughts',
    observe: 'A numbered plan.',
    request: 'A goal, and optionally your own thoughts so far.',
    produces: 'Steps. Who wrote them depends on the build.',
    changes: 'Nothing.',
    finishes: 'Immediately.',
    dependsOn: ['thinking-tool', 'map', 'expert-model'],
  },
  {
    name: 'read_file',
    family: 'read',
    specimen: 'filesystem',
    title: 'File reader',
    affordance: 'readable',
    description: 'Read a text file inside the allowed directories.',
    input: 'path',
    observe: 'The content of one file, if its path is allowed right now.',
    request: 'A path.',
    produces: 'Text.',
    changes: 'Nothing.',
    finishes: 'Immediately.',
    dependsOn: ['file-server', 'boundary', 'synthetic-files'],
  },
  {
    name: 'take_snapshot',
    family: 'perceive',
    specimen: 'perception',
    title: 'Page snapshot',
    affordance: 'readable',
    description:
      'Capture the accessibility snapshot of the page: every control that has a role and a name.',
    input: 'none',
    observe:
      'The controls the accessibility tree exposes, each with a reference.',
    request: 'Nothing.',
    produces: 'A list of references, valid until the page changes.',
    changes: 'Nothing on the page.',
    finishes: 'Immediately.',
    dependsOn: ['browser-tool', 'accessibility-tree'],
  },
  {
    name: 'click',
    family: 'change',
    specimen: 'perception',
    title: 'Click',
    affordance: 'operable',
    description: 'Click one control on the page.',
    input: 'target',
    observe: 'Nothing beyond a confirmation.',
    request: 'Which control to click.',
    produces: 'A confirmation of how it clicked.',
    changes: 'The page. Every click re-renders it.',
    finishes: 'Immediately, or not at all.',
    dependsOn: ['browser-tool', 'accessibility-tree', 'synthetic-page'],
  },
  {
    name: 'generate_cli',
    family: 'compose',
    specimen: 'cli',
    title: 'CLI generator',
    affordance: 'operable',
    description:
      'Generate a standalone CLI from the server’s current tool schema.',
    input: 'none',
    observe: 'The server’s tool list, once.',
    request: 'Nothing.',
    produces: 'A CLI artifact with the schema embedded.',
    changes: 'Replaces the previous artifact.',
    finishes: 'Immediately.',
    dependsOn: ['cli-generator', 'crate-server'],
  },
  {
    name: 'call_live',
    family: 'change',
    specimen: 'cli',
    title: 'Live call',
    affordance: 'operable',
    description:
      'Ship crates by listing the server’s tools first, then calling.',
    input: 'none',
    observe: 'The current schema, every time.',
    request: 'Three crates to the dock.',
    produces: 'A shipment.',
    changes: 'Crates leave.',
    finishes: 'After two round trips.',
    dependsOn: ['live-client', 'crate-server'],
  },
  {
    name: 'call_generated',
    family: 'change',
    specimen: 'cli',
    title: 'Generated CLI',
    affordance: 'operable',
    description:
      'Ship crates through the generated CLI and its embedded schema.',
    input: 'none',
    observe: 'Nothing new. It trusts what it embedded.',
    request: 'Three crates to the dock.',
    produces: 'A shipment, if the embedded schema still matches.',
    changes: 'Crates leave.',
    finishes: 'After one round trip.',
    dependsOn: ['generated-cli', 'crate-server'],
  },
  {
    name: 'go_to',
    family: 'change',
    specimen: 'local-remote',
    title: 'Go to',
    affordance: 'operable',
    description:
      'Tell the server to move to a place. It remembers one current place.',
    input: 'client-place',
    observe: 'Nothing beyond a confirmation.',
    request: 'Which client is asking, and a place.',
    produces: 'A confirmation naming the process that served it.',
    changes: 'The serving process’s single "current place".',
    finishes: 'Immediately.',
    dependsOn: ['gateway', 'child-process'],
  },
  {
    name: 'where_am_i',
    family: 'query',
    specimen: 'local-remote',
    title: 'Where am I',
    affordance: 'queryable',
    description: 'Ask the server for its current place.',
    input: 'client',
    observe: 'The current place held by whichever process serves you.',
    request: 'Which client is asking.',
    produces: 'A place, or nothing yet.',
    changes: 'Nothing, unless a new process has to be spawned for you.',
    finishes: 'Immediately.',
    dependsOn: ['gateway', 'child-process'],
  },
  {
    name: 'show_map',
    family: 'app',
    specimen: 'apps',
    title: 'Show map',
    affordance: 'program',
    description:
      'Open an interactive map centred on a place. The person can move it afterwards.',
    input: 'place',
    observe: 'A map you can move.',
    request: 'A place to centre on.',
    produces: 'An application, plus a result saying where it opened.',
    changes: 'What is on screen.',
    finishes: 'When the app opens. The app keeps running.',
    dependsOn: ['map-app', 'app-view'],
  },
  {
    name: 'get_current_view',
    family: 'query',
    specimen: 'apps',
    title: 'Current view',
    affordance: 'queryable',
    description: 'Ask the open map app where it is looking right now.',
    input: 'none',
    observe: 'The live camera position of the app.',
    request: 'Nothing.',
    produces: 'The place currently in view.',
    changes: 'What the model has been told.',
    finishes: 'Immediately.',
    dependsOn: ['map-app', 'app-view'],
  },
  {
    name: 'run_as_calls',
    family: 'change',
    specimen: 'code-mode',
    title: 'Three calls',
    affordance: 'operable',
    description: 'Write three ledger entries as three separate tool calls.',
    input: 'none',
    observe: 'A result after every call.',
    request: 'Nothing; the three loads are fixed.',
    produces: 'Three results.',
    changes: 'Up to three ledger entries.',
    finishes: 'After three round trips, or at the first failure.',
    dependsOn: ['ledger'],
  },
  {
    name: 'run_as_program',
    family: 'compose',
    specimen: 'code-mode',
    title: 'One program',
    affordance: 'program',
    description:
      'Write three ledger entries by executing one small program in a sandbox.',
    input: 'none',
    observe: 'One result for the whole program.',
    request: 'A program. Here it is fixed.',
    produces: 'One result.',
    changes: 'Up to three ledger entries.',
    finishes: 'After one round trip.',
    dependsOn: ['sandbox', 'ledger'],
  },
  {
    name: 'ask_expert',
    family: 'delegate',
    specimen: 'delegation',
    title: 'Ask',
    affordance: 'queryable',
    description: 'Ask the expert whether the Forge and the Dock are connected.',
    input: 'none',
    observe: 'An answer.',
    request: 'A question.',
    produces: 'Advice. You decide what to do with it.',
    changes: 'Nothing.',
    finishes: 'Immediately.',
    dependsOn: ['expert-tool', 'expert-model'],
  },
  {
    name: 'review_plan',
    family: 'delegate',
    specimen: 'delegation',
    title: 'Review',
    affordance: 'queryable',
    description: 'Ask the expert to review the plan "go through the Archive".',
    input: 'none',
    observe: 'A verdict with a reason.',
    request: 'An artifact and criteria.',
    produces: 'An assessment. Nothing is changed.',
    changes: 'Nothing.',
    finishes: 'Immediately.',
    dependsOn: ['expert-tool', 'expert-model'],
  },
  {
    name: 'deliver_plan',
    family: 'delegate',
    specimen: 'delegation',
    title: 'Deliver',
    affordance: 'program',
    description:
      'Have the expert produce and store a route plan from the Forge to the Dock.',
    input: 'none',
    observe: 'The stored artifact.',
    request: 'A bounded job.',
    produces: 'An artifact and its evidence.',
    changes: 'A new artifact. The expert owned the result.',
    finishes: 'When the artifact is stored.',
    dependsOn: ['expert-tool', 'expert-model', 'artifact-store'],
  },
  {
    name: 'refine_plan',
    family: 'workflow',
    specimen: 'iteration',
    title: 'Refine',
    affordance: 'program',
    description:
      'Write a draft, have it rated, and refine it until it is good enough or the limit is reached.',
    input: 'none',
    observe: 'The returned draft and every rating.',
    request: 'Nothing; the task is fixed.',
    produces: 'One draft, chosen by rating.',
    changes: 'Nothing outside the loop.',
    finishes: 'At the minimum rating, or after three refinements.',
    dependsOn: ['workflow-engine', 'generator', 'evaluator'],
  },
  {
    name: 'crash_and_resume',
    family: 'workflow',
    specimen: 'iteration',
    title: 'Crash and resume',
    affordance: 'program',
    description: 'Run the same loop, crash after two drafts, and continue.',
    input: 'none',
    observe: 'What had to be done again.',
    request: 'Nothing.',
    produces: 'A report of what was redone.',
    changes: 'Nothing outside the loop.',
    finishes: 'After the restart.',
    dependsOn: ['workflow-engine', 'generator'],
  },
  {
    name: 'list_inventory',
    family: 'gateway',
    specimen: 'network',
    title: 'Inventory',
    affordance: 'readable',
    description:
      'List the tools offered through the one entrance in front of two backends.',
    input: 'none',
    observe: 'Tool names and which backend each belongs to.',
    request: 'Nothing.',
    produces: 'A merged list.',
    changes: 'Nothing.',
    finishes: 'Immediately.',
    dependsOn: ['federation'],
  },
  {
    name: 'call_tool',
    family: 'gateway',
    specimen: 'network',
    title: 'Call',
    affordance: 'operable',
    description: 'Call one tool from the merged inventory.',
    input: 'tool-name',
    observe: 'Whichever backend answers.',
    request: 'A tool name from the inventory.',
    produces: 'That backend’s answer.',
    changes: 'Nothing.',
    finishes: 'Immediately, or not at all.',
    dependsOn: ['federation', 'forge-backend', 'dock-backend'],
  },
  {
    name: 'profile_server',
    family: 'perceive',
    specimen: 'inspector',
    title: 'Profile a server',
    affordance: 'queryable',
    description:
      'Read another server’s tool listing and report what each tool appears to be allowed to do, with the field each claim rests on.',
    input: 'tool-name',
    observe: 'Claims about another server, each with its rule and evidence.',
    request: 'The name of a server in this lab.',
    produces:
      'A profile, and which definitions changed since they were pinned.',
    changes: 'Nothing.',
    finishes: 'Immediately.',
    dependsOn: ['lens', 'inspected-server'],
  },
  {
    name: 'profile_self',
    family: 'perceive',
    specimen: 'inspector',
    title: 'Profile itself',
    affordance: 'queryable',
    description:
      'Read this inspector’s own tool listing once and report on it. One snapshot; it does not profile its own profile.',
    input: 'none',
    observe: 'What the inspector can and cannot say about itself.',
    request: 'Nothing.',
    produces: 'A profile of two tools, and one thing it cannot establish.',
    changes: 'Nothing.',
    finishes: 'After one snapshot.',
    dependsOn: ['lens'],
  },
  {
    name: 'write_entry',
    family: 'change',
    specimen: 'code-mode',
    title: 'Write one entry',
    affordance: 'operable',
    description: 'Append one load to the ledger.',
    input: 'load',
    observe: 'Nothing beyond a confirmation.',
    request: 'The name of one load.',
    produces: 'A confirmation with the new length.',
    changes: 'The ledger gains one entry. There is no undo.',
    finishes: 'Immediately, or not at all.',
    dependsOn: ['ledger'],
  },
]

export const Endpoints = Schema.Struct({ from: PlaceId, to: PlaceId })
export type Endpoints = typeof Endpoints.Type

const emptyInputJsonSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
} as const

const endpointsJsonSchema = {
  type: 'object',
  properties: {
    from: { type: 'string', enum: placeIds },
    to: { type: 'string', enum: placeIds },
  },
  required: ['from', 'to'],
  additionalProperties: false,
} as const

const urlJsonSchema = {
  type: 'object',
  properties: { url: { type: 'string', enum: siteUrls } },
  required: ['url'],
  additionalProperties: false,
} as const

const factJsonSchema = {
  type: 'object',
  properties: {
    entity: { type: 'string', enum: entities },
    observation: { type: 'string', enum: observations },
  },
  required: ['entity', 'observation'],
  additionalProperties: false,
} as const

const entityJsonSchema = {
  type: 'object',
  properties: { entity: { type: 'string', enum: entities } },
  required: ['entity'],
  additionalProperties: false,
} as const

const thoughtsJsonSchema = {
  type: 'object',
  properties: {
    from: { type: 'string', enum: placeIds },
    to: { type: 'string', enum: placeIds },
    thoughts: { type: 'array', items: { type: 'string' } },
  },
  required: ['from', 'to'],
  additionalProperties: false,
} as const

const pathJsonSchema = {
  type: 'object',
  properties: { path: { type: 'string', enum: filePaths } },
  required: ['path'],
  additionalProperties: false,
} as const

const targetJsonSchema = {
  type: 'object',
  properties: { target: { type: 'string', enum: controlIds } },
  required: ['target'],
  additionalProperties: false,
} as const

const clientJsonSchema = {
  type: 'object',
  properties: { client: { type: 'string', enum: clients } },
  required: ['client'],
  additionalProperties: false,
} as const

const clientPlaceJsonSchema = {
  type: 'object',
  properties: {
    client: { type: 'string', enum: clients },
    place: { type: 'string', enum: gatewayPlaces },
  },
  required: ['client', 'place'],
  additionalProperties: false,
} as const

const placeJsonSchema = {
  type: 'object',
  properties: { place: { type: 'string', enum: gatewayPlaces } },
  required: ['place'],
  additionalProperties: false,
} as const

const toolNameJsonSchema = {
  type: 'object',
  properties: { name: { type: 'string' } },
  required: ['name'],
  additionalProperties: false,
} as const

const loadJsonSchema = {
  type: 'object',
  properties: { load: { type: 'string' } },
  required: ['load'],
  additionalProperties: false,
} as const

export const inputJsonSchema = (capability: Capability) =>
  capability.input === 'load'
    ? loadJsonSchema
    : capability.input === 'place'
      ? placeJsonSchema
      : capability.input === 'tool-name'
        ? toolNameJsonSchema
        : capability.input === 'client'
          ? clientJsonSchema
          : capability.input === 'client-place'
            ? clientPlaceJsonSchema
            : capability.input === 'path'
              ? pathJsonSchema
              : capability.input === 'target'
                ? targetJsonSchema
                : capability.input === 'fact'
                  ? factJsonSchema
                  : capability.input === 'entity'
                    ? entityJsonSchema
                    : capability.input === 'thoughts'
                      ? thoughtsJsonSchema
                      : capability.input === 'endpoints'
                        ? endpointsJsonSchema
                        : capability.input === 'url'
                          ? urlJsonSchema
                          : emptyInputJsonSchema

// EXECUTION

export const CapabilityOutput = Schema.Union([
  MapRead,
  RouteFound,
  PathBuilt,
  PlacesConnected,
  PageFetched,
  Remembered,
  Recalled,
  PlanMade,
  FileRead,
  SnapshotTaken,
  Clicked,
  CliGenerated,
  CratesShipped,
  WentTo,
  WhereAmI,
  MapShown,
  ViewReported,
  BatchDone,
  ExpertReplied,
  LoopFinished,
  LoopResumed,
  InventoryListed,
  ServerProfiled,
  ToolCalled,
  EntryWritten,
])
export type CapabilityOutput = typeof CapabilityOutput.Type

const decodeName = (name: string) =>
  Schema.decodeUnknownEffect(CapabilityName)(name).pipe(
    Effect.mapError(() => new UnknownCapability({ name })),
  )

const decodeEndpoints = (input: unknown) =>
  Schema.decodeUnknownEffect(Endpoints)(input).pipe(
    Effect.mapError(
      () =>
        new InvalidInput({
          message: `expected { from, to } naming two of: ${placeIds.join(', ')}`,
        }),
    ),
  )

const decodeUrl = (input: unknown) =>
  Schema.decodeUnknownEffect(Schema.Struct({ url: Schema.String }))(input).pipe(
    Effect.map(decoded => decoded.url),
    Effect.mapError(
      () => new InvalidInput({ message: 'expected { url } with a string' }),
    ),
  )

const invalid = (message: string) => () => new InvalidInput({ message })

const decodeFact = (input: unknown) =>
  Schema.decodeUnknownEffect(
    Schema.Struct({
      entity: Schema.Literals(entities),
      observation: Schema.Literals(observations),
    }),
  )(input).pipe(
    Effect.mapError(
      invalid('expected { entity, observation } from the lab’s fixed lists'),
    ),
  )

const decodeEntity = (input: unknown) =>
  Schema.decodeUnknownEffect(
    Schema.Struct({ entity: Schema.Literals(entities) }),
  )(input).pipe(
    Effect.map(decoded => decoded.entity),
    Effect.mapError(invalid('expected { entity } from the lab’s fixed list')),
  )

const decodeThoughts = (input: unknown) =>
  Schema.decodeUnknownEffect(
    Schema.Struct({ thoughts: Schema.optional(Schema.Array(Schema.String)) }),
  )(input).pipe(
    Effect.map(decoded => decoded.thoughts ?? []),
    Effect.mapError(invalid('thoughts must be a list of strings')),
  )

const decodeField =
  (field: 'path' | 'target' | 'name' | 'load') => (input: unknown) =>
    Schema.decodeUnknownEffect(Schema.Record(Schema.String, Schema.Unknown))(
      input,
    ).pipe(
      Effect.flatMap(decoded =>
        Schema.decodeUnknownEffect(Schema.String)(decoded[field]),
      ),
      Effect.mapError(invalid(`expected { ${field} } with a string`)),
    )

const decodeClient = (input: unknown) =>
  Schema.decodeUnknownEffect(
    Schema.Struct({ client: Schema.Literals(clients) }),
  )(input).pipe(
    Effect.map(decoded => decoded.client),
    Effect.mapError(invalid('expected { client } as A or B')),
  )

const decodePlace = (input: unknown) =>
  Schema.decodeUnknownEffect(
    Schema.Struct({ place: Schema.Literals(gatewayPlaces) }),
  )(input).pipe(
    Effect.map(decoded => decoded.place),
    Effect.mapError(invalid('expected { place } naming a place')),
  )

const resolve = Effect.fnUntraced(function* (name: string, input: unknown) {
  const trace = yield* Trace
  const step = {
    component: 'catalogue',
    calledBy: 'adapter',
    operation: `resolve ${name}`,
  } as const
  yield* trace.emit({ ...step, kind: 'started', detail: '' })
  const resolved = yield* Effect.gen(function* () {
    const capability = yield* decodeName(name)
    const needsEndpoints =
      capability === 'find_route' ||
      capability === 'build_path' ||
      capability === 'connect_places' ||
      capability === 'plan_steps'
    const endpoints = needsEndpoints
      ? yield* decodeEndpoints(input)
      : { from: 'forge' as const, to: 'forge' as const }
    const url = capability === 'fetch_page' ? yield* decodeUrl(input) : ''
    const fact =
      capability === 'remember'
        ? yield* decodeFact(input)
        : { entity: '', observation: '' }
    const entity = capability === 'recall' ? yield* decodeEntity(input) : ''
    const thoughts =
      capability === 'plan_steps' ? yield* decodeThoughts(input) : []
    const path =
      capability === 'read_file' ? yield* decodeField('path')(input) : ''
    const target =
      capability === 'click' ? yield* decodeField('target')(input) : ''
    const client =
      capability === 'go_to' || capability === 'where_am_i'
        ? yield* decodeClient(input)
        : 'A'
    const place =
      capability === 'go_to' || capability === 'show_map'
        ? yield* decodePlace(input)
        : 'forge'
    const toolName =
      capability === 'call_tool' || capability === 'profile_server'
        ? yield* decodeField('name')(input)
        : ''
    const load =
      capability === 'write_entry' ? yield* decodeField('load')(input) : ''
    return {
      capability,
      endpoints,
      url,
      fact,
      entity,
      thoughts,
      path,
      target,
      client,
      place,
      toolName,
      load,
    }
  }).pipe(
    Effect.tapError(error =>
      trace.emit({ ...step, kind: 'failed', detail: describeError(error) }),
    ),
  )
  yield* trace.emit({
    ...step,
    kind: 'succeeded',
    detail: 'input accepted',
  })
  return resolved
})

export const execute = Effect.fnUntraced(function* (
  name: string,
  input: unknown,
): Effect.fn.Return<CapabilityOutput, DomainError, Trace | WorldStore | Pace> {
  const {
    capability,
    endpoints,
    url,
    fact,
    entity,
    thoughts,
    path,
    target,
    client,
    place,
    toolName,
    load,
  } = yield* resolve(name, input)
  const { from, to } = endpoints
  const handlers = {
    read_map: () => readMap('catalogue'),
    find_route: () =>
      Effect.map(findRoute('catalogue', from, to), route =>
        RouteFound.make({ route }),
      ),
    build_path: () => buildPath('catalogue', from, to),
    connect_places: () => connectPlaces('catalogue', from, to),
    fetch_page: () => fetchPage('catalogue', url),
    remember: () => remember('catalogue', fact.entity, fact.observation),
    recall: () => recall('catalogue', entity),
    plan_steps: () => planSteps('catalogue', from, to, thoughts),
    read_file: () => readFile('catalogue', path),
    take_snapshot: () => takeSnapshot('catalogue'),
    click: () => click('catalogue', target),
    generate_cli: () => generateCli('catalogue'),
    call_live: () => callLive('catalogue'),
    call_generated: () => callGenerated('catalogue'),
    go_to: () => goTo('catalogue', client, place),
    where_am_i: () => whereAmI('catalogue', client),
    show_map: () => showMap('catalogue', place),
    get_current_view: () => getCurrentView('catalogue'),
    run_as_calls: () => runAsCalls('catalogue'),
    run_as_program: () => runAsProgram('catalogue'),
    ask_expert: () => askExpert('catalogue'),
    review_plan: () => reviewPlan('catalogue'),
    deliver_plan: () => deliverPlan('catalogue'),
    refine_plan: () => refinePlan('catalogue'),
    crash_and_resume: () => crashAndResume('catalogue'),
    list_inventory: () => listInventory('catalogue'),
    profile_server: () => profileServer('catalogue', toolName),
    profile_self: () => profileServer('catalogue', SELF),
    call_tool: () => callTool('catalogue', toolName),
    write_entry: () => writeLoad('catalogue', load),
  } satisfies Record<
    CapabilityName,
    () => Effect.Effect<
      CapabilityOutput,
      DomainError,
      Trace | WorldStore | Pace
    >
  >
  return yield* handlers[capability]()
})

// RUN RECORD

export const RunOutcome = Schema.Union([
  Schema.TaggedStruct('Succeeded', { output: CapabilityOutput }),
  Schema.TaggedStruct('Failed', {
    error: Schema.String,
    message: Schema.String,
  }),
])
export type RunOutcome = typeof RunOutcome.Type

export const RunRecord = Schema.Struct({
  capability: Schema.String,
  inputJson: Schema.String,
  outcome: RunOutcome,
  events: Schema.Array(EngineEvent),
  revisionBefore: Schema.Number,
  revisionAfter: Schema.Number,
})
export type RunRecord = typeof RunRecord.Type

const record = Effect.fnUntraced(function* (name: string, input: unknown) {
  const store = yield* WorldStore
  const trace = yield* Trace
  const before = yield* store.read
  const result = yield* Effect.result(execute(name, input))
  const after = yield* store.read
  const events = yield* trace.events
  const outcome: RunOutcome = Result.match(result, {
    onSuccess: output => ({ _tag: 'Succeeded' as const, output }),
    onFailure: error => ({
      _tag: 'Failed' as const,
      error: error._tag,
      message: describeError(error),
    }),
  })
  return RunRecord.make({
    capability: name,
    inputJson: JSON.stringify(input ?? {}),
    outcome,
    events,
    revisionBefore: before.revision,
    revisionAfter: after.revision,
  })
})

export const run = (name: string, input: unknown) =>
  record(name, input).pipe(Effect.provide(Trace.layer))

export const runOn = (world: World, name: string, input: unknown) =>
  Effect.gen(function* () {
    const runRecord = yield* run(name, input)
    const store = yield* WorldStore
    const nextWorld = yield* store.read
    return { record: runRecord, world: nextWorld }
  }).pipe(Effect.provide(WorldStore.inMemory(world)))
