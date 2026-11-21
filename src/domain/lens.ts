import { Array, Option, pipe } from 'effect'

import { type Capability, inputJsonSchema } from './capabilities.ts'

// Lens reads one thing only: what a server says about its tools. Every claim
// names the rule that produced it and the field it rests on. A listing is the
// server's own text, so nothing here is verified behaviour.

export type ListedTool = Readonly<{
  name: string
  title: string
  description: string
  readOnly: boolean
  parameters: ReadonlyArray<string>
}>

export type Listing = ReadonlyArray<ListedTool>

export type Basis = 'declared' | 'inferred'

export type Claim = Readonly<{
  rule: string
  statement: string
  evidence: string
  basis: Basis
  isWarning: boolean
}>

export type ToolProfile = Readonly<{
  name: string
  fingerprint: string
  claims: ReadonlyArray<Claim>
}>

export type Composition = Readonly<{
  rule: string
  statement: string
  tools: ReadonlyArray<string>
}>

export type LensReport = Readonly<{
  tools: ReadonlyArray<ToolProfile>
  compositions: ReadonlyArray<Composition>
}>

export const cannotKnow: ReadonlyArray<string> = [
  'What a tool actually does when called.',
  'Whether a read-only declaration is honoured.',
  'Who is allowed to call it, and whether anyone checks.',
  'Where data goes after the call.',
  'Whether the next listing will say the same.',
]

// RULES

type Rule = Readonly<{
  id: string
  basis: Basis
  isWarning: boolean
  statement: string
  match: (tool: ListedTool) => Option.Option<string>
}>

const parameterIn =
  (names: ReadonlyArray<string>) =>
  (tool: ListedTool): Option.Option<string> =>
    pipe(
      tool.parameters,
      Array.findFirst(parameter => names.includes(parameter.toLowerCase())),
      Option.map(parameter => `parameter “${parameter}”`),
    )

const wording =
  (pattern: RegExp) =>
  (tool: ListedTool): Option.Option<string> =>
    pipe(
      Option.fromNullishOr(pattern.exec(tool.description)),
      Option.map(match => `description says “${match[0]}”`),
    )

const hidden = /[​-‏⁠\u{E0000}-\u{E007F}]/u

const rules: ReadonlyArray<Rule> = [
  {
    id: 'L01',
    basis: 'declared',
    isWarning: false,
    statement: 'The server declares this tool read-only.',
    match: tool =>
      tool.readOnly
        ? Option.some('annotations.readOnlyHint is true')
        : Option.none(),
  },
  {
    id: 'L02',
    basis: 'declared',
    isWarning: false,
    statement: 'Not declared read-only. Assume it may change something.',
    match: tool =>
      tool.readOnly
        ? Option.none()
        : Option.some('annotations.readOnlyHint is absent or false'),
  },
  {
    id: 'L03',
    basis: 'inferred',
    isWarning: false,
    statement: 'Takes a destination, so it can be pointed somewhere.',
    match: parameterIn(['url', 'uri', 'endpoint', 'host', 'webhook']),
  },
  {
    id: 'L04',
    basis: 'inferred',
    isWarning: false,
    statement:
      'Takes a path. Its reach depends on a boundary the listing does not show.',
    match: parameterIn(['path', 'file', 'directory', 'dir']),
  },
  {
    id: 'L05',
    basis: 'inferred',
    isWarning: false,
    statement: 'The text suggests it keeps something beyond this call.',
    match: wording(/\b(store|stores|remember|append|persist|save)\w*/i),
  },
  {
    id: 'L06',
    basis: 'inferred',
    isWarning: false,
    statement: 'The text suggests it hands back stored or private data.',
    match: tool =>
      tool.readOnly
        ? wording(/\b(stored|everything|text file|memory|ledger)\b/i)(tool)
        : Option.none(),
  },
  {
    id: 'L07',
    basis: 'inferred',
    isWarning: false,
    statement: 'The text suggests it passes work to another intelligence.',
    match: wording(/\b(expert|another model|second opinion|consult\w*)\b/i),
  },
  {
    id: 'L08',
    basis: 'inferred',
    isWarning: false,
    statement: 'The text suggests it decides and runs its own steps.',
    match: wording(/\b(by any means|program|refine|until it is|plan the)\b/i),
  },
  {
    id: 'L09',
    basis: 'inferred',
    isWarning: true,
    statement:
      'The description reads as an instruction to whoever reads it. A description is untrusted text.',
    match: wording(
      /\b(ignore (all|any|previous)|always (call|use)|before any other tool|do not (tell|mention)|never tell|full conversation|system prompt)\b/i,
    ),
  },
  {
    id: 'L10',
    basis: 'inferred',
    isWarning: true,
    statement:
      'The description contains characters that do not display. A person approving it would not see them.',
    match: tool =>
      hidden.test(`${tool.description}${tool.title}${tool.name}`)
        ? Option.some('invisible code points in the listed text')
        : Option.none(),
  },
]

const claimsFor = (tool: ListedTool): ReadonlyArray<Claim> =>
  Array.flatMap(rules, rule =>
    Option.match(rule.match(tool), {
      onNone: () => [],
      onSome: evidence => [
        {
          rule: rule.id,
          statement: rule.statement,
          evidence,
          basis: rule.basis,
          isWarning: rule.isWarning,
        },
      ],
    }),
  )

// FINGERPRINT
//
// FNV-1a over the listed fields. It is a quick way to notice that a
// definition changed. It is not a signature and proves nothing about who
// changed it.

const FNV_OFFSET = 0x811c9dc5
const FNV_PRIME = 0x01000193

export const fingerprintOf = (tool: ListedTool): string => {
  const text = [
    tool.name,
    tool.title,
    tool.description,
    String(tool.readOnly),
    ...tool.parameters,
  ].join('\u0001')
  const hash = Array.reduce([...text], FNV_OFFSET, (current, letter) =>
    Math.imul(current ^ (letter.codePointAt(0) ?? 0), FNV_PRIME),
  )
  return (hash >>> 0).toString(16).padStart(8, '0')
}

// REPORT

const having = (
  tools: ReadonlyArray<ToolProfile>,
  rule: string,
): ReadonlyArray<string> =>
  pipe(
    tools,
    Array.filter(tool => tool.claims.some(claim => claim.rule === rule)),
    Array.map(tool => tool.name),
  )

const compositionsOf = (
  tools: ReadonlyArray<ToolProfile>,
): ReadonlyArray<Composition> => {
  const readers = having(tools, 'L06')
  const senders = having(tools, 'L03')
  return Array.isReadonlyArrayEmpty(readers) ||
    Array.isReadonlyArrayEmpty(senders)
    ? []
    : [
        {
          rule: 'C01',
          statement:
            'One caller holds something that reads stored data and something that can be pointed at a destination. Neither is a fault alone. Together they are a way out.',
          tools: [...readers, ...senders],
        },
      ]
}

export const profile = (listing: Listing): LensReport => {
  const tools = Array.map(listing, tool => ({
    name: tool.name,
    fingerprint: fingerprintOf(tool),
    claims: claimsFor(tool),
  }))
  return { tools, compositions: compositionsOf(tools) }
}

// PINS: the definition as first seen, to compare later listings against.

export type Pin = Readonly<{ name: string; fingerprint: string }>

export const pinNew = (
  pins: ReadonlyArray<Pin>,
  listing: Listing,
): ReadonlyArray<Pin> => [
  ...pins,
  ...pipe(
    listing,
    Array.filter(tool => !pins.some(pin => pin.name === tool.name)),
    Array.map(tool => ({ name: tool.name, fingerprint: fingerprintOf(tool) })),
  ),
]

export type Drift = 'first-seen' | 'unchanged' | 'changed'

export const driftOf = (pins: ReadonlyArray<Pin>, tool: ListedTool): Drift =>
  pipe(
    pins,
    Array.findFirst(pin => pin.name === tool.name),
    Option.match({
      onNone: () => 'first-seen',
      onSome: pin =>
        pin.fingerprint === fingerprintOf(tool) ? 'unchanged' : 'changed',
    }),
  )

// A listing as this lab's own catalogue would give it, before any server is
// asked.

const parametersOf = (capability: Capability): ReadonlyArray<string> =>
  Object.keys(Object(inputJsonSchema(capability).properties))

export const listedFromCatalogue = (capability: Capability): ListedTool => ({
  name: capability.name,
  title: capability.title,
  description: capability.description,
  readOnly:
    capability.affordance === 'readable' ||
    capability.affordance === 'queryable',
  parameters: parametersOf(capability),
})
