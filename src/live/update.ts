import { Effect, Option, Schema } from 'effect'
import { Command, type Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { requestSpecimen } from './client.ts'
import { type Reply, Request } from './contract.ts'
import { errorMessage } from './evidence.ts'
import { Message } from './message.ts'
import { AppState, type Model, Operation } from './model.ts'
import { type SpecimenId, allowedTools } from './specimens.ts'

type UpdateReturn = Update.Return<Model, Message>

const RequestHost = Command.define('RequestHost', {
  args: {
    request: Request,
    epoch: Schema.Number,
    closeBefore: Schema.optionalKey(Schema.String),
  },
  messages: [Message.CompletedRequest],
  execute: ({ request, epoch, closeBefore }) =>
    Effect.tryPromise({
      try: async signal => {
        if (closeBefore !== undefined) {
          await requestSpecimen(
            Request.make({ _tag: 'Close', sessionId: closeBefore }),
            signal,
          )
        }
        return requestSpecimen(request, signal)
      },
      catch: errorMessage,
    }).pipe(
      Effect.match({
        onSuccess: reply => Message.CompletedRequest({ epoch, reply }),
        onFailure: error =>
          Message.CompletedRequest({
            epoch,
            reply: { error, events: [], dropped: 0 },
          }),
      }),
    ),
})

const CloseSession = Command.define('CloseSession', {
  args: { sessionId: Schema.String },
  messages: [Message.CompletedCloseSession],
  execute: ({ sessionId }) =>
    Effect.tryPromise({
      try: signal =>
        requestSpecimen(Request.make({ _tag: 'Close', sessionId }), signal),
      catch: errorMessage,
    }).pipe(Effect.ignore, Effect.as(Message.CompletedCloseSession())),
})

const freshModel = (specimen: SpecimenId, epoch: number): Model => ({
  specimen,
  epoch,
  operation: Operation.Idle(),
  session: Option.none(),
  tool: '',
  echoMessage: 'A note from the workbench',
  role: 'viewer',
  query: 'memory',
  invocation: Option.none(),
  app: Option.none(),
  appState: AppState.Starting(),
  events: [],
  dropped: 0,
  appEvents: [],
  error: Option.none(),
  registry: Option.none(),
})

export const init = (): UpdateReturn => ({ model: freshModel('time', 0) })

const start = (
  model: Model,
  operation: typeof Operation.Type,
  request: Request,
  closeBefore = Option.none<string>(),
): UpdateReturn => {
  const epoch = model.epoch + 1
  return {
    model: modifyFields(model, {
      epoch: () => epoch,
      operation: () => operation,
      error: () => Option.none(),
    }),
    commands: [
      RequestHost({
        request,
        epoch,
        ...(Option.isSome(closeBefore)
          ? { closeBefore: closeBefore.value }
          : {}),
      }),
    ],
  }
}

function currentApp(model: Model, sessionId: string, run: number): boolean {
  return (
    Option.isSome(model.session) &&
    model.session.value.id === sessionId &&
    Option.isSome(model.app) &&
    model.app.value.run === run
  )
}

function received(model: Model, reply: Reply): Model {
  const known = model.events.at(-1)?.seq ?? 0
  const observed = reply.events.at(-1)?.seq ?? 0
  if (reply.session && observed < known) {
    return model
  }
  return modifyFields(model, {
    session: previous =>
      reply.session && observed >= known
        ? Option.some(reply.session)
        : previous,
    events: previous => (observed >= known ? reply.events : previous),
    dropped: previous => (observed >= known ? reply.dropped : previous),
    invocation: previous =>
      reply.invocation ? Option.some(reply.invocation) : previous,
    error: () => Option.fromNullishOr(reply.error),
  })
}

export const update = (model: Model, message: Message): UpdateReturn =>
  Message.match<UpdateReturn>(message, {
    SelectedSpecimen: ({ specimen }) => {
      if (model.specimen === specimen || model.operation._tag !== 'Idle') {
        return { model }
      }
      const nextModel = freshModel(specimen, model.epoch + 1)
      return Option.match(model.session, {
        onNone: () => ({ model: nextModel }),
        onSome: ({ id }) => ({
          model: nextModel,
          commands: [CloseSession({ sessionId: id })],
        }),
      })
    },
    SelectedTool: ({ tool }) => ({
      model: modifyFields(model, { tool: () => tool }),
    }),
    UpdatedEcho: ({ value }) => ({
      model: modifyFields(model, { echoMessage: () => value }),
    }),
    UpdatedRole: ({ role }) => ({
      model: modifyFields(model, { role: () => role }),
    }),
    UpdatedQuery: ({ value }) => ({
      model: modifyFields(model, { query: () => value }),
    }),
    ClickedDiscover: () => {
      if (model.operation._tag !== 'Idle' || model.specimen === 'registry') {
        return { model }
      }
      const cleared = modifyFields(freshModel(model.specimen, model.epoch), {
        echoMessage: () => model.echoMessage,
        role: () => model.role,
      })
      return start(
        cleared,
        Operation.Discovering(),
        Request.make({
          _tag: 'Connect',
          specimen: model.specimen,
        }),
        Option.map(model.session, session => session.id),
      )
    },
    ClickedCall: () => {
      if (
        model.operation._tag !== 'Idle' ||
        Option.isNone(model.session) ||
        !allowedTools[model.specimen].includes(model.tool)
      ) {
        return { model }
      }
      const args =
        model.specimen === 'everything'
          ? { message: model.echoMessage }
          : model.specimen === 'boundary'
            ? { role: model.role }
            : {}
      const nextModel = modifyFields(model, { invocation: () => Option.none() })
      return start(
        nextModel,
        Operation.Calling(),
        Request.make({
          _tag: 'Call',
          sessionId: model.session.value.id,
          tool: model.tool,
          arguments: args,
          from: 'learner',
        }),
      )
    },
    ClickedStop: () => {
      if (model.operation._tag !== 'Idle' || Option.isNone(model.session)) {
        return { model }
      }
      return start(
        model,
        Operation.Stopping(),
        Request.make({ _tag: 'Stop', sessionId: model.session.value.id }),
      )
    },
    SubmittedSearch: () => {
      if (model.operation._tag !== 'Idle' || model.specimen !== 'registry') {
        return { model }
      }
      return start(
        modifyFields(model, {
          registry: () => Option.none(),
          events: () => [],
          dropped: () => 0,
        }),
        Operation.Searching(),
        Request.make({ _tag: 'Search', query: model.query }),
      )
    },
    CompletedRequest: ({ epoch, reply }) => {
      if (model.epoch !== epoch) {
        return { model }
      }
      const nextModel = received(model, reply)
      return {
        model: modifyFields(nextModel, {
          operation: () => Operation.Idle(),
          tool: tool =>
            model.operation._tag === 'Discovering'
              ? (reply.session?.tools.find(item =>
                  allowedTools[model.specimen].includes(item.name),
                )?.name ?? '')
              : tool,
          app: previous => (reply.app ? Option.some(reply.app) : previous),
          appState: previous => (reply.app ? AppState.Starting() : previous),
          appEvents: previous => (reply.app ? [] : previous),
          registry: previous =>
            reply.registry ? Option.some(reply.registry) : previous,
        }),
      }
    },
    CompletedCloseSession: () => ({ model }),
    WatchingSessionExit: () => ({ model }),
    ObservedAppEvent: ({ sessionId, run, event }) => ({
      model: currentApp(model, sessionId, run)
        ? modifyFields(model, {
            appEvents: previous => [
              ...previous.filter(item => item.seq < event.seq).slice(-79),
              event,
            ],
          })
        : model,
    }),
    InitializedApp: ({ sessionId, run }) => ({
      model: currentApp(model, sessionId, run)
        ? modifyFields(model, { appState: () => AppState.Ready() })
        : model,
    }),
    FailedApp: ({ sessionId, run, error }) => ({
      model: currentApp(model, sessionId, run)
        ? modifyFields(model, { appState: () => AppState.Failed({ error }) })
        : model,
    }),
    CompletedAppCall: ({ sessionId, run, reply }) => ({
      model: currentApp(model, sessionId, run) ? received(model, reply) : model,
    }),
  })
