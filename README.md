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
POST     /token
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
npm test

> test
> vitest


 DEV  v3.2.4 [...]

 ✓ test/integration/clientCredentials.monadic.test.ts (7 tests) 46ms
 ✓ test/integration/clientCredentials.functional.test.ts (7 tests) 46ms

 Test Files  2 passed (2)
      Tests  14 passed (14)
   Start at  11:31:24
   Duration  445ms (transform 157ms, setup 0ms, collect 440ms, tests 92ms, environment 0ms, prepare 98ms)

 PASS  Waiting for file changes...
```
