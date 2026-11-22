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
