import { Config } from '..'
import { OauthClient } from '../resources'
import { OauthError } from '../errors'

type checkScopeParams = {
  client: OauthClient
}

export async function checkScope(scope: string | undefined, { client }: checkScopeParams, config: Config) {
  if (!scope) return { scope: '' }

  const scopes = scope.split(' ')

  if (scopes.filter(scope => !client.scopes.includes(scope)).length) {
    throw new OauthError(400, 'bad_request', 'Invalid scope')
  }

  return { scope }
}
