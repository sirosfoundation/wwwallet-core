import { describe, it, assert, expect } from 'vitest'
import request from 'supertest'

import { app } from '../../app'

describe('client credentials flow', () => {
  it('returns an error with no body', async () => {
    const response = await request(app)
      .post('/token')

    expect(response.status).toBe(400)
    expect(response.body).to.deep.eq({
      "error": "bad_request",
      "error_description": "client credentials requests must have a body",
    })
  })

  it('returns an error with client_id', async () => {
    const client_id = 'client_id'

    const response = await request(app)
      .post('/token')
      .send({ client_id })

    expect(response.status).toBe(400)
    expect(response.body).to.deep.eq({
      "error": "bad_request",
      "error_description": "client_secret is missing from body params",
    })
  })

  it('returns an error with invalid client_secret', async () => {
    const client_id = 'id'
    const client_secret = 'client_secret'

    const response = await request(app)
      .post('/token')
      .send({ client_id, client_secret })

    expect(response.status).toBe(401)
    expect(response.body).to.deep.eq({
      "error": "invalid_client",
      "error_description": "Invalid client_id or client_secret",
    })
  })

  it('returns a token with valid client', async () => {
    const client_id = 'id'
    const client_secret = 'secret'

    const response = await request(app)
      .post('/token')
      .send({ client_id, client_secret })

    expect(response.status).toBe(200)
    assert(response.body.access_token)
    assert(response.body.expires_in)
    expect(response.body.token_type).to.eq('bearer')
  })
})
