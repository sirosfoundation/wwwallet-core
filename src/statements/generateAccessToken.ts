import { SignJWT } from 'jose'
import { Config } from '..'
import { OauthClient } from '../resources'

export type generateAccessTokenParams = {
  client: OauthClient
}

export async function generateAccessToken({ client }: generateAccessTokenParams, config: Config) {
  const now = Date.now() / 1000

  const secret = new TextEncoder().encode(config.secret)

  const access_token = await new SignJWT({ sub: client.id })
    .setProtectedHeader({ alg: config.access_token_signature_alg })
    .setIssuedAt()
    .setExpirationTime(now + config.access_token_ttl)
    .sign(secret)

  const expires_in = config.access_token_ttl

  return { access_token, expires_in }
}
