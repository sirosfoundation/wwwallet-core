[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [server-core/src](../README.md) / CredentialConfigurationSupported

# Type Alias: CredentialConfigurationSupported

> **CredentialConfigurationSupported** = `object`

Defined in: packages/server-core/src/resources.ts:88

## Properties

### credential\_signing\_alg\_values\_supported

> **credential\_signing\_alg\_values\_supported**: `string`[]

Defined in: packages/server-core/src/resources.ts:105

***

### cryptographic\_binding\_methods\_supported

> **cryptographic\_binding\_methods\_supported**: `string`[]

Defined in: packages/server-core/src/resources.ts:104

***

### description?

> `optional` **description**: `string`

Defined in: packages/server-core/src/resources.ts:93

***

### display

> **display**: `object`[]

Defined in: packages/server-core/src/resources.ts:94

#### background\_color?

> `optional` **background\_color**: `string`

#### background\_image?

> `optional` **background\_image**: `object`

##### background\_image.uri

> **uri**: `string`

#### description?

> `optional` **description**: `string`

#### locale

> **locale**: `string`

#### name

> **name**: `string`

#### text\_color?

> `optional` **text\_color**: `string`

***

### doctype?

> `optional` **doctype**: `string`

Defined in: packages/server-core/src/resources.ts:91

***

### format

> **format**: `string`

Defined in: packages/server-core/src/resources.ts:89

***

### proof\_types\_supported

> **proof\_types\_supported**: `object`

Defined in: packages/server-core/src/resources.ts:106

#### attestation?

> `optional` **attestation**: `object`

##### attestation.key\_attestations\_required

> **key\_attestations\_required**: `object`

##### attestation.proof\_signing\_alg\_values\_supported

> **proof\_signing\_alg\_values\_supported**: `string`[]

#### jwt?

> `optional` **jwt**: `object`

##### jwt.proof\_signing\_alg\_values\_supported

> **proof\_signing\_alg\_values\_supported**: `string`[]

***

### scope

> **scope**: `string`

Defined in: packages/server-core/src/resources.ts:92

***

### vct?

> `optional` **vct**: `string`

Defined in: packages/server-core/src/resources.ts:90
