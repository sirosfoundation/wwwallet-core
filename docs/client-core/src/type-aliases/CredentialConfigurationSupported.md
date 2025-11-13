[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [client-core/src](../README.md) / CredentialConfigurationSupported

# Type Alias: CredentialConfigurationSupported

> **CredentialConfigurationSupported** = `object`

Defined in: packages/client-core/src/resources.ts:57

## Properties

### credential\_signing\_alg\_values\_supported

> **credential\_signing\_alg\_values\_supported**: `string`[]

Defined in: packages/client-core/src/resources.ts:74

***

### cryptographic\_binding\_methods\_supported

> **cryptographic\_binding\_methods\_supported**: `string`[]

Defined in: packages/client-core/src/resources.ts:73

***

### description?

> `optional` **description**: `string`

Defined in: packages/client-core/src/resources.ts:62

***

### display

> **display**: `object`[]

Defined in: packages/client-core/src/resources.ts:63

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

Defined in: packages/client-core/src/resources.ts:60

***

### format

> **format**: `string`

Defined in: packages/client-core/src/resources.ts:58

***

### proof\_types\_supported

> **proof\_types\_supported**: `object`

Defined in: packages/client-core/src/resources.ts:75

#### attestation

> **attestation**: `object`

##### attestation.key\_attestations\_required

> **key\_attestations\_required**: `object`

##### attestation.proof\_signing\_alg\_values\_supported

> **proof\_signing\_alg\_values\_supported**: `string`[]

#### jwt

> **jwt**: `object`

##### jwt.proof\_signing\_alg\_values\_supported

> **proof\_signing\_alg\_values\_supported**: `string`[]

***

### scope

> **scope**: `string`

Defined in: packages/client-core/src/resources.ts:61

***

### vct?

> `optional` **vct**: `string`

Defined in: packages/client-core/src/resources.ts:59
