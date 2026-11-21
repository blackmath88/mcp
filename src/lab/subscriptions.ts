import { Option, Stream } from 'effect'
import { Subscription } from 'foldkit'

import { slotForKey } from './belt.ts'
import { Message } from './message.ts'
import type { Model } from './model.ts'

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

export const subscriptions = Subscription.make<Model, Message>()(entry => ({
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
