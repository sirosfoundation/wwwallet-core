export const config = {
  clients: [{
    id: 'id',
    secret: 'secret',
    scopes: ['client:scope']
  }],
  secret: 'secret',
  access_token_signature_alg: 'HS256',
  access_token_ttl: 3600 * 2
}
