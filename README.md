# wwWallet issuer proof of concept

## Installation

```sh
npm ci
```

### Configuration

Server static configuration can be edited given the example `config.ts` [file](./apps/client/config.ts).

## Run a development server

```sh
$ pnpm start
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
$ pnpm test
```

## Running pnpm commands for a individual package
```sh
$ pnpm --filter [PACKAGE NAME] [COMMAND ...]
# Example:
# pnpm --filter @wwwallet/core add -D vitest
```

## Dependency tree

![dependency tree](images/dependency-tree.svg)
