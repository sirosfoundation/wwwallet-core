[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [server-core/src](../README.md) / Core

# Class: Core

Defined in: packages/server-core/src/core.ts:37

wwWallet server Core class.

Core is the entrypoint of OAuth 2.0 family protocols server implementation.
It exposes the request handlers to be used to manage protocols at server level.

## Constructors

### Constructor

> **new Core**(`config`): `Core`

Defined in: packages/server-core/src/core.ts:40

#### Parameters

##### config

[`Config`](../type-aliases/Config.md)

#### Returns

`Core`

## Properties

### config

> **config**: [`Config`](../type-aliases/Config.md)

Defined in: packages/server-core/src/core.ts:38

## Accessors

### authorize

#### Get Signature

> **get** **authorize**(): (`expressRequest`, `resourceOwner`) => `Promise`\<[`OauthErrorResponse`](../type-aliases/OauthErrorResponse.md) \| [`AuthorizeResponse`](../type-aliases/AuthorizeResponse.md)\>

Defined in: packages/server-core/src/core.ts:77

##### Returns

> (`expressRequest`, `resourceOwner`): `Promise`\<[`OauthErrorResponse`](../type-aliases/OauthErrorResponse.md) \| [`AuthorizeResponse`](../type-aliases/AuthorizeResponse.md)\>

###### Parameters

###### expressRequest

`Request`

###### resourceOwner

[`ResourceOwner`](../type-aliases/ResourceOwner.md) | `null`

###### Returns

`Promise`\<[`OauthErrorResponse`](../type-aliases/OauthErrorResponse.md) \| [`AuthorizeResponse`](../type-aliases/AuthorizeResponse.md)\>

***

### credential

#### Get Signature

> **get** **credential**(): (`expressRequest`) => `Promise`\<[`OauthErrorResponse`](../type-aliases/OauthErrorResponse.md) \| [`CredentialResponse`](../type-aliases/CredentialResponse.md)\>

Defined in: packages/server-core/src/core.ts:89

##### Returns

> (`expressRequest`): `Promise`\<[`OauthErrorResponse`](../type-aliases/OauthErrorResponse.md) \| [`CredentialResponse`](../type-aliases/CredentialResponse.md)\>

###### Parameters

###### expressRequest

`Request`

###### Returns

`Promise`\<[`OauthErrorResponse`](../type-aliases/OauthErrorResponse.md) \| [`CredentialResponse`](../type-aliases/CredentialResponse.md)\>

***

### credentialOffer

#### Get Signature

> **get** **credentialOffer**(): (`expressRequest`) => `Promise`\<[`OauthErrorResponse`](../type-aliases/OauthErrorResponse.md) \| `CredentialOfferResponse`\>

Defined in: packages/server-core/src/core.ts:95

##### Returns

> (`expressRequest`): `Promise`\<[`OauthErrorResponse`](../type-aliases/OauthErrorResponse.md) \| `CredentialOfferResponse`\>

###### Parameters

###### expressRequest

`Request`

###### Returns

`Promise`\<[`OauthErrorResponse`](../type-aliases/OauthErrorResponse.md) \| `CredentialOfferResponse`\>

***

### nonce

#### Get Signature

> **get** **nonce**(): (`_expressRequest`) => `Promise`\<[`OauthErrorResponse`](../type-aliases/OauthErrorResponse.md) \| [`NonceResponse`](../type-aliases/NonceResponse.md)\>

Defined in: packages/server-core/src/core.ts:63

##### Returns

> (`_expressRequest`): `Promise`\<[`OauthErrorResponse`](../type-aliases/OauthErrorResponse.md) \| [`NonceResponse`](../type-aliases/NonceResponse.md)\>

###### Parameters

###### \_expressRequest

`Request`

###### Returns

`Promise`\<[`OauthErrorResponse`](../type-aliases/OauthErrorResponse.md) \| [`NonceResponse`](../type-aliases/NonceResponse.md)\>

***

### oauthAuthorizationServer

#### Get Signature

> **get** **oauthAuthorizationServer**(): (`_expressRequest`) => `Promise`\<[`OauthAuthorizationServerResponse`](../type-aliases/OauthAuthorizationServerResponse.md)\>

Defined in: packages/server-core/src/core.ts:47

##### Returns

> (`_expressRequest`): `Promise`\<[`OauthAuthorizationServerResponse`](../type-aliases/OauthAuthorizationServerResponse.md)\>

###### Parameters

###### \_expressRequest

`Request`

###### Returns

`Promise`\<[`OauthAuthorizationServerResponse`](../type-aliases/OauthAuthorizationServerResponse.md)\>

***

### openidCredentialIssuer

#### Get Signature

> **get** **openidCredentialIssuer**(): (`_expressRequest`) => `Promise`\<[`OpenidCredentialIssuerResponse`](../type-aliases/OpenidCredentialIssuerResponse.md)\>

Defined in: packages/server-core/src/core.ts:55

##### Returns

> (`_expressRequest`): `Promise`\<[`OpenidCredentialIssuerResponse`](../type-aliases/OpenidCredentialIssuerResponse.md)\>

###### Parameters

###### \_expressRequest

`Request`

###### Returns

`Promise`\<[`OpenidCredentialIssuerResponse`](../type-aliases/OpenidCredentialIssuerResponse.md)\>

***

### pushedAuthorizationRequest

#### Get Signature

> **get** **pushedAuthorizationRequest**(): (`expressRequest`) => `Promise`\<[`OauthErrorResponse`](../type-aliases/OauthErrorResponse.md) \| [`PushedAuthorizationRequestResponse`](../type-aliases/PushedAuthorizationRequestResponse.md)\>

Defined in: packages/server-core/src/core.ts:69

##### Returns

> (`expressRequest`): `Promise`\<[`OauthErrorResponse`](../type-aliases/OauthErrorResponse.md) \| [`PushedAuthorizationRequestResponse`](../type-aliases/PushedAuthorizationRequestResponse.md)\>

###### Parameters

###### expressRequest

`Request`

###### Returns

`Promise`\<[`OauthErrorResponse`](../type-aliases/OauthErrorResponse.md) \| [`PushedAuthorizationRequestResponse`](../type-aliases/PushedAuthorizationRequestResponse.md)\>

***

### token

#### Get Signature

> **get** **token**(): (`expressRequest`) => `Promise`\<[`OauthErrorResponse`](../type-aliases/OauthErrorResponse.md) \| [`TokenResponse`](../type-aliases/TokenResponse.md)\>

Defined in: packages/server-core/src/core.ts:83

##### Returns

> (`expressRequest`): `Promise`\<[`OauthErrorResponse`](../type-aliases/OauthErrorResponse.md) \| [`TokenResponse`](../type-aliases/TokenResponse.md)\>

###### Parameters

###### expressRequest

`Request`

###### Returns

`Promise`\<[`OauthErrorResponse`](../type-aliases/OauthErrorResponse.md) \| [`TokenResponse`](../type-aliases/TokenResponse.md)\>

## Methods

### rotateSecret()

> **rotateSecret**(): `Promise`\<`void`\>

Defined in: packages/server-core/src/core.ts:103

#### Returns

`Promise`\<`void`\>
