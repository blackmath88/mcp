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
        if (output._tag === 'FileRead') {
          return `OK ${output.path}: ${output.content}`
        }
        if (output._tag === 'SnapshotTaken') {
          return `OK snapshot of page revision ${output.pageRevision}: ${output.entries.map(entry => `${entry.ref} ${entry.role} "${entry.name}"`).join(', ')} (${output.notExposed} controls not exposed)`
        }
        if (output._tag === 'Clicked') {
          return `OK clicked ${output.target} by ${output.how}`
        }
        if (output._tag === 'CliGenerated') {
          return `OK generated from schema v${output.schemaVersion}: ${output.help}`
        }
        if (output._tag === 'CratesShipped') {
          return `OK shipped via ${output.via}, sending ${output.sentFields.join(', ')} (schema v${output.schemaUsed})`
        }
        if (output._tag === 'WentTo') {
          return `OK client ${output.client} → ${output.place}, served by child #${output.childId}`
        }
        if (output._tag === 'WhereAmI') {
          return `OK client ${output.client} is at ${output.place === '' ? 'nowhere yet' : output.place}, says child #${output.childId}`
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
