import type { Html, HtmlBuilder } from 'foldkit/html'

export type BackstageVisibility = 'open' | 'collapsed'

export const benchShell = <Message>(
  backstage: BackstageVisibility,
  parts: Readonly<{
    titlebar: Html
    sidebar: Html
    workbench: Html
    inspector: Html
    panel: Html
    statusbar: Html
  }>,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [h.Class(`ide backstage-${backstage}`)],
    [
      parts.titlebar,
      parts.sidebar,
      parts.workbench,
      parts.inspector,
      parts.panel,
      parts.statusbar,
    ],
  )

export const brandContents = <Message>(
  h: HtmlBuilder<Message>,
): ReadonlyArray<Html> => [
  h.span([h.Class('brandmark'), h.AriaHidden(true)]),
  h.span([h.Class('brandname')], ['MCP Lab']),
]

export const benchStep = <Message>(
  n: string,
  title: string,
  note: string,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [h.Class('tb-label')],
    [
      h.span([h.Class('tb-n'), h.AriaHidden(true)], [n]),
      h.b([], [title]),
      h.span([h.Class('tb-note')], [note]),
    ],
  )

export const toolbenchLayout = <Message>(
  parts: Readonly<{
    host: Html
    instruments: Html
    drawer: Html
    materialClass: string
    material: ReadonlyArray<Html>
    tray: ReadonlyArray<Html>
  }>,
  h: HtmlBuilder<Message>,
): Html =>
  h.section(
    [h.Class('toolbench'), h.AriaLabel('Toolbench')],
    [
      parts.host,
      parts.instruments,
      parts.drawer,
      h.div(
        [h.Class('tb-main')],
        [
          h.div([h.Class(parts.materialClass)], parts.material),
          h.aside(
            [h.Class('tb-tray'), h.AriaLabel('What comes back')],
            parts.tray,
          ),
        ],
      ),
    ],
  )

export const backstageLayout = <Message>(
  backstage: BackstageVisibility,
  toggle: Message,
  tabs: ReadonlyArray<Html>,
  content: Html,
  h: HtmlBuilder<Message>,
): Html =>
  h.section(
    [h.Class('panel'), h.AriaLabel('Backstage')],
    [
      h.div(
        [h.Class('panehead')],
        [
          h.span([h.Class('eyebrow')], ['Backstage · what actually happened']),
          h.button(
            [
              h.Type('button'),
              h.Class('toggle'),
              h.AriaExpanded(backstage === 'open'),
              h.OnClick(toggle),
            ],
            [backstage === 'open' ? 'Collapse' : 'Expand'],
          ),
        ],
      ),
      h.div([h.Class('tabs'), h.Role('group'), h.AriaLabel('Evidence')], tabs),
      backstage === 'collapsed' ? h.empty : content,
    ],
  )
