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
  slow: false,
})

Runtime.run(application)
