[**Documentation**](../../../../README.md)

***

[Documentation](../../../../README.md) / [server-core/src/statements](../README.md) / validateAuthorizationCode

# Function: validateAuthorizationCode()

> **validateAuthorizationCode**(`__namedParameters`, `config`): `Promise`\<\{ `authorization_code`: `string`; `code_challenge`: `string` \| `undefined`; `code_challenge_method`: `string` \| `undefined`; `scope`: `string`; `sub`: `string`; \}\>

Defined in: packages/server-core/src/statements/validations/validateAuthorizationCode.ts:13

## Parameters

### \_\_namedParameters

[`validateAuthorizationCodeParams`](../type-aliases/validateAuthorizationCodeParams.md)

### config

`DecryptConfig`

## Returns

`Promise`\<\{ `authorization_code`: `string`; `code_challenge`: `string` \| `undefined`; `code_challenge_method`: `string` \| `undefined`; `scope`: `string`; `sub`: `string`; \}\>
