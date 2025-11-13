[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [server-core/src](../README.md) / Config

# Type Alias: Config

> **Config** = `object`

Defined in: packages/server-core/src/config.ts:32

## Properties

### access\_token\_ttl?

> `optional` **access\_token\_ttl**: `number`

Defined in: packages/server-core/src/config.ts:73

***

### authorization\_code\_ttl?

> `optional` **authorization\_code\_ttl**: `number`

Defined in: packages/server-core/src/config.ts:75

***

### clients?

> `optional` **clients**: `object`[]

Defined in: packages/server-core/src/config.ts:44

#### id

> **id**: `string`

#### redirect\_uris?

> `optional` **redirect\_uris**: `string`[]

#### scopes

> **scopes**: `string`[]

#### secret?

> `optional` **secret**: `string`

***

### databaseOperations?

> `optional` **databaseOperations**: [`DatabaseOperations`](../interfaces/DatabaseOperations.md)

Defined in: packages/server-core/src/config.ts:36

***

### issuer\_client?

> `optional` **issuer\_client**: `object`

Defined in: packages/server-core/src/config.ts:50

#### id?

> `optional` **id**: `string`

#### scopes

> **scopes**: `string`[]

***

### issuer\_display?

> `optional` **issuer\_display**: `object`[]

Defined in: packages/server-core/src/config.ts:37

#### locale?

> `optional` **locale**: `string`

#### logo?

> `optional` **logo**: `object`

##### logo.uri

> **uri**: `string`

#### name

> **name**: `string`

***

### issuer\_state\_ttl?

> `optional` **issuer\_state\_ttl**: `number`

Defined in: packages/server-core/src/config.ts:76

***

### issuer\_url?

> `optional` **issuer\_url**: `string`

Defined in: packages/server-core/src/config.ts:33

***

### logger?

> `optional` **logger**: [`Logger`](../interfaces/Logger.md)

Defined in: packages/server-core/src/config.ts:35

***

### previous\_secrets?

> `optional` **previous\_secrets**: `string`[]

Defined in: packages/server-core/src/config.ts:81

***

### pushed\_authorization\_request\_ttl?

> `optional` **pushed\_authorization\_request\_ttl**: `number`

Defined in: packages/server-core/src/config.ts:74

***

### rotate\_secret?

> `optional` **rotate\_secret**: `boolean`

Defined in: packages/server-core/src/config.ts:82

***

### secret?

> `optional` **secret**: `string`

Defined in: packages/server-core/src/config.ts:79

***

### secret\_base?

> `optional` **secret\_base**: `string`

Defined in: packages/server-core/src/config.ts:80

***

### secret\_ttl?

> `optional` **secret\_ttl**: `number`

Defined in: packages/server-core/src/config.ts:77

***

### supported\_credential\_configuration\_paths?

> `optional` **supported\_credential\_configuration\_paths**: `string`[]

Defined in: packages/server-core/src/config.ts:54

***

### supported\_credential\_configurations?

> `optional` **supported\_credential\_configurations**: `object`[]

Defined in: packages/server-core/src/config.ts:55

#### credential\_configuration\_id

> **credential\_configuration\_id**: `string`

#### display

> **display**: `object`[]

#### doctype?

> `optional` **doctype**: `string`

#### format

> **format**: `string`

#### label?

> `optional` **label**: `string`

#### scope

> **scope**: `string`

#### vct?

> `optional` **vct**: `string`

***

### token\_encryption?

> `optional` **token\_encryption**: `string`

Defined in: packages/server-core/src/config.ts:78

***

### trusted\_root\_certificate\_paths?

> `optional` **trusted\_root\_certificate\_paths**: `string`[]

Defined in: packages/server-core/src/config.ts:84

***

### trusted\_root\_certificates?

> `optional` **trusted\_root\_certificates**: `string`[]

Defined in: packages/server-core/src/config.ts:83

***

### wallet\_url?

> `optional` **wallet\_url**: `string`

Defined in: packages/server-core/src/config.ts:34
