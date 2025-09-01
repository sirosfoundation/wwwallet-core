# wwWallet issuer proof of concept

## Installation

```sh
$ pnpm install
```

### Configuration

Server static configuration can be edited given the example `config.ts` [file](./apps/client/config.ts).

## Run a development server

```sh
$ pnpm run dev
```

> [!NOTE]
> If you're working with a fresh clone of the repo or haven't run any builds, you need to run an initial build of all [packages](./packages):
> ```sh
> $ pnpm run build
> ```

Or with Docker:

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

## Run load tests

In order to perform load tests, here [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) is used to simulate user requests.

```sh
$ k6 run scripts/loadtest.oid4vci.k6.js
```

Or with Docker:

```sh
$ docker compose up k6 --no-log-prefix
```

## Running pnpm commands for a individual package
```sh
$ pnpm --filter [PACKAGE NAME] [COMMAND ...]
# Example:
# pnpm --filter @wwwallet-private/core add -D vitest
```

## Changelog and versioning

Please read [./.changeset/README.md](./.changeset/README.md) For information about changelog and versioning.

## Dependency tree

```sh
$ pnpm dependency-tree
```

### Client application

![dependency tree](images/apps-client-dependency-tree.svg)

---

### Core package

![dependency tree](images/packages-core-dependency-tree.svg)
