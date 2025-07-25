import { Container } from 'inversify'

import { Core } from 'src'
import { config } from 'config'

const container = new Container()

container.bind<Core>('Core').toConstantValue(new Core(config))

export {
  container
}
