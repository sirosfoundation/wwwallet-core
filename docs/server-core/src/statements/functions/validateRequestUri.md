[**Documentation**](../../../../README.md)

***

[Documentation](../../../../README.md) / [server-core/src/statements](../README.md) / validateRequestUri

# Function: validateRequestUri()

> **validateRequestUri**(`__namedParameters`, `config`): `Promise`\<\{ `authorization_request`: \{ `client_id`: `string`; `code_challenge`: `string` \| `undefined`; `code_challenge_method`: `string` \| `undefined`; `issuer_state`: `string` \| `undefined`; `redirect_uri`: `string`; `response_type`: `string`; `scope`: `string` \| `undefined`; `state`: `string` \| `undefined`; \}; `request_uri`: `string`; \}\>

Defined in: packages/server-core/src/statements/validations/validateRequestUri.ts:12

## Parameters

### \_\_namedParameters

[`validateRequestUriParams`](../type-aliases/validateRequestUriParams.md)

### config

`DecryptConfig`

## Returns

`Promise`\<\{ `authorization_request`: \{ `client_id`: `string`; `code_challenge`: `string` \| `undefined`; `code_challenge_method`: `string` \| `undefined`; `issuer_state`: `string` \| `undefined`; `redirect_uri`: `string`; `response_type`: `string`; `scope`: `string` \| `undefined`; `state`: `string` \| `undefined`; \}; `request_uri`: `string`; \}\>
