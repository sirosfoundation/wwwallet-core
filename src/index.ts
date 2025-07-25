import { clientCredentialsFactory } from './handlers'

export class Core {
  constructor(config) {
    this.config = config
  }

  get clientCredentials() {
    return clientCredentialsFactory(this.config)
  }
}
