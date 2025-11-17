# wwWallet core

wwWallet core is a set of packages to suppport the implementation of issuers / wallets / verifiers required logic to manage authorization grants up to verifiable credentials in a secure and privacy preserving way.

- [@wwwallet/client-core](./packages/client-core/README.md)
- [@wwwallet/server-core](./packages/server-core/README.md)

## Installation

```sh
pnpm install
```

### Configuration

Server static configuration can be edited given the example `config.yml` [file](./apps/client/config.yml).

## Run an example issuer

```sh
pnpm run start:client
```

Or with Docker:

```sh
docker compose up
```

### client credentials implementation

This server exposes a token endpoint implementing client credentials, those are checked against the clients registered in the configuration. Requesting the server using cURL, you obtain an access token (or an error) following the OAuth 2.0 specification.

```sh
curl -X POST http://localhost:5000/token \
	--data '{"client_id": "CLIENT123", "client_secret": "321TNEILC", "scope": "client:scope", "grant_type": "client_credentials"}' \
	-H 'Content-Type: application/json'
{"access_token":"eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIn0..BkXrAwHsE0Br1nxUkvezLw.Bq3JWgmHgZfI-RVK_NVu79PJqB0cqqqO9GBc5uMmMLekxmEEnGe1wetR6jAHFSjSVFVUZ2SNXBoe49eeucHfYPOrdKg-j-v1AVx8EKvl4CUhX6F_Z09d_ZYJ1Yw_d3Cnd9rND1nCbv0DLi56w8h6VN7GBDLfAwikCB6RHAHJNMwfinLo6LHqnY1fBde1dPkh.YH3pGiwkHRaNmG14tGdimjWmR66ixHsZ1QTjmUz0_24","expires_in":60,"token_type":"bearer"}
```

## Run tests

```sh
pnpm test
```

## Run load tests

In order to perform load tests, here [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) is used to simulate user requests.

```sh
k6 run scripts/loadtest.oid4vci.k6.js
```

Or with Docker:

```sh
docker compose up k6 --no-log-prefix
```

## Documentation

A reference documentation can be generated from command line which would be accessible at `docs/index.html`. The master branch doccumentation is available at [https://sirosfoundation.github.io/wwwallet-core/](https://sirosfoundation.github.io/wwwallet-core/)

```sh
pnpm run documentation:start
```

## Running pnpm commands for a individual package
```sh
pnpm --filter [PACKAGE NAME] [COMMAND ...]
# Example:
# pnpm --filter @wwwallet/server-core add -D vitest
```

## Changelog and versioning

Please read [./.changeset/README.md](./.changeset/README.md) For information about changelog and versioning.

## Dependency tree

```sh
pnpm run dependency-tree
```

Generated dependency trees are available [here](./dependency-tree/README.md)

## License

The source code is released under a [BSD-2 clause license](./LICENSE)