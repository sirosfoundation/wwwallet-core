[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [server-core/src](../README.md) / defaultConfig

# Variable: defaultConfig

> `const` **defaultConfig**: `object`

Defined in: packages/server-core/src/core.ts:127

## Type Declaration

### access\_token\_ttl

> **access\_token\_ttl**: `number` = `60`

### authorization\_code\_ttl

> **authorization\_code\_ttl**: `number` = `60`

### clients

> **clients**: `never`[] = `[]`

### databaseOperations

> **databaseOperations**: `object` = `{}`

### issuer\_client

> **issuer\_client**: `object`

#### issuer\_client.id

> **id**: `string` = `""`

#### issuer\_client.scopes

> **scopes**: `never`[] = `[]`

### issuer\_display

> **issuer\_display**: `never`[] = `[]`

### issuer\_state\_ttl

> **issuer\_state\_ttl**: `number` = `300`

### logger

> **logger**: `object`

#### logger.business()

> **business**: (`event`, `data`) => `void`

##### Parameters

###### event

`string`

###### data

##### Returns

`void`

#### logger.debug()

> **debug**: \{(...`data`): `void`; (`message?`, ...`optionalParams`): `void`; \} = `console.debug`

##### Call Signature

> (...`data`): `void`

The **`console.debug()`** static method outputs a message to the console at the 'debug' log level.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/console/debug_static)

###### Parameters

###### data

...`any`[]

###### Returns

`void`

##### Call Signature

> (`message?`, ...`optionalParams?`): `void`

The `console.debug()` function is an alias for log.

###### Parameters

###### message?

`any`

###### optionalParams?

...`any`[]

###### Returns

`void`

###### Since

v8.0.0

#### logger.error()

> **error**: \{(...`data`): `void`; (`message?`, ...`optionalParams`): `void`; \} = `console.error`

##### Call Signature

> (...`data`): `void`

The **`console.error()`** static method outputs a message to the console at the 'error' log level.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/console/error_static)

###### Parameters

###### data

...`any`[]

###### Returns

`void`

##### Call Signature

> (`message?`, ...`optionalParams?`): `void`

Prints to `stderr` with newline. Multiple arguments can be passed, with the
first used as the primary message and all additional used as substitution
values similar to [`printf(3)`](http://man7.org/linux/man-pages/man3/printf.3.html)
(the arguments are all passed to [`util.format()`](https://nodejs.org/docs/latest-v24.x/api/util.html#utilformatformat-args)).

```js
const code = 5;
console.error('error #%d', code);
// Prints: error #5, to stderr
console.error('error', code);
// Prints: error 5, to stderr
```

If formatting elements (e.g. `%d`) are not found in the first string then
[`util.inspect()`](https://nodejs.org/docs/latest-v24.x/api/util.html#utilinspectobject-options) is called on each argument and the
resulting string values are concatenated. See [`util.format()`](https://nodejs.org/docs/latest-v24.x/api/util.html#utilformatformat-args)
for more information.

###### Parameters

###### message?

`any`

###### optionalParams?

...`any`[]

###### Returns

`void`

###### Since

v0.1.100

#### logger.info()

> **info**: \{(...`data`): `void`; (`message?`, ...`optionalParams`): `void`; \} = `console.info`

##### Call Signature

> (...`data`): `void`

The **`console.info()`** static method outputs a message to the console at the 'info' log level.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/console/info_static)

###### Parameters

###### data

...`any`[]

###### Returns

`void`

##### Call Signature

> (`message?`, ...`optionalParams?`): `void`

The `console.info()` function is an alias for log.

###### Parameters

###### message?

`any`

###### optionalParams?

...`any`[]

###### Returns

`void`

###### Since

v0.1.100

#### logger.warn()

> **warn**: \{(...`data`): `void`; (`message?`, ...`optionalParams`): `void`; \} = `console.warn`

##### Call Signature

> (...`data`): `void`

The **`console.warn()`** static method outputs a warning message to the console at the 'warning' log level.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/console/warn_static)

###### Parameters

###### data

...`any`[]

###### Returns

`void`

##### Call Signature

> (`message?`, ...`optionalParams?`): `void`

The `console.warn()` function is an alias for [error](#logger).

###### Parameters

###### message?

`any`

###### optionalParams?

...`any`[]

###### Returns

`void`

###### Since

v0.1.100

### previous\_secrets

> **previous\_secrets**: `never`[] = `[]`

### pushed\_authorization\_request\_ttl

> **pushed\_authorization\_request\_ttl**: `number` = `300`

### rotate\_secret

> **rotate\_secret**: `boolean` = `false`

### secret\_ttl

> **secret\_ttl**: `number` = `720`

### supported\_credential\_configurations

> **supported\_credential\_configurations**: `never`[] = `[]`

### token\_encryption

> **token\_encryption**: `string` = `"A128CBC-HS256"`

### trusted\_root\_certificates

> **trusted\_root\_certificates**: `never`[] = `[]`
