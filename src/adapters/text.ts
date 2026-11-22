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
        if (output._tag === 'MapShown') {
          return `OK map app opened at ${output.place}`
        }
        if (output._tag === 'ViewReported') {
          return `OK the app is looking at ${output.place}${output.differsFromToolResult ? ' (not where the tool result said)' : ''}`
        }
        if (output._tag === 'BatchDone') {
          return `OK ${output.written} entries written as ${output.mode}; ${output.resultsReported} result(s) reported`
        }
        if (output._tag === 'ExpertReplied') {
          return `OK [${output.contract}] ${output.reply} (next step: ${output.nextStepOwner}; ${output.grounded ? 'had the map' : 'never saw the map'})`
        }
        if (output._tag === 'LoopFinished') {
          return `OK ratings ${output.ratings.join(', ')}; returned draft ${output.returnedDraft} of ${output.draftsWritten}: ${output.stoppedBecause}`
        }
        if (output._tag === 'LoopResumed') {
          return `OK ${output.engine}: ${output.generationsRedone} of ${output.generationsBeforeCrash} generations redone after the crash`
        }
        if (output._tag === 'ServerProfiled') {
          return [
            `${output.server}: ${output.tools.length} tool(s), ${output.changed} changed since pinned`,
            ...output.tools.map(
              tool =>
                `  ${tool.name} ${tool.fingerprint} ${tool.drift} [${tool.rules.join(' ')}]`,
            ),
            `  supported: ${output.supported}`,
            `  cannot establish: ${output.cannotEstablish}`,
          ].join('\n')
        }
        if (output._tag === 'InventoryListed') {
          return `OK ${output.tools.join('; ')} (${output.hidden} hidden)`
        }
        if (output._tag === 'ToolCalled') {
          return `OK ${output.name} answered by ${output.answeredBy}: ${output.answer}`
        }
        if (output._tag === 'EntryWritten') {
          return `OK wrote ${output.load}; the ledger has ${output.entriesNow} entries`
        }
        if (output._tag === 'CartsListed') {
          return `OK ${output.carts.join('; ')}`
        }
        if (output._tag === 'CartReserved') {
          return `OK reserved ${output.cart}, chosen by ${output.chosenBy}`
        }
        if (output._tag === 'CrateMoved') {
          return `OK ${output.reported} (sent to ${output.to}${output.checked ? ', checked by the sensor' : ', nothing checked'})`
        }
        if (output._tag === 'SensorRead') {
          return `OK the sensor sees the crate at ${output.crateAt}`
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
