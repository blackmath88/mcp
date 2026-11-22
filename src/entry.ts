import { Runtime } from 'foldkit'

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
