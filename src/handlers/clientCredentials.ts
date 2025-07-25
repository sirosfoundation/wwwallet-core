import { OauthError } from '../errors'
import { checkClientCredentials, generateAccessToken } from '../statements'

export function clientCredentialsFactory(config) {
  return async function clientCredentials(expressRequest) {
    try {
      const {
        client_id,
        client_secret
      } = await validateRequest(expressRequest)

      const { client } = await checkClientCredentials({ client_id, client_secret }, config)

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

async function validateRequest(expressRequest) {
  if (!expressRequest.body) {
    throw new OauthError(400, 'bad_request', 'client credentials requests must have a body')
  }

  const {
    client_id,
    client_secret
  } = expressRequest.body

  if (!client_id) {
    throw new OauthError(400, 'bad_request', 'client_id is missing from body params')
  }

  if (!client_secret) {
    throw new OauthError(400, 'bad_request', 'client_secret is missing from body params')
  }

  return {
    client_id,
    client_secret
  }
}
