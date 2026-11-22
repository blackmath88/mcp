export type AdvertisedTool = Readonly<{
  name: string
  inputSchemaJson: string
  readOnlyHint?: boolean | undefined
  uiUri?: string | undefined
}>

export type InterfaceClaim = Readonly<{
  rule: string
  statement: string
  evidence: string
}>

export const interfaceProfile = (
  tool: AdvertisedTool,
): ReadonlyArray<InterfaceClaim> => [
  {
    rule: 'surface.tool',
    statement: 'The server advertised this tool.',
    evidence: `tools/list · ${tool.name}`,
  },
  {
    rule: 'surface.schema',
    statement: 'The server supplied an input schema.',
    evidence: 'tools/list · inputSchema',
  },
  ...(tool.uiUri === undefined
    ? []
    : [
        {
          rule: 'ui.declared',
          statement: 'The tool advertises a view resource.',
          evidence: `tools/list · UI URI ${tool.uiUri}`,
        },
      ]),
  ...(tool.readOnlyHint === undefined
    ? []
    : [
        {
          rule: 'effect.hint',
          statement: tool.readOnlyHint
            ? 'The publisher labels the tool read-only.'
            : 'The publisher sets its read-only hint to false.',
          evidence: `tools/list · annotations.readOnlyHint = ${tool.readOnlyHint}`,
        },
      ]),
]

export const interfaceUnknowns = [
  'Effective permissions and side effects',
  'State ownership and persistence',
  'Internal execution path or model use',
  'Whether a declared view renders or sends anything back',
]
