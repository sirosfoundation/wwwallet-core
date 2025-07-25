import { Config } from '..'
import { OauthError } from '../errors'
import { Request } from 'express'
import { checkClientCredentials, checkScope, generateAccessToken } from '../statements'

type ClientCredentialsRequest = {
  client_id: string
  client_secret: string,
  scope?: string
}

export function clientCredentialsFactory(config: Config) {
  return async function clientCredentials(expressRequest: Request) {
    try {
      const request = await validateRequest(expressRequest)

      const { client } = await checkClientCredentials({
        client_id: request.client_id,
        client_secret: request.client_secret
      }, config)

      const { scope } = await checkScope(request.scope, { client }, config)

      const { access_token, expires_in } = await generateAccessToken({ client }, config)
      return {
        status: 200,
        body: {
          access_token,
          expires_in,
          token_type: 'bearer'
        }
      }
    } catch (error) {
      if (error instanceof OauthError) {
        return error.toResponse()
      }

      throw error
    }
  }
}

async function validateRequest(expressRequest: Request): Promise<ClientCredentialsRequest> {
  if (!expressRequest.body) {
    throw new OauthError(400, 'bad_request', 'client credentials requests requires a body')
  }

  const {
    client_id,
    client_secret,
    scope
  } = expressRequest.body

  if (!client_id) {
    throw new OauthError(400, 'bad_request', 'client_id is missing from body params')
  }

  if (!client_secret) {
    throw new OauthError(400, 'bad_request', 'client_secret is missing from body params')
  }

  return {
    client_id,
    client_secret,
    scope
  }
}
