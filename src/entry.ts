import { Runtime } from 'foldkit'

import { startMenagerie } from './lab/critters/walker.ts'
import { closePopoversOnOutsideClick } from './lab/popovers.ts'
import {
  scrollToCanvasOnPick,
  scrollToNoteOnOpen,
  scrollToTopOnNavigation,
} from './lab/scroll.ts'
import { tellOnScroll } from './lab/tell-scroll.ts'
import { Message, Model, init, subscriptions, update, view } from './main.ts'

const application = Runtime.makeApplication({
  Model,
  init,
  update,
  view,
  subscriptions,
  container: document.getElementById('root'),
  devTools: {
    Message,
  },
})

Runtime.run(application)

closePopoversOnOutsideClick(document)
scrollToTopOnNavigation(document)
scrollToCanvasOnPick(document)
scrollToNoteOnOpen(document)
tellOnScroll(document)
startMenagerie(document)
