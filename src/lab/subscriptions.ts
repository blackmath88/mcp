import { Option, Schema, Stream } from 'effect'
import { Subscription } from 'foldkit'

import { ASK_EVENT } from '../adapters/in-tab-mcp.ts'
import { slotForKey } from './belt.ts'
import { Message } from './message.ts'
import type { Model } from './model.ts'

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

export const subscriptions = Subscription.make<Model, Message>()(entry => ({
  canvasEscape: entry(
    { full: Schema.Boolean },
    {
      modelToDependencies: model => ({ full: model.canvasFull }),
      dependenciesToStream: ({ full }) =>
        full
          ? Stream.fromEventListener<KeyboardEvent>(document, 'keydown').pipe(
              Stream.filter(event => event.key === 'Escape'),
              Stream.map(() => Message.ClickedCanvasFull({ on: false })),
            )
          : Stream.empty,
    },
  ),
  serverAsks: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () =>
        Stream.fromEventListener<CustomEvent<string>>(window, ASK_EVENT).pipe(
          Stream.map(event =>
            Message.ServerAsked({ question: String(event.detail) }),
          ),
        ),
    },
  ),
  beltKeys: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () =>
        Stream.fromEventListener<KeyboardEvent>(document, 'keydown').pipe(
          Stream.flatMap(event =>
            Option.match(
              slotForKey({
                key: event.key,
                hasModifier: event.ctrlKey || event.metaKey || event.altKey,
                isTyping: isTypingTarget(event.target),
              }),
              {
                onNone: () => Stream.empty,
                onSome: slot =>
                  Stream.succeed(Message.PressedSlotKey({ slot })),
              },
            ),
          ),
        ),
    },
  ),
}))
