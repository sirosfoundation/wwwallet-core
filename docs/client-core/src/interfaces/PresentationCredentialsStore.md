[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [client-core/src](../README.md) / PresentationCredentialsStore

# Interface: PresentationCredentialsStore

Defined in: packages/client-core/src/ports.ts:26

## Methods

### fromDcqlQuery()

> **fromDcqlQuery**(`dcql_query`): `Promise`\<[`PresentationCredential`](../type-aliases/PresentationCredential.md)[]\>

Defined in: packages/client-core/src/ports.ts:27

#### Parameters

##### dcql\_query

\{ `credential_sets?`: `NonEmptyArray`\<\{ `options`: `NonEmptyArray`\<`string`[]\>; `purpose?`: `string` \| `number` \| \{\[`x`: `string`\]: `unknown`; \}; `required`: `boolean`; \}\>; `credentials`: `NonEmptyArray`\<\{ `claim_sets?`: `NonEmptyArray`\<`NonEmptyArray`\<`string`\>\>; `claims?`: `NonEmptyArray`\<\{ `claim_name`: `string`; `id?`: `string`; `namespace`: `string`; `values?`: ...[]; \} \| \{ `id?`: `string`; `intent_to_retain?`: `boolean`; `path`: \[`string`, `string`\]; `values?`: ...[]; \}\>; `format`: `"mso_mdoc"`; `id`: `string`; `meta?`: \{ `doctype_value?`: `string`; \}; `multiple`: `boolean`; `require_cryptographic_holder_binding`: `boolean`; `trusted_authorities?`: `NonEmptyArray`\<\{ `type`: `"aki"` \| `"etsi_tl"` \| `"openid_federation"`; `values`: `NonEmptyArray`\<`string`\>; \}\>; \} \| \{ `claim_sets?`: `NonEmptyArray`\<`NonEmptyArray`\<`string`\>\>; `claims?`: `NonEmptyArray`\<\{ `id?`: `string`; `path`: `NonEmptyArray`\<`string` \| `number` \| `null`\>; `values?`: (... \| ... \| ... \| ...)[]; \}\>; `format`: `"vc+sd-jwt"` \| `"dc+sd-jwt"`; `id`: `string`; `meta?`: \{ `vct_values?`: `string`[]; \}; `multiple`: `boolean`; `require_cryptographic_holder_binding`: `boolean`; `trusted_authorities?`: `NonEmptyArray`\<\{ `type`: `"aki"` \| `"etsi_tl"` \| `"openid_federation"`; `values`: `NonEmptyArray`\<`string`\>; \}\>; \} \| \{ `claim_sets?`: `NonEmptyArray`\<`NonEmptyArray`\<`string`\>\>; `claims?`: `NonEmptyArray`\<\{ `id?`: `string`; `path`: `NonEmptyArray`\<`string` \| `number` \| `null`\>; `values?`: (... \| ... \| ... \| ...)[]; \}\>; `format`: `"jwt_vc_json"` \| `"ldp_vc"`; `id`: `string`; `meta`: \{ `type_values`: `NonEmptyArray`\<`NonEmptyArray`\<`string`\>\>; \}; `multiple`: `boolean`; `require_cryptographic_holder_binding`: `boolean`; `trusted_authorities?`: `NonEmptyArray`\<\{ `type`: `"aki"` \| `"etsi_tl"` \| `"openid_federation"`; `values`: `NonEmptyArray`\<`string`\>; \}\>; \}\>; \} | `null`

#### Returns

`Promise`\<[`PresentationCredential`](../type-aliases/PresentationCredential.md)[]\>
