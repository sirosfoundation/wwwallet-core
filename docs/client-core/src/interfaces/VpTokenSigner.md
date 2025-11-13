[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [client-core/src](../README.md) / VpTokenSigner

# Interface: VpTokenSigner

Defined in: packages/client-core/src/ports.ts:32

## Methods

### encryptResponse()?

> `optional` **encryptResponse**(`response`, `presentation_request`): `Promise`\<`string`\>

Defined in: packages/client-core/src/ports.ts:37

#### Parameters

##### response

[`PresentationResponse`](../type-aliases/PresentationResponse.md)

##### presentation\_request

[`PresentationRequest`](../type-aliases/PresentationRequest.md)

#### Returns

`Promise`\<`string`\>

***

### sign()?

> `optional` **sign**(`payload`, `presentation_request`): `Promise`\<`string`\>

Defined in: packages/client-core/src/ports.ts:33

#### Parameters

##### payload

`Record`\<`string`, `string`[]\>

##### presentation\_request

[`PresentationRequest`](../type-aliases/PresentationRequest.md)

#### Returns

`Promise`\<`string`\>
