[**Documentation**](../../../../README.md)

***

[Documentation](../../../../README.md) / [client-core/src/statements](../README.md) / validateDcqlQuery

# Function: validateDcqlQuery()

> **validateDcqlQuery**(`__namedParameters`, `_config`): `Promise`\<\{ `dcql_query`: `null`; \} \| \{ `dcql_query`: \{ `credential_sets?`: `NonEmptyArray`\<\{ `options`: `NonEmptyArray`\<`string`[]\>; `purpose?`: `string` \| `number` \| \{\[`x`: `string`\]: `unknown`; \}; `required`: `boolean`; \}\>; `credentials`: `NonEmptyArray`\<\{ `claim_sets?`: `NonEmptyArray`\<`NonEmptyArray`\<`string`\>\>; `claims?`: `NonEmptyArray`\<\{ `claim_name`: ...; `id?`: ...; `namespace`: ...; `values?`: ...; \} \| \{ `id?`: ...; `intent_to_retain?`: ...; `path`: ...; `values?`: ...; \}\>; `format`: `"mso_mdoc"`; `id`: `string`; `meta?`: \{ `doctype_value?`: `string`; \}; `multiple`: `boolean`; `require_cryptographic_holder_binding`: `boolean`; `trusted_authorities?`: `NonEmptyArray`\<\{ `type`: ... \| ... \| ...; `values`: `NonEmptyArray`\<...\>; \}\>; \} \| \{ `claim_sets?`: `NonEmptyArray`\<`NonEmptyArray`\<`string`\>\>; `claims?`: `NonEmptyArray`\<\{ `id?`: ... \| ...; `path`: `NonEmptyArray`\<...\>; `values?`: ... \| ...; \}\>; `format`: `"vc+sd-jwt"` \| `"dc+sd-jwt"`; `id`: `string`; `meta?`: \{ `vct_values?`: ...[]; \}; `multiple`: `boolean`; `require_cryptographic_holder_binding`: `boolean`; `trusted_authorities?`: `NonEmptyArray`\<\{ `type`: ... \| ... \| ...; `values`: `NonEmptyArray`\<...\>; \}\>; \} \| \{ `claim_sets?`: `NonEmptyArray`\<`NonEmptyArray`\<`string`\>\>; `claims?`: `NonEmptyArray`\<\{ `id?`: ... \| ...; `path`: `NonEmptyArray`\<...\>; `values?`: ... \| ...; \}\>; `format`: `"jwt_vc_json"` \| `"ldp_vc"`; `id`: `string`; `meta`: \{ `type_values`: `NonEmptyArray`\<`NonEmptyArray`\<`string`\>\>; \}; `multiple`: `boolean`; `require_cryptographic_holder_binding`: `boolean`; `trusted_authorities?`: `NonEmptyArray`\<\{ `type`: ... \| ... \| ...; `values`: `NonEmptyArray`\<...\>; \}\>; \}\>; \}; \}\>

Defined in: packages/client-core/src/statements/validations/validateDcqlQuery.ts:10

## Parameters

### \_\_namedParameters

[`ValidateDcqlQueryParams`](../type-aliases/ValidateDcqlQueryParams.md)

### \_config

[`ValidateDcqlQueryConfig`](../type-aliases/ValidateDcqlQueryConfig.md)

## Returns

`Promise`\<\{ `dcql_query`: `null`; \} \| \{ `dcql_query`: \{ `credential_sets?`: `NonEmptyArray`\<\{ `options`: `NonEmptyArray`\<`string`[]\>; `purpose?`: `string` \| `number` \| \{\[`x`: `string`\]: `unknown`; \}; `required`: `boolean`; \}\>; `credentials`: `NonEmptyArray`\<\{ `claim_sets?`: `NonEmptyArray`\<`NonEmptyArray`\<`string`\>\>; `claims?`: `NonEmptyArray`\<\{ `claim_name`: ...; `id?`: ...; `namespace`: ...; `values?`: ...; \} \| \{ `id?`: ...; `intent_to_retain?`: ...; `path`: ...; `values?`: ...; \}\>; `format`: `"mso_mdoc"`; `id`: `string`; `meta?`: \{ `doctype_value?`: `string`; \}; `multiple`: `boolean`; `require_cryptographic_holder_binding`: `boolean`; `trusted_authorities?`: `NonEmptyArray`\<\{ `type`: ... \| ... \| ...; `values`: `NonEmptyArray`\<...\>; \}\>; \} \| \{ `claim_sets?`: `NonEmptyArray`\<`NonEmptyArray`\<`string`\>\>; `claims?`: `NonEmptyArray`\<\{ `id?`: ... \| ...; `path`: `NonEmptyArray`\<...\>; `values?`: ... \| ...; \}\>; `format`: `"vc+sd-jwt"` \| `"dc+sd-jwt"`; `id`: `string`; `meta?`: \{ `vct_values?`: ...[]; \}; `multiple`: `boolean`; `require_cryptographic_holder_binding`: `boolean`; `trusted_authorities?`: `NonEmptyArray`\<\{ `type`: ... \| ... \| ...; `values`: `NonEmptyArray`\<...\>; \}\>; \} \| \{ `claim_sets?`: `NonEmptyArray`\<`NonEmptyArray`\<`string`\>\>; `claims?`: `NonEmptyArray`\<\{ `id?`: ... \| ...; `path`: `NonEmptyArray`\<...\>; `values?`: ... \| ...; \}\>; `format`: `"jwt_vc_json"` \| `"ldp_vc"`; `id`: `string`; `meta`: \{ `type_values`: `NonEmptyArray`\<`NonEmptyArray`\<`string`\>\>; \}; `multiple`: `boolean`; `require_cryptographic_holder_binding`: `boolean`; `trusted_authorities?`: `NonEmptyArray`\<\{ `type`: ... \| ... \| ...; `values`: `NonEmptyArray`\<...\>; \}\>; \}\>; \}; \}\>
