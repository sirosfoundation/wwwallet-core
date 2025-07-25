import { describe, it, assert, expect } from 'vitest'
import request from 'supertest'

import { app } from '../../app'

describe('hello world', () => {
  it('renders', async () => {
    const response = await request(app)
      .get('/')

    expect(response.status).toBe(200)
    expect(response.text).toBe('Hello World!')
  })
})
