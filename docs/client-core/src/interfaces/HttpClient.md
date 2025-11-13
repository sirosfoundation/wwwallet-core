[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [client-core/src](../README.md) / HttpClient

# Interface: HttpClient

Defined in: packages/client-core/src/ports.ts:43

## Properties

### get()

> **get**: \<`T`\>(`url`) => `Promise`\<\{ `data`: `T`; \}\>

Defined in: packages/client-core/src/ports.ts:44

#### Type Parameters

##### T

`T`

#### Parameters

##### url

`string`

#### Returns

`Promise`\<\{ `data`: `T`; \}\>

***

### post()

> **post**: \<`T`\>(`url`, `body?`, `config?`) => `Promise`\<\{ `data`: `T`; \}\>

Defined in: packages/client-core/src/ports.ts:45

#### Type Parameters

##### T

`T`

#### Parameters

##### url

`string`

##### body?

`unknown`

##### config?

###### headers

`Record`\<`string`, `string`\>

#### Returns

`Promise`\<\{ `data`: `T`; \}\>
