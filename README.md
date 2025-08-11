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
GET      /healthz
GET      /.well-known/oauth-authorization-server
GET      /.well-known/openid-credential-issuer
POST     /token
GET      /offer/:scope
==========
```

OR

```sh
$ docker compose up
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

 [...]

 Test Files  5 passed (5)
      Tests  22 passed (22)
   Start at  17:33:43
   Duration  753ms (transform 217ms, setup 0ms, collect 1.62s, tests 499ms, environment 1ms, prepare 392ms)
```

## Dependency tree

![dependency tree](images/dependency-tree.svg)
