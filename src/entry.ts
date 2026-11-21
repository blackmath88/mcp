import { Runtime } from 'foldkit'

import { Message, Model, init, update, view } from './main.ts'

const application = Runtime.makeApplication({
  Model,
  init,
  update,
  view,
  container: document.getElementById('root'),
  devTools: {
    Message,
  },
})

Runtime.run(application)
