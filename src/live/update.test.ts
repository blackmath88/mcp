import { Option } from 'effect'
import { expect, it } from 'vitest'

import { Message } from './message.ts'
import { init, update } from './update.ts'

it('ignores late replies after changing specimens', () => {
  const initial = init().model
  const changed = update(
    initial,
    Message.SelectedSpecimen({ specimen: 'everything' }),
  ).model
  const discovery = update(changed, Message.ClickedDiscover()).model
  const late = update(
    discovery,
    Message.CompletedRequest({
      epoch: initial.epoch,
      reply: { error: 'Old failure', events: [], dropped: 0 },
    }),
  )
  expect(late.model).toBe(discovery)
  expect(late.model.operation._tag).toBe('Discovering')
})

it('ignores events from an iframe once its owning run is gone', () => {
  const initial = init().model
  const late = update(
    initial,
    Message.FailedApp({ sessionId: 'previous', run: 10, error: 'Old app' }),
  )
  expect(late.model).toBe(initial)
})

it('keeps a newer stop and failure when an older app reply arrives', () => {
  const sessionId = 'clock'
  const run = 10
  const initial = init().model
  const event = {
    seq: 12,
    at: '2026-11-22T10:00:00Z',
    channel: 'Host' as const,
    direction: 'local' as const,
    label: 'Call failed',
    detail: 'Not connected',
  }
  const stopped = {
    id: sessionId,
    state: 'stopped' as const,
    server: 'Clock',
    version: '1',
    protocol: '2025-11-25',
    tools: [],
    partial: false,
  }
  const model = {
    ...initial,
    session: Option.some(stopped),
    app: Option.some({
      run,
      uri: 'ui://clock/view',
      html: '',
      sandboxUrl: '',
      tool: 'get-time',
      argumentsJson: '{}',
      resultJson: '{}',
    }),
    events: [event],
    error: Option.some('Not connected'),
  }
  const updated = update(
    model,
    Message.CompletedAppCall({
      sessionId,
      run,
      reply: {
        session: { ...stopped, state: 'ready' },
        dropped: 0,
        events: [{ ...event, seq: 11 }],
        invocation: {
          from: 'app',
          tool: 'get-time',
          argumentsJson: '{}',
          resultJson: '{}',
          isError: false,
        },
      },
    }),
  )
  expect(updated.model).toBe(model)
})
