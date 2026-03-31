# AGENTS.md

This file defines repository conventions for contributors and coding agents in `packages/client-core`.
Follow these rules when adding or changing handlers/statements.

## 1. Start From Templates

- Use [`src/handlers/_handler.template.ts`](./src/handlers/_handler.template.ts) for new handlers.
- Use [`src/statements/_statementTemplate.ts`](./src/statements/_statementTemplate.ts) for new statements.
- Keep the same flow shape:
  - typed `Params`/`Response`
  - `OauthError` wrapping with `currentStep` and `nextStep`
  - small units in handlers, logic in statements

## 2. Keep Logic In Statements

- Handlers should orchestrate only.
- Put reusable/security/protocol logic in `src/statements/**`.
- Prefer one statement per concern (fetch, validation, token, response build).

## 3. Handler Structure Rules

- One top-level handler file per entrypoint (`*.handler.ts`).
- For internal handler branches, keep subhandlers in `src/handlers/X/`.
- Subhandlers are plain functions `(params, config)` (no factory wrappers).
- Handler-specific config type must be declared in each handler file (no shared global handler config type).

## 4. Config Validation Rules

- Each handler has its own AJV schema in `src/handlers/schemas/`.
- Each handler file exposes its own `validateXHandlerConfig`.
- `Core` getter calls the matching validator before returning the handler.

## 5. Naming Rules (from current refactor decisions)

- Avoid `oauth`/`oidc` suffixes in filenames where not needed.
- Keep subhandlers filenames suffix-free:
  - `authorizationCode.ts`
  - `refreshToken.ts`
  - `clientCredentials.ts`
  - `password.ts`
- Prefer clear handler names:
  - `authorizationCodeHandler`
  - `refreshTokenHandler`
  - `clientCredentialsTokenHandler`
  - `passwordTokenHandler`

## 6. Token/DPoP Rules

- Token statement lives in [`src/statements/tokens/fetchToken.ts`](./src/statements/tokens/fetchToken.ts).
- Support grant handlers via dedicated token subhandlers.
- Use [`generateDpop`](./src/statements/tokens/generateDpop.ts) directly in token subhandlers.
- If a `dpop` value is provided by caller, `generateDpop` must return it as-is.

## 7. Core API Rules

- Keep `Core` as the public entrypoint.
- Expose one getter per major handler step.
- Preserve existing public shape unless intentionally versioned.

## 8. Tests Are Mandatory

- Add/update integration tests in `test/integration/`.
- Scope token tests per grant type.
- Cover both:
  - success path
  - error paths (missing params + upstream failures)
- Any behavior refactor must keep tests green with `pnpm test`.

## 9. Before Finalizing Changes

- Update barrel exports (`src/handlers/index.ts`, `src/statements/**/index.ts`) when adding files.
- Confirm no stale import paths remain after renames.
- Run:

```sh
pnpm test
```

- Run:

```sh
pnpm biome:ci
```

- Run:

```sh
pnpm build
```

## 10. Commit Message Style

- Use bracketed scope commit subjects: `[scope] summary`.
- Keep summaries imperative and concise.
- Match existing repository scopes when possible (for example: `[server-core]`, `[docs]`).

## 11. Protocol Type Naming Rules

- Name protocol payload types with protocol-scoped prefixes (for example: `XxxRequest`, `XxxResponse`).
- Keep handler return type names distinct from shared resource/port payload types to avoid export collisions.
- Apply the same naming consistently across `src/resources.ts`, `src/ports.ts`, handlers, and tests.

## 12. Protocol Configuration Rules

- Protocol-specific token claims or identity values must come from config, not hardcoded defaults.
- Validate all required protocol-specific config fields in the matching handler schema.
- Fail fast with `invalid_client` when mandatory protocol configuration is missing.

## 13. Handler Branching Rules

- Branch detection must live in explicit helper functions (`isXxxBranch` / `isXxxLocation` / `isXxxRequest`).
- Add new branches with deterministic ordering and no ambiguous overlap.
- Keep branching logic in handlers/subhandlers and reusable validation/business rules in statements.
- For branch-specific parsing, keep parsing close to the relevant subhandler and keep reusable validation in `src/statements/**`.
