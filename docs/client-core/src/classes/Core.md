[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [client-core/src](../README.md) / Core

# Class: Core

Defined in: packages/client-core/src/core.ts:27

wwWallet client Core class.

Core is the entrypoint of OAuth 2.0 family protocols client implementation.
It exposes the request handlers to be used to manage protocols at client level.

## Constructors

### Constructor

> **new Core**(`config`): `Core`

Defined in: packages/client-core/src/core.ts:30

#### Parameters

##### config

[`Config`](../type-aliases/Config.md)

#### Returns

`Core`

## Properties

### config

> **config**: [`Config`](../type-aliases/Config.md)

Defined in: packages/client-core/src/core.ts:28

## Accessors

### authorization

#### Get Signature

> **get** **authorization**(): (`__namedParameters`) => `Promise`\<[`AuthorizationResponse`](../type-aliases/AuthorizationResponse.md)\>

Defined in: packages/client-core/src/core.ts:46

##### Throws

An [OauthError](OauthError.md) error

##### Returns

> (`__namedParameters`): `Promise`\<[`AuthorizationResponse`](../type-aliases/AuthorizationResponse.md)\>

###### Parameters

###### \_\_namedParameters

[`AuthorizationHandlerParams`](../type-aliases/AuthorizationHandlerParams.md)

###### Returns

`Promise`\<[`AuthorizationResponse`](../type-aliases/AuthorizationResponse.md)\>

***

### credential

#### Get Signature

> **get** **credential**(): (`__namedParameters`) => `Promise`\<[`CredentialResponse`](../type-aliases/CredentialResponse.md)\>

Defined in: packages/client-core/src/core.ts:57

##### Throws

An [OauthError](OauthError.md) error

##### Returns

> (`__namedParameters`): `Promise`\<[`CredentialResponse`](../type-aliases/CredentialResponse.md)\>

###### Parameters

###### \_\_namedParameters

[`CredentialHandlerParams`](../type-aliases/CredentialHandlerParams.md)

###### Returns

`Promise`\<[`CredentialResponse`](../type-aliases/CredentialResponse.md)\>

***

### generatePresentation

#### Get Signature

> **get** **generatePresentation**(): (`__namedParameters`) => `Promise`\<[`GeneratePresentationResponse`](../type-aliases/GeneratePresentationResponse.md)\>

Defined in: packages/client-core/src/core.ts:66

##### Throws

An [OauthError](OauthError.md) error

##### Returns

> (`__namedParameters`): `Promise`\<[`GeneratePresentationResponse`](../type-aliases/GeneratePresentationResponse.md)\>

###### Parameters

###### \_\_namedParameters

[`GeneratePresentationParams`](../type-aliases/GeneratePresentationParams.md)

###### Returns

`Promise`\<[`GeneratePresentationResponse`](../type-aliases/GeneratePresentationResponse.md)\>

***

### location

#### Get Signature

> **get** **location**(): (`windowLocation`) => `Promise`\<[`LocationResponse`](../type-aliases/LocationResponse.md)\>

Defined in: packages/client-core/src/core.ts:37

##### Throws

An [OauthError](OauthError.md) error

##### Returns

> (`windowLocation`): `Promise`\<[`LocationResponse`](../type-aliases/LocationResponse.md)\>

###### Parameters

###### windowLocation

`Location`

###### Returns

`Promise`\<[`LocationResponse`](../type-aliases/LocationResponse.md)\>

***

### sendPresentation

#### Get Signature

> **get** **sendPresentation**(): (`__namedParameters`) => `Promise`\<[`SendPresentationResponse`](../type-aliases/SendPresentationResponse.md)\>

Defined in: packages/client-core/src/core.ts:77

##### Throws

An [OauthError](OauthError.md) error

##### Returns

> (`__namedParameters`): `Promise`\<[`SendPresentationResponse`](../type-aliases/SendPresentationResponse.md)\>

###### Parameters

###### \_\_namedParameters

[`SendPresentationParams`](../type-aliases/SendPresentationParams.md)

###### Returns

`Promise`\<[`SendPresentationResponse`](../type-aliases/SendPresentationResponse.md)\>
