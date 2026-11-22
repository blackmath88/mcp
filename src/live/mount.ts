import { Effect, Queue, Schema, Stream } from 'effect'
import { Mount } from 'foldkit'

import { connectApp } from './app-bridge.ts'
import { releaseOnExit } from './client.ts'
import { AppResource } from './contract.ts'
import { errorMessage } from './evidence.ts'
import { Message } from './message.ts'

const appMessages = [
  Message.ObservedAppEvent,
  Message.InitializedApp,
  Message.FailedApp,
  Message.CompletedAppCall,
] as const
type AppMessage = (typeof appMessages)[number]['Type']

export const ConnectApp = Mount.defineStream('ConnectApp', {
  args: { resource: AppResource, sessionId: Schema.String },
  messages: appMessages,
  execute: ({ element, resource, sessionId }) =>
    Stream.callback<AppMessage>(queue => {
      const scope = { sessionId, run: resource.run }
      const emit = (message: AppMessage) => Queue.offerUnsafe(queue, message)
      return Effect.acquireRelease(
        Effect.try({
          try: () =>
            connectApp(element, resource, sessionId, {
              observed: event =>
                emit(Message.ObservedAppEvent({ ...scope, event })),
              initialized: () => emit(Message.InitializedApp(scope)),
              failed: error => emit(Message.FailedApp({ ...scope, error })),
              called: reply =>
                emit(Message.CompletedAppCall({ ...scope, reply })),
            }),
          catch: errorMessage,
        }).pipe(
          Effect.catch(error =>
            Effect.sync(() => {
              emit(Message.FailedApp({ ...scope, error }))
              return () => {}
            }),
          ),
        ),
        dispose => Effect.sync(dispose),
      )
    }),
})

export const WatchSessionExit = Mount.define('WatchSessionExit', {
  args: { sessionId: Schema.String },
  messages: [Message.WatchingSessionExit],
  execute: ({ sessionId, element }) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const window = element.ownerDocument.defaultView
        const close = (event: PageTransitionEvent) => {
          if (!event.persisted && window) {
            releaseOnExit(sessionId, window.navigator)
          }
        }
        window?.addEventListener('pagehide', close)
        return () => window?.removeEventListener('pagehide', close)
      }),
      dispose => Effect.sync(dispose),
    ).pipe(Effect.as(Message.WatchingSessionExit())),
})
