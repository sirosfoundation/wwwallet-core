import { OauthError } from '../errors'

export async function checkClientCredentials({ client_id, client_secret }, config) {
  const client = config.clients.find(client => {
    return client.id == client_id &&
      client.secret == client_secret
  })

  if (!client) {
    throw new OauthError(401, 'invalid_client', 'Invalid client_id or client_secret')
  }

  return { client }
}
