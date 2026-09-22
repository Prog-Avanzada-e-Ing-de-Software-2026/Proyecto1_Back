# Proposal: Harden Product Management Validation

## Intent

CR-001 will prevent invalid data from crossing the Product Management boundaries and will return clear, field-specific request-validation feedback without changing the established public error envelope. The current implementation contains unsafe transforms, permissive boolean and identifier handling, DTO constraints that diverge from existing numeric column contracts, and Product services that do not enforce the approved registration and modification rules.

This change will enforce `costo >= 0`, `porcentaje` (margen) `> 0`, `stock` (stockActual) `> 0`, and `stockMinimo > 0` for Product creation and Product update requests. It intentionally replaces the obsolete "FAIL BY DESIGN" note in `producto.service.registro.spec.ts` and must make its 11 rejection cases pass.

## Scope

### In Scope

- Harden DTO validation across all six `gestion-productos` modules: `producto`, `linea`, `marca`, `presentacion`, `producto-operacion`, and `superlinea`.
- Make transforms non-throwing, accept only strict boolean representations, distinguish omitted values from invalid explicit `null`, require positive integer identifiers, reject non-finite numbers, and align precision and limits with the existing `decimal(15,5)`, `decimal(12,3)`, and `decimal(5,2)` shared column decorators.
- Enforce Product's approved numeric rules in domain services and use application services to validate the request state for creation and update, including required active Marca, Línea, and Presentación relations.
- Enforce denomination limits at the DTO/domain-service boundary: 200 characters for Product and 255 characters for Línea, Marca, Presentación, and SuperLínea.
- Add DTO validation to the `producto-operacion` scaffold for a positive `productoId` representing its Product relation, a positive `operacionId`, and a required bounded `tipoOperacion`; cover those request contracts without adding persistence or business behavior.
- Preserve `statusCode`, `timestamp`, `path`, and the existing generic `message` while exposing deterministic field-specific details for recognized `ValidationPipe` failures. Changes to `src/main.ts` and/or `GlobalExceptionFilter` are an explicit scoped exception to the AGENTS.md default of preserving global exception behavior.
- Make the existing test suites pass; do NOT create new test files or new test cases. Replace the obsolete `FAIL BY DESIGN` comment in `producto.service.registro.spec.ts` with the approved expectation; do not otherwise modify tests.
- Keep the database schema unchanged. The Product 200-character rule is application validation only, and `producto.denominacion` remains mapped as `text`.

### Out of Scope

- Any entity or entity-mapping modification, including changes to `Producto.denominacion` persistence metadata or new entity invariant/mutation methods.
- Any database schema constraint, data cleanup, or use of TypeORM `synchronize`.
- Persistence, repositories, relation loading, or new business behavior for the generator-scaffold `producto-operacion` module; its hardcoded service behavior and entity remain unchanged.
- Changes to shared monetary, quantity, or percentage column decorators; they are validation references only.
- Authentication, users, system, organization, or business behavior outside `gestion-productos`.
- Global exception changes unrelated to recognized request-validation failures, including status mapping, logging policy, stack exposure, or non-validation error semantics.
- New entities, Value Objects, domain events, CQRS models, or undocumented pricing and stock rules.
- Cleanup of dormant or dead code unless a touched validation path requires it for correctness.

## Capabilities

### New Capabilities

- `product-management-validation`: Defines safe request transformation and defense-in-depth validation for all six `gestion-productos` modules, including Product numeric rules, identifiers, null semantics, storage-compatible numeric limits, and the 200/255 denomination contracts.
- `validation-error-communication`: Defines the stable public error envelope and deterministic field-specific details returned for recognized global `ValidationPipe` failures.

### Modified Capabilities

None. Existing valid search and selection requirements remain unchanged.

## Approach

1. **DTO boundaries:** Guard transforms by input type so validators, rather than transform callbacks, reject malformed values. Preserve unsupported boolean, date, and query values for validation instead of coercing or erasing them. Required fields reject `null` and `undefined`; optional fields accept omission but reject explicit `null` unless explicitly permitted.
2. **Numeric and length contracts:** Reject `NaN` and infinities. Apply storage-compatible precision and upper bounds: money up to `9,999,999,999.99999`, quantities up to `999,999,999.999` with three fractional digits, and percentages up to `999.99` with two fractional digits. Keep IDs and pack counts as positive integers. Enforce Product denomination at 200 and other catalog denominations at 255 without changing persistence mappings.
3. **Service enforcement:** Extend `ProductoIntrinsicValidationService` with the four mandatory numeric rules. Application services will validate required positive IDs before lookups, require active related records, construct the effective create/update state, and invoke domain services before persistence. Other in-scope services will retain orchestration responsibilities while DTO/domain services own validation rules.
4. **`producto-operacion` boundary:** Replace the empty create DTO with validated `productoId`, `operacionId`, and `tipoOperacion` request fields, with update remaining a validated partial contract. Do not add repository calls, persistence wiring, relation resolution, or domain rules to this scaffold.
5. **Validation-error communication:** Retain structured validation information at the global pipe/filter boundary, normalize nested field paths and public constraint messages into deterministic ordering, and add only a safe validation-detail field to the existing envelope. Non-validation exceptions keep their current public behavior, and production responses expose no stack, raw exception, or arbitrary internal data.
6. **Testing policy:** The existing unit and integration suites are the specification, and no new test files or test cases are authored. Strict TDD is therefore a documented, scoped exception for this change: implementation must make the existing suites pass instead of starting from authored RED tests. The only permitted test edit is replacing the obsolete `FAIL BY DESIGN` comment in `producto.service.registro.spec.ts` with the approved CR-001 expectation. Exercise existing integration specs where the manifest already covers a module: Product, Línea, Marca, and SuperLínea; Docker unavailability is reported, never treated as a pass.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/modules/gestion-productos/producto/dto/` | Modified | Harden write, search, and price DTOs; enforce Product numeric, boolean, ID, null, precision, and 200-character rules. |
| `src/modules/gestion-productos/linea/dto/` | Modified | Add safe normalization, fractional quantity constraints, positive IDs, explicit null handling, and the 255-character limit. |
| `src/modules/gestion-productos/marca/dto/` | Modified | Add safe normalization, positive audit IDs, explicit null handling, and the 255-character limit. |
| `src/modules/gestion-productos/presentacion/dto/` | Modified | Align positive audit IDs, explicit null handling, safe transforms, and the 255-character limit. |
| `src/modules/gestion-productos/superlinea/dto/` | Modified | Align positive audit IDs, explicit null handling, safe transforms, and the 255-character limit. |
| `src/modules/gestion-productos/producto-operacion/dto/` | Modified | Validate `productoId`, `operacionId`, and `tipoOperacion` while preserving the scaffold boundary. |
| `src/modules/gestion-productos/{producto,linea,marca,presentacion,superlinea}/application/services/` | Modified | Validate request state plus positive-ID, required-relation, and active-relation checks before persistence where applicable. |
| `src/modules/gestion-productos/*/domain/services/` | Modified | Centralize applicable business validation, especially Product's four mandatory numeric rules; no entity changes. |
| `src/modules/common/filters/global-exception.filters.ts` | Modified | Preserve the current envelope and expose normalized details only for recognized request-validation failures. |
| `src/modules/common/` validation helper/factory, if needed | New/Modified | Produce deterministic, production-safe field details without changing unrelated error behavior. |
| `src/main.ts` | Modified if required | Configure the validation exception payload needed by the filter; retain all unrelated bootstrap behavior. |
| `src/modules/gestion-productos/**/*.spec.ts` | Modified only to replace the obsolete comment | The existing suites are the specification. Change only the obsolete `FAIL BY DESIGN` comment in `producto.service.registro.spec.ts`; no new spec file is created. |
| `src/modules/gestion-productos/**/*.int-spec.ts` | Unchanged | Existing Product, Línea, Marca, and SuperLínea integration suites must keep passing where Docker is available; no new integration spec is created. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing clients rely on coercion of `1`, `"yes"`, `0`, malformed query values, or `null` | Medium | Define accepted representations in specs and prove unsupported values return controlled 400 responses. |
| Global validation-detail handling changes non-validation responses or leaks internals | Medium | Recognize only normalized validation payloads, whitelist public detail fields, preserve existing envelope/message semantics, and test representative validation, non-validation, and production-mode 500 responses. |
| Adding validation details affects clients that assume an exact response shape | Medium | Make details additive and deterministic while retaining every existing envelope key and the generic message. |
| DTO and domain-service rules drift | Medium | Define shared boundary examples in specs and test identical limits at each required entry point. |
| Full-replacement updates reject clients that send only changed fields | Medium | Require the mandatory fields in `UpdateProductoDto` and catalog update DTOs exactly as the "Modificar Producto" story lists them, and call out the stricter update contract in release notes. |
| `producto-operacion` scope grows beyond its scaffold status | Low | Restrict changes to DTO contracts and tests; prohibit entity, service behavior, repository, and persistence changes. |
| Testcontainers verification is unavailable | Medium | Report integration execution as unavailable or failed; never treat an unexecuted Docker suite as passing evidence. |
| The implementation exceeds the 400-line review budget | Medium | During task planning, split work into reviewable units if the forecast is high, subject to the session's ask-on-risk delivery strategy. |

## Rollback Plan

Revert the validation-detail pipe/filter changes first if they cause client-facing regressions, then revert DTO and service validation together with their existing suites as one coordinated application rollback. No database action, data restoration, or entity rollback is required because this change does not modify schema or entity mappings. Confirm representative validation and non-validation responses return to the prior envelope behavior. The rollback record must explicitly note that permissive inputs and the 11 known Product registration failures are being restored rather than hiding those regressions.

## Dependencies

- Existing NestJS `ValidationPipe`, `BadRequestException`, `class-transformer`, and `class-validator` infrastructure.
- Existing shared TypeORM numeric decorators as precision and scale references; no schema dependency is introduced.
- Existing Jest unit and Testcontainers integration manifests.
- Docker/MySQL 8 availability only for the already-manifested integration suites.

## Success Criteria

- [ ] `costo >= 0`, `porcentaje > 0`, `stock > 0`, and `stockMinimo > 0` are enforced for Product creation and Product update requests through domain/application services.
- [ ] All 11 rejection cases in `producto.service.registro.spec.ts` pass, and the obsolete "FAIL BY DESIGN" comment is replaced with the approved CR-001 expectation.
- [ ] Non-string denominations and malformed date, boolean, and query values cannot throw during transformation or be silently converted into valid values.
- [ ] Required values reject `null` and `undefined`; optional values distinguish omission from invalid explicit `null`.
- [ ] Product denomination accepts at most 200 characters, while Línea, Marca, Presentación, and SuperLínea denominations accept at most 255 characters, entirely at DTO/domain-service level.
- [ ] Monetary, quantity, and percentage values respect the existing `decimal(15,5)`, `decimal(12,3)`, and `decimal(5,2)` limits, including fractional quantities, without schema or entity changes.
- [ ] Required relations exist and are active, and all relation and audit identifiers in scope are positive integers.
- [ ] `producto-operacion` validates positive `productoId` and `operacionId` plus required bounded `tipoOperacion`, with no new persistence, repository, entity, or business behavior.
- [ ] Clients receive deterministic field-specific validation details while `statusCode`, `timestamp`, `path`, and generic `message` remain stable.
- [ ] Non-validation exceptions retain existing status and public-envelope behavior, and production responses expose no stack, raw exception, or internal details.
- [ ] The existing unit and integration suites pass except where Docker is unavailable; no new test file is created.
- [ ] No entity, entity mapping, or database schema file is changed; `producto.denominacion` remains `text`.
- [ ] `yarn test`, `yarn test:integration` when Docker is available, and `yarn build` complete successfully.
