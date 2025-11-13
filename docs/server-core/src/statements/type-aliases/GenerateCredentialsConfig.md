[**Documentation**](../../../../README.md)

***

[Documentation](../../../../README.md) / [server-core/src/statements](../README.md) / GenerateCredentialsConfig

# Type Alias: GenerateCredentialsConfig

> **GenerateCredentialsConfig** = `object`

Defined in: packages/server-core/src/statements/tokens/generateCredentials.ts:13

## Properties

### databaseOperations

> **databaseOperations**: `object`

Defined in: packages/server-core/src/statements/tokens/generateCredentials.ts:15

#### resourceOwnerData()

> **resourceOwnerData**: (`sub`, `vct?`) => `Promise`\<`unknown`\>

##### Parameters

###### sub

`string`

###### vct?

`string`

##### Returns

`Promise`\<`unknown`\>

***

### issuer\_url

> **issuer\_url**: `string`

Defined in: packages/server-core/src/statements/tokens/generateCredentials.ts:14

***

### supported\_credential\_configurations

> **supported\_credential\_configurations**: [`CredentialConfiguration`](../../type-aliases/CredentialConfiguration.md)[]

Defined in: packages/server-core/src/statements/tokens/generateCredentials.ts:18
