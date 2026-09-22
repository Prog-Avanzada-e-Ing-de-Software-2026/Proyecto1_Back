# Tasks: Harden Product Management Validation

> Replaces the stale, paused task plan. This plan is the authoritative CR-001 breakdown derived from the current `proposal.md`, the two delta specs, and `design.md`.

## Testing Policy (read before any task)

- **Existing tests only.** The existing test suites are the specification. No new test file and no new test case is authored by this change; implementation MUST make the existing suites pass.
- **Strict TDD is a documented, scoped exception.** Because no RED tests are authored, the RED → GREEN → REFACTOR loop does not apply per task. Instead, each task makes its existing suite green.
- **Only permitted test edit:** replace the obsolete `FAIL BY DESIGN` comment in `producto.service.registro.spec.ts` with the approved CR-001 expectation. Do not otherwise modify, extend, or create test files, and do not register new specs in any manifest.
- **Accepted coverage gap.** Marca, Presentación, and `producto-operacion` DTO validation and global validation-error communication have no existing automated coverage. This gap is accepted and MUST be reported honestly, never implied to be covered.
- **Known conflict to resolve before apply.** The previously-authored `producto/dto/update-producto.dto.spec.ts` accepts a partial update (only `denominacion` + `usuarioUpdatedId`), which contradicts the approved full-replacement contract. Under the no-test-edits policy this cannot be reconciled silently; obtain an explicit decision before implementing strict update DTOs.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900–1300 authored production lines across six PR slices (DTOs, domain/application services, module wiring, factory/filter/bootstrap); test diff is limited to one comment replacement |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1a → PR1b → PR1c → PR2 → PR3 → PR4 (six work units below) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

The first slice (PR1) forecast ~1,300 authored lines, far over the 400-line review budget, so the DTO work is split into PR1a (shared validation helpers + Product DTOs), PR1b (catalog DTOs), and PR1c (Product search DTOs + `producto-operacion` DTOs). Under the session's `ask-on-risk` strategy, a delivery decision is required before `sdd-apply` using the `feature-branch-chain` strategy.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Shared validation helpers + Product DTOs (create, update, precio) | PR1a | `yarn test` (unit manifest); Product DTO suites | N/A — pure transform/validator unit surface; no HTTP or persistence boundary | `src/modules/gestion-productos/common/validation/request-validation.helpers.ts`, `producto/dto/*` |
| 2 | Catalog DTOs for `linea`, `marca`, `presentacion`, `superlinea` | PR1b | `yarn test` (unit manifest); catalog DTO suites | N/A — pure transform/validator unit surface | `linea/dto/*`, `marca/dto/*`, `presentacion/dto/*`, `superlinea/dto/*` |
| 3 | Product search DTOs + `producto-operacion` DTOs | PR1c | `yarn test` (unit manifest); search and `producto-operacion` DTO suites | N/A — DTO-only surface | Product search DTOs, `producto-operacion/dto/*` |
| 4 | Product domain/application numeric rules (request state, no merge) | PR2 | `node node_modules/jest/bin/jest.js --runTestsByPath src/modules/gestion-productos/producto/application/services/producto.service.registro.spec.ts` | `yarn test:integration` exercising `producto.registro.int-spec.ts` (Docker required; report unavailable if Docker is absent) | `producto-intrinsic-validation.service.ts.ts`, `producto.service.ts` |
| 5 | Catalog domain/application services (Línea, Marca, Presentación, SuperLínea) | PR3 | `yarn test` (unit manifest); catalog service suites | `yarn test:integration` exercising `linea.persistence-adapter.int-spec.ts`, `marca.integracion.int-spec.ts`, `superlinea.persistence-adapter.int-spec.ts` (Docker required) | Four `domain/services/*-intrinsic-validation.service.ts`, four `application/services/*.service.ts`, four module files |
| 6 | Global validation-error communication | PR4 | `yarn test` and `yarn build` (no dedicated existing spec) | `yarn test:integration` exercising `producto.http.int-spec.ts` and `marca.http.int-spec.ts` with the same exported factory and filter as `main.ts` (Docker required) | `validation-error.factory.ts`, `global-exception.filters.ts`, `main.ts` |

Rollback order follows the design: revert Unit 6 first if the additive response causes client issues, then Units 1–5 as one coordinated application rollback. No schema or entity rollback exists because none is touched.

---

## Scope Guardrails (apply to every task)

- **No entity, entity-mapping, shared column decorator, schema, or migration changes.** `Producto.denominacion` stays mapped as `text`; the 200-character Product bound is application-only. Requirement: *No persistence-model or schema changes* (R10).
- **`producto-operacion` stays a DTO-only scaffold.** Do not touch `producto-operacion.service.ts`, `producto-operacion.entity.ts`, its controller, or add a repository.
- **Update requests are full replacements.** `UpdateProductoDto` and the catalog update DTOs MUST require the mandatory fields (denomination, positive relation IDs, mandatory numeric rules) via the shared hardened helpers; only genuinely optional fields remain optional; explicit `null` is rejected. Do not use `PartialType` for mandatory fields and do not merge with persisted state.
- **`yarn` only** (Yarn 4). Focused unit command: `node node_modules/jest/bin/jest.js --runTestsByPath <spec>` (defaults to the unit suite because `TEST_SUITE` is unset). Focused integration command: `TEST_SUITE=with node node_modules/jest/bin/jest.js --runTestsByPath <spec>` or `yarn test:integration` (Docker required).
- **Docker honesty.** If Docker is unavailable, integration suites MUST be reported as unavailable, never as passing. `yarn test` and `yarn test:integration` only execute manifest-listed files.

Requirement key: R1 Safe/strict request transformation · R2 Product write contract · R3 Numeric precision/limits · R4 Product domain/application enforcement · R5 Línea · R6 Marca · R7 Presentación · R8 SuperLínea · R9 Producto-Operación scaffold · R10 No schema changes · E1 Stable envelope · E2 Production-safe details · E3 Normalized nested paths.

---

## Phase PR1a: Shared Validation Helpers and Product DTOs

- [x] PR1a.1 Create `src/modules/gestion-productos/common/validation/request-validation.helpers.ts` with pure, non-throwing transforms, the `IsOptionalWhenUndefined` (`ValidateIf((_, value) => value !== undefined)`) helper, and the storage-compatible numeric constants/predicates for money (`9,999,999,999.99999`, 5 decimals), quantity (`999,999,999.999`, 3 decimals), and percentage (`999.99`, 2 decimals). Keep it free of Nest/TypeORM imports. (Req: R1, R3)
- [x] PR1a.2 Update `src/modules/gestion-productos/producto/dto/create-producto.dto.ts` to use the helpers: safe normalization, 200-character bound, required numeric state with finite storage ranges/scales, conditional pack count, strict booleans (including `costoEnDolar`, `destacado`, `envioGratis`), and positive integer relation/audit IDs. Make the existing Product create DTO suite pass. (Req: R1, R2, R3)
- [x] PR1a.3 Update `src/modules/gestion-productos/producto/dto/update-producto.dto.ts` to require the mandatory Product fields for the full-replacement `@Put(':id')` (denomination, positive relation IDs, mandatory numeric rules) via the shared helpers; keep only genuinely optional fields optional; require a positive `usuarioUpdatedId`; reject explicit `null`. Make the existing update DTO suite pass, resolving the known `update-producto.dto.spec.ts` conflict above before apply. (Req: R1, R2)
- [x] PR1a.4 Update `src/modules/gestion-productos/producto/dto/actualizacion-precio.dto.ts` and `update-precio.dto.ts` to apply safe numeric transforms, finite `decimal` bounds, and positive IDs without making the dormant persistence flow reachable. Make their existing suites pass. (Req: R1, R3)
- [x] PR1a.5 Run `yarn test` and `yarn build`; confirm the shared-helper and Product DTO suites are green and the slice stays within the review budget. (Req: R1, R2, R3)

## Phase PR1b: Catalog DTOs (Línea, Marca, Presentación, SuperLínea)

- [x] PR1b.1 Update `src/modules/gestion-productos/linea/dto/create-linea.dto.ts`, `update-linea.dto.ts`, and `select-linea.dto.ts` for safe 255-character denomination, non-string rejection, strict booleans, the fractional `stockMinimo` `decimal(12,3)` contract, a positive `superLineaId`, positive audit IDs, no client-controlled deletion value, and omission-vs-explicit-null on the optional search string. The full-replacement update MUST require the mandatory Línea fields. Make the existing Línea DTO suites pass. (Req: R1, R5)
- [x] PR1b.2 Update `src/modules/gestion-productos/marca/dto/create-marca.dto.ts` and `update-marca.dto.ts` for a safe 255-character denomination and positive create/update audit IDs (`0`, `-1`, fractional, non-finite, and explicit `null` rejected). The full-replacement update MUST require the denomination. Make the existing Marca DTO suite pass. (Req: R1, R6)
- [x] PR1b.3 Update `src/modules/gestion-productos/presentacion/dto/create-presentacion.dto.ts`, `update-presentacion.dto.ts`, and `select-presentacion.dto.ts` for safe transforms, explicit-null rejection, and denomination/audit-ID rules. The full-replacement update MUST require the denomination. Make the existing Presentación DTO suite pass. (Req: R1, R7)
- [x] PR1b.4 Update `src/modules/gestion-productos/superlinea/dto/create-superlinea.dto.ts`, `update-superlinea.dto.ts`, and `select-superlinea.dto.ts` for a safe 255-character denomination, undefined-only optionality, and positive audit IDs. The full-replacement update MUST require the denomination. Make the existing SuperLínea DTO suite pass. (Req: R1, R8)
- [x] PR1b.5 Align every catalog DTO on the shared Phase PR1a helpers so no module keeps a divergent inline transform; run `yarn test` and `yarn build` and confirm the slice is green and within budget. (Req: R1)

## Phase PR1c: Product Search DTOs and Producto-Operación DTOs

- [x] PR1c.1 Update `src/modules/gestion-productos/producto/dto/search-producto-rapido.dto.ts`, `search-producto-pagination-with.dto.ts`, `seach-informacion-producto.dto.ts` (preserve the misspelled filename), and `search-producto-superlinea.dto.ts`: unsupported boolean/query values are preserved for controlled rejection rather than coerced or erased; date transformation is non-throwing and rejects explicit `null`/malformed dates; `superLineaId` must be positive; pagination rules are retained. Make the existing search DTO suites pass. (Req: R1, R3)
- [x] PR1c.2 Define `src/modules/gestion-productos/producto-operacion/dto/create-producto-operacion.dto.ts` with positive integer `productoId`, positive integer `operacionId`, and a non-empty string `tipoOperacion` with a 255-character maximum, keeping `update-producto-operacion.dto.ts` as its partial update contract. Do not change the scaffold service, entity, or repository. Make the existing Producto-Operación DTO suite pass. (Req: R9)
- [x] PR1c.3 Confirm no change to `src/modules/gestion-productos/producto-operacion/producto-operacion.service.ts`, its entity, or its controller; run the existing `producto-operacion.controller.spec.ts` and `producto-operacion.service.spec.ts` through `yarn test` and confirm unchanged behavior. (Req: R9)

## Phase PR2: Product Domain and Application Request-State Rules

- [ ] PR2.1 Extend `src/modules/gestion-productos/producto/domain/services/producto-intrinsic-validation.service.ts.ts` so `validarDatosBasicos` accepts `costo`, `porcentaje`, `stock`, `stockMinimo`, stock/pack flags, and `cantidadPorPack`, keeps the `unknown` defense-in-depth input boundary, and enforces the approved sign, finiteness, precision, and range rules. Make the existing `producto-intrinsic-validation.service.spec.ts` pass. (Req: R3, R4)
- [ ] PR2.2 Update `src/modules/gestion-productos/producto/application/services/producto.service.ts` so `create` validates the request state before relation lookups and persistence, and `update` validates the full-replacement request state directly (no persisted-state merge, no `!== undefined` composition) before uniqueness checks, resolves the required active `marcaId`, `lineaId`, and `presentacionId` relations, and rejects invalid state with a controlled bad-request outcome. Make `producto.service.registro.spec.ts` green: all eleven rejection cases pass with assertions intact and the obsolete "FAIL BY DESIGN" comment replaced with the approved expectation. (Req: R2, R4)
- [ ] PR2.3 Confirm the Product application suite `producto.service.spec.ts` stays green and that no update case depends on retained persisted state. (Req: R4)
- [ ] PR2.4 Run `yarn test` and `yarn build`; confirm the Product domain/application slice is green. (Req: R3, R4)

## Phase PR3: Catalog Domain and Application Services (Línea, Marca, Presentación, SuperLínea)

- [ ] PR3.1 Create `src/modules/gestion-productos/linea/domain/services/linea-intrinsic-validation.service.ts` with the Línea intrinsic rules (required 255-character string denomination, positive `superLineaId`, positive audit IDs, finite `decimal(12,3)` `stockMinimo`); update `linea.service.ts` to validate the request state before uniqueness/relation/persistence and to resolve the required active SuperLínea. Make the existing `linea.service.spec.ts` pass. (Req: R5)
- [ ] PR3.2 Create `src/modules/gestion-productos/marca/domain/services/marca-intrinsic-validation.service.ts` and update `marca.service.ts` to validate the required denomination and positive audit IDs before persistence. Make the existing `marca.service.spec.ts` pass. (Req: R6)
- [ ] PR3.3 Create `src/modules/gestion-productos/presentacion/domain/services/presentacion-intrinsic-validation.service.ts` and update `presentacion.service.ts` to validate the required denomination and positive audit IDs before persistence. Make the existing `presentacion.service.spec.ts` pass. (Req: R7)
- [ ] PR3.4 Create `src/modules/gestion-productos/superlinea/domain/services/superlinea-intrinsic-validation.service.ts` and update `superlinea.service.ts` to validate the required denomination and positive audit IDs before persistence. Make the existing `superlinea.service.spec.ts` pass. (Req: R8)
- [ ] PR3.5 Register each new intrinsic validation service as a provider in `linea.module.ts`, `marca.module.ts`, `presentacion.module.ts`, and `superlinea.module.ts`, and inject them into the corresponding application services. Run `yarn build` and `yarn test`. (Req: R5, R6, R7, R8)
- [ ] PR3.6 Align the four intrinsic services on one consistent method naming and message style; re-run `yarn test` and confirm the catalog service suites stay green. (Req: R5, R6, R7, R8)

## Phase PR4: Global Validation-Error Communication

- [ ] PR4.1 Create `src/modules/common/validation/validation-error.factory.ts` exporting `RequestValidationException` and a pure recursive normalizer producing `FieldValidationError[]`: traverse only `property`/`constraints`/`children`; accept safe property segments and numeric indexes and reject reserved/malformed segments; render nested paths as `parent.child` and array indexes as `items[0].field`; sort fields lexicographically; sort constraints by key, dedupe authored messages, and emit strings only; exclude `target`, `value`, contexts, exception objects, and unknown metadata. (Req: E1, E2, E3)
- [ ] PR4.2 Configure the global `ValidationPipe` in `src/main.ts` with the custom `exceptionFactory` from the factory, preserving all existing pipe options (`transform`, `whitelist`, `forbidNonWhitelisted`) and unrelated bootstrap behavior. (Req: E1, E2)
- [ ] PR4.3 Update `src/modules/common/filters/global-exception.filters.ts` to append `fieldErrors` only for `RequestValidationException`, keeping `statusCode`, `timestamp`, `path`, and the generic `message` unchanged and leaving every non-validation branch intact. (Req: E1, E2, E3)
- [ ] PR4.4 Run `yarn test` and `yarn build`; note that this area has no dedicated existing unit suite (accepted coverage gap) and rely on the existing HTTP integration suites where Docker is available. (Req: E1, E2, E3)

## Phase Final Verification

- [ ] V.1 Run `yarn test` and confirm the entire existing unit-manifest suite is green. (Req: all)
- [ ] V.2 Run `yarn test:integration` when Docker is available; capture and report the outcome honestly, including any unavailable suite; never report an unexecuted Docker suite as passing. (Req: R4, R5, R6, R8, E1, E2)
- [ ] V.3 Run `yarn build` and resolve compilation failures only within CR-001 files. (Req: all)
- [ ] V.4 Run `git diff --name-only` and `git diff --check`, then confirm: no entity, mapper, shared column decorator, migration, or `producto-operacion` service/entity/controller file changed; `Producto.denominacion` mapping untouched; no new spec file created and no manifest extended. (Req: R10)
- [ ] V.5 Confirm the eleven `producto.service.registro.spec.ts` rejection cases pass with their assertions intact and the obsolete "FAIL BY DESIGN" comment replaced. (Req: R4)

---

## No Entity / Schema / Migration Work

This change contains **zero** entity, entity-mapping, shared-column-decorator, schema, or migration tasks. The Product 200-character bound and all numeric rules are enforced exclusively at DTO, domain, and application validation boundaries. No `TypeORM synchronize`, migration, or data cleanup is required. Rollback is application-only.

## Integration Verification Availability

`yarn test:integration` requires Docker with MySQL 8. If Docker is not running, the integration suites (Product, Línea, Marca, SuperLínea HTTP and persistence) MUST be reported as **unavailable/unverified**, never as passing. Unit suites (`yarn test`) and `yarn build` remain the mandatory locally verifiable gates, and the accepted coverage gap for Marca/Presentación/`producto-operacion` DTO validation and global error communication must be stated as such.
