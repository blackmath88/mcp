import type { CapabilityName } from '../domain/capabilities.ts'
import { findCapability } from './belt.ts'

// The host's rule for when to ask the person before a tool runs. MCP leaves
// this to the host; real hosts differ. This lab models three common choices.
export type ApprovalRule = 'never' | 'writes' | 'always'

export const approvalRules: ReadonlyArray<
  Readonly<{ id: ApprovalRule; label: string; means: string }>
> = [
  {
    id: 'never',
    label: 'Never ask',
    means: 'Every call runs as soon as it is made.',
  },
  {
    id: 'writes',
    label: 'Ask unless read-only',
    means:
      'Calls marked readOnlyHint run straight away; the rest wait for you. The hint is the server’s own claim.',
  },
  {
    id: 'always',
    label: 'Always ask',
    means: 'Every call waits for you.',
  },
]

// What the server claims, as the lab's server sends it in tools/list.
export const claimsReadOnly = (name: string): boolean =>
  findCapability(name).pipe(
    capability =>
      capability._tag === 'Some' &&
      (capability.value.affordance === 'readable' ||
        capability.value.affordance === 'queryable'),
  )

export const needsApproval = (
  rule: ApprovalRule,
  name: CapabilityName | 'run_python',
): boolean =>
  rule === 'always' ||
  (rule === 'writes' && (name === 'run_python' || !claimsReadOnly(name)))
