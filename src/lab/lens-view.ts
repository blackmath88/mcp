import { Array, Option } from 'effect'
import { type Html, type HtmlBuilder } from 'foldkit/html'

import { catalogue } from '../domain/capabilities.ts'
import {
  type Claim,
  type Listing,
  cannotKnow,
  driftOf,
  listedFromCatalogue,
  profile,
} from '../domain/lens.ts'
import { toolChip } from './atlas.ts'
import { findCapability } from './belt.ts'
import { Message } from './message.ts'
import type { Model } from './model.ts'
import { serverNames } from './names.ts'

type H = HtmlBuilder<Message>

const claimView = (claim: Claim, h: H): Html =>
  h.keyed('li')(
    claim.rule,
    [h.Class(`claim ${claim.isWarning ? 'warn' : ''}`)],
    [
      h.span([h.Class('rule')], [claim.rule]),
      h.span([h.Class('claim-text')], [claim.statement]),
      h.span(
        [h.Class('basis')],
        [
          `${claim.basis === 'declared' ? 'declared by the server' : 'inferred from its text'} · ${claim.evidence}`,
        ],
      ),
    ],
  )

// The listing Lens reads on the bench: the server's own answer when there is
// one, otherwise what the lab's catalogue says, and the view says which.
const benchListing = (
  model: Model,
): Readonly<{ listing: Listing; isObserved: boolean }> =>
  model.connection === 'connected'
    ? { listing: model.tools, isObserved: true }
    : {
        listing: Array.map(
          Array.filter(
            catalogue,
            capability => capability.specimen === model.station,
          ),
          listedFromCatalogue,
        ),
        isObserved: false,
      }

export const lensTabView = (model: Model, h: H): Html => {
  const { listing, isObserved } = benchListing(model)
  const report = profile(listing)
  return h.div(
    [h.Class('tabpane lens')],
    [
      h.p(
        [h.Class('mode')],
        [
          h.b([], ['Lens']),
          isObserved
            ? ` · reads only what the ${serverNames[model.station]} said in its tools/list answer in this tab. Claims marked “inferred” come from wording. Nothing here is verified behaviour.`
            : ` · no server answer available, so this reads the lab’s own catalogue for the ${serverNames[model.station]}.`,
        ],
      ),
      h.div(
        [h.Class('ctl')],
        [
          h.button(
            [
              h.Type('button'),
              h.Class('btn ghost small'),
              h.Disabled(!isObserved),
              h.OnClick(Message.ClickedTamper({ on: !model.tampered })),
            ],
            [
              model.tampered
                ? 'Restore the original description'
                : 'Bend it: the server changes a description after you saw it',
            ],
          ),
          h.span(
            [h.Class('side-note')],
            [
              'The server then announces a changed tool list, and the client lists again. Watch the fingerprint.',
            ],
          ),
        ],
      ),
      h.ul(
        [h.Class('lens-tools')],
        Array.map(report.tools, tool => {
          const maybeListed = Array.findFirst(
            listing,
            listed => listed.name === tool.name,
          )
          const drift = Option.match(maybeListed, {
            onNone: () => 'first-seen' as const,
            onSome: listed => driftOf(model.pins, listed),
          })
          return h.keyed('li')(
            tool.name,
            [h.Class('lens-tool')],
            [
              h.div(
                [h.Class('lens-head')],
                [
                  Option.match(findCapability(tool.name), {
                    onNone: () => h.b([h.Class('mono')], [tool.name]),
                    onSome: capability => toolChip(model, capability, h),
                  }),
                  h.span(
                    [h.Class('mono')],
                    [`fingerprint ${tool.fingerprint}`],
                  ),
                  drift === 'changed'
                    ? h.span(
                        [h.Class('tag bad')],
                        ['changed since you first saw it'],
                      )
                    : drift === 'unchanged'
                      ? h.span([h.Class('tag quiet')], ['same as first seen'])
                      : h.span([h.Class('tag quiet')], ['not pinned yet']),
                ],
              ),
              h.ul(
                [h.Class('claims')],
                Array.map(tool.claims, claim => claimView(claim, h)),
              ),
            ],
          )
        }),
      ),
      ...Array.map(report.compositions, composition =>
        h.p(
          [h.Class('result warn')],
          [
            h.b([], [`${composition.rule} · `]),
            `${composition.statement} (${composition.tools.join(', ')})`,
          ],
        ),
      ),
      h.details(
        [h.Class('fold')],
        [
          h.summary([], ['What a listing cannot tell you']),
          h.ul(
            [h.Class('lines text-list')],
            Array.map(cannotKnow, (line, index) =>
              h.keyed('li')(`${index}`, [], [line]),
            ),
          ),
        ],
      ),
    ],
  )
}
