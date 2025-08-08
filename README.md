# wwWallet issuer

## Installation

```sh
npm ci
```

### Configuration

Server static configuration can be edited, quoting the following example values:

```js
// ./config.ts

export const config = {
	clients: [
		{
			id: "id",
			secret: "secret",
			scopes: ["client:scope"],
		},
	],
	secret: "secret",
	access_token_signature_alg: "HS256",
	access_token_ttl: 3600 * 2,
};
```

## Run a development server

```sh
$ npm start

> start
> ts-node --typeCheck --transpileOnly --project ./tsconfig.json ./app.ts

========== wwwallet client credentials Proof of Concept listening to port 5000
GET      /
GET      /healthz
POST     /token
GET      /offer/:scope
==========
```

### client credentials implementation

This server exposes a token endpoint implementing client credentials, those are checked against the clients registered in the configuration. Requesting the server using cURL, you obtain an access token (or an error) following the OAuth 2.0 specification.

```sh
$ curl -X POST http://localhost:5000/token \
	--data '{"client_id": "id", "client_secret": "secret", "scope": "client:scope"}' \
	-H 'Content-Type: application/json'
{"access_token":"eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJpZCIsImlhdCI6MTc1MzQ2NzE4OSwiZXhwIjoxNzUzNDc0Mzg5Ljg2NX0.7E1obwrXsIwe3WeUDcoJR7voVqn2WlTOru9c6yfdLaw","expires_in":7200,"token_type":"bearer"
```

## Run tests

```sh
npm run test

> test
> vitest


 DEV  v3.2.4 [...]

 ✓ test/core.test.ts (2 tests) 50ms
 ✓ test/integration/helloWorld.test.ts (2 tests) 60ms
 ✓ test/integration/clientCredentials.test.ts (7 tests) 42ms
 ✓ test/integration/credentialOffer.test.ts (10 tests) 35ms

 Test Files  2 passed (2)
      Tests  8 passed (8)
   Start at  18:33:14
   Duration  349ms (transform 69ms, setup 0ms, collect 279ms, tests 56ms, environment 0ms, prepare 102ms)

 PASS  Waiting for file changes...
```
