# wwWallet issuer proof of concept

## Installation

```sh
npm ci
```

### Configuration

Server static configuration can be edited given the example `main.config.ts` [file](main.config.ts).

## Run a development server

```sh
$ npm start

> start
> ts-node --typeCheck --transpileOnly --project ./tsconfig.json ./app.ts

========== wwwallet issuer Proof of Concept listening to port 5000
GET      /
POST     /token
GET      /offer/:scope
==========
```

OR

```sh
$ docker compose up
[+] Running 1/0
 ✔ Container wwwallet-issuer-poc-wwwallet-issuer-poc-1  Created                                    0.0s
Attaching to wwwallet-issuer-poc-1
wwwallet-issuer-poc-1  |
wwwallet-issuer-poc-1  | > start
wwwallet-issuer-poc-1  | > ts-node --typeCheck --transpileOnly --project ./tsconfig.json ./main.ts
wwwallet-issuer-poc-1  |
wwwallet-issuer-poc-1  | ========== wwwallet issuer Proof of Concept listening to port 5000
wwwallet-issuer-poc-1  | GET      /
wwwallet-issuer-poc-1  | POST     /token
wwwallet-issuer-poc-1  | GET      /offer/:scope
wwwallet-issuer-poc-1  | ==========
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
 ✓ test/integration/helloWorld.test.ts (1 test) 14ms
 ✓ test/integration/clientCredentials.test.ts (7 tests) 42ms
 ✓ test/integration/credentialOffer.test.ts (10 tests) 35ms

 Test Files  2 passed (2)
      Tests  8 passed (8)
   Start at  18:33:14
   Duration  349ms (transform 69ms, setup 0ms, collect 279ms, tests 56ms, environment 0ms, prepare 102ms)

 PASS  Waiting for file changes...
```

## Dependency tree

![dependency tree](images/dependency-tree.svg)
