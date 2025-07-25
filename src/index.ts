import { clientCredentialsFactory } from './handlers'

export type Config = {
  clients: Array<{ id: string, secret: string }>
  access_token_ttl: number
  access_token_signature_alg: string
  secret: string
}

export class Core {
  config: Config

  constructor(config: Config) {
    this.config = config
  }

  get clientCredentials() {
    return clientCredentialsFactory(this.config)
  }
}
