import { Runtime } from 'foldkit'

import { Model } from './model.ts'
import { init, update } from './update.ts'
import { view } from './view.ts'

const application = Runtime.makeApplication({
  Model,
  init,
  update,
  view,
  container: document.getElementById('root'),
  devTools: false,
  slow: {
    onSlow: ({ _tag, durationMs }) => {
      console.warn(`Live workbench ${_tag} took ${Math.round(durationMs)}ms`)
    },
  },
})

Runtime.run(application)
