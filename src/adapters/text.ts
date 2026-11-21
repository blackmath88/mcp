import { Array, pipe } from 'effect'

import type { Capability, RunRecord } from '../domain/capabilities.ts'
import type { EngineEvent } from '../domain/services.ts'

export const outcomeLine = (record: RunRecord): string =>
  record.outcome._tag === 'Failed'
    ? `FAILED ${record.outcome.error}: ${record.outcome.message}`
    : pipe(record.outcome.output, output => {
        if (output._tag === 'MapRead') {
          return `OK map revision ${output.revision}: ${output.places.length} places, ${output.paths.length} paths, span limit ${output.maxSpan}`
        }
        if (output._tag === 'RouteFound') {
          return `OK route ${output.route.places.join(' → ')} (span ${output.route.span})`
        }
        if (output._tag === 'PageFetched') {
          return `OK "${output.title}" from ${output.finalUrl} (${output.hops.length} hops, ${output.robotsChecks} robots checks)`
        }
        if (output._tag === 'Remembered') {
          return `OK stored "${output.entity} ${output.observation}" in ${output.storedAt} (${output.factsInFile} lines)`
        }
        if (output._tag === 'Recalled') {
          return `OK ${output.entity}: ${output.observations.length === 0 ? 'nothing stored' : output.observations.join(' | ')} (from ${output.readFrom})`
        }
        if (output._tag === 'PlanMade') {
          return `OK plan by ${output.madeBy}: ${output.steps.join(' ')}`
        }
        if (output._tag === 'PathBuilt') {
          return `OK ${output.artifact.id}: ${output.artifact.summary}`
        }
        return `OK ${output.artifact.id}: ${output.artifact.summary}`
      })

export const eventLine = (event: EngineEvent): string =>
  `${String(event.seq).padStart(2, ' ')}  ${event.calledBy} → ${event.component}  ${event.kind}  ${event.operation}${event.detail === '' ? '' : `  [${event.detail}]`}`

export const recordText = (record: RunRecord): string =>
  [
    outcomeLine(record),
    `revision ${record.revisionBefore} → ${record.revisionAfter}`,
    'engine events:',
    ...Array.map(record.events, eventLine),
  ].join('\n')

export const catalogueText = (capabilities: ReadonlyArray<Capability>) =>
  capabilities
    .map(
      capability =>
        `${capability.name.padEnd(15, ' ')} ${capability.affordance.padEnd(10, ' ')} ${capability.description}`,
    )
    .join('\n')
