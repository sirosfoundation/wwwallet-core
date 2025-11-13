[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [client-core/src](../README.md) / ClientStateStore

# Interface: ClientStateStore

Defined in: packages/client-core/src/ports.ts:10

## Methods

### cleanupExpired()?

> `optional` **cleanupExpired**(): `Promise`\<`void`\>

Defined in: packages/client-core/src/ports.ts:13

#### Returns

`Promise`\<`void`\>

***

### commitChanges()

> **commitChanges**(`clientState`): `Promise`\<[`ClientState`](../type-aliases/ClientState.md)\>

Defined in: packages/client-core/src/ports.ts:12

#### Parameters

##### clientState

[`ClientState`](../type-aliases/ClientState.md)

#### Returns

`Promise`\<[`ClientState`](../type-aliases/ClientState.md)\>

***

### create()

> **create**(`issuer`, `issuer_state`): `Promise`\<[`ClientState`](../type-aliases/ClientState.md)\>

Defined in: packages/client-core/src/ports.ts:11

#### Parameters

##### issuer

`string`

##### issuer\_state

`string`

#### Returns

`Promise`\<[`ClientState`](../type-aliases/ClientState.md)\>

***

### fromIssuerState()

> **fromIssuerState**(`issuer`, `issuer_state`): `Promise`\<[`ClientState`](../type-aliases/ClientState.md)\>

Defined in: packages/client-core/src/ports.ts:14

#### Parameters

##### issuer

`string`

##### issuer\_state

`string`

#### Returns

`Promise`\<[`ClientState`](../type-aliases/ClientState.md)\>

***

### fromState()

> **fromState**(`state`): `Promise`\<[`ClientState`](../type-aliases/ClientState.md)\>

Defined in: packages/client-core/src/ports.ts:15

#### Parameters

##### state

`string`

#### Returns

`Promise`\<[`ClientState`](../type-aliases/ClientState.md)\>

***

### setCredentialConfigurationIds()

> **setCredentialConfigurationIds**(`clientState`, `credentialConfigurationIds`): `Promise`\<[`ClientState`](../type-aliases/ClientState.md)\>

Defined in: packages/client-core/src/ports.ts:16

#### Parameters

##### clientState

[`ClientState`](../type-aliases/ClientState.md)

##### credentialConfigurationIds

`string`[]

#### Returns

`Promise`\<[`ClientState`](../type-aliases/ClientState.md)\>

***

### setIssuerMetadata()

> **setIssuerMetadata**(`clientState`, `issuerMetadata`): `Promise`\<[`ClientState`](../type-aliases/ClientState.md)\>

Defined in: packages/client-core/src/ports.ts:20

#### Parameters

##### clientState

[`ClientState`](../type-aliases/ClientState.md)

##### issuerMetadata

[`IssuerMetadata`](../type-aliases/IssuerMetadata.md)

#### Returns

`Promise`\<[`ClientState`](../type-aliases/ClientState.md)\>
