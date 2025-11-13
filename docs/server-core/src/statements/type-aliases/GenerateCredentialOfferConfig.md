[**Documentation**](../../../../README.md)

***

[Documentation](../../../../README.md) / [server-core/src/statements](../README.md) / GenerateCredentialOfferConfig

# Type Alias: GenerateCredentialOfferConfig

> **GenerateCredentialOfferConfig** = `object`

Defined in: packages/server-core/src/statements/locations/generateCredentialOffer.ts:16

## Properties

### databaseOperations

> **databaseOperations**: `object`

Defined in: packages/server-core/src/statements/locations/generateCredentialOffer.ts:17

#### insertAuthorizationServerState()

> **insertAuthorizationServerState**: (`authorizationServerState`) => `Promise`\<[`AuthorizationServerState`](../../type-aliases/AuthorizationServerState.md)\>

##### Parameters

###### authorizationServerState

[`AuthorizationServerState`](../../type-aliases/AuthorizationServerState.md)

##### Returns

`Promise`\<[`AuthorizationServerState`](../../type-aliases/AuthorizationServerState.md)\>

***

### issuer\_url

> **issuer\_url**: `string`

Defined in: packages/server-core/src/statements/locations/generateCredentialOffer.ts:22

***

### supported\_credential\_configurations

> **supported\_credential\_configurations**: [`CredentialConfiguration`](../../type-aliases/CredentialConfiguration.md)[]

Defined in: packages/server-core/src/statements/locations/generateCredentialOffer.ts:24

***

### wallet\_url

> **wallet\_url**: `string`

Defined in: packages/server-core/src/statements/locations/generateCredentialOffer.ts:23
