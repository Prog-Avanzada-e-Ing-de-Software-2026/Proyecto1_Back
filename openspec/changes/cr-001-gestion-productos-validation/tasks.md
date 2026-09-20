# Tasks: Validate Product Management Requests and Preserve Client Errors

**Implementation: Paused.** Do not start until the user explicitly resumes CR-001.

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 340–440 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR, three work units |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Enforce write contracts | Single PR | Deferred by CR-001 scope | N/A — deferred | Shared transforms and write DTOs |
| 2 | Enforce search contracts | Single PR | Deferred by CR-001 scope | N/A — deferred | Three search DTOs |
| 3 | Preserve validation errors | Single PR | Deferred by CR-001 scope | N/A — deferred | Factory, pipe, and filter |

Tests are deferred to a separate change and MUST NOT be created or modified. Implementation is paused until explicit resume.

## Phase 1: Shared Validation Foundation

- [ ] 1.1 Create `src/modules/gestion-productos/common/validation/request-value.transforms.ts` with safe string, strict-boolean, and inclusive end-date transforms shared by write and search DTOs.

## Phase 2: Product Write Contracts

- [ ] 2.1 Update `src/modules/gestion-productos/producto/dto/create-producto.dto.ts` with safe transforms, write boundaries, conditional fields, VAT values, and positive references.
- [ ] 2.2 Simplify `src/modules/gestion-productos/producto/dto/update-producto.dto.ts` to inherit partial create rules while requiring a positive `usuarioUpdatedId`.
- [ ] 2.3 Align `src/modules/gestion-productos/producto/dto/update-precio.dto.ts` numeric, persisted-margin (`porcentaje`), and positive-user rules without exposing the dormant flow.
- [ ] 2.4 Update `src/modules/gestion-productos/linea/dto/create-linea.dto.ts` and `src/modules/gestion-productos/linea/dto/update-linea.dto.ts` for safe denomination handling, fractional non-negative stock, conditional minimum stock, strict boolean input, and positive audit IDs.
- [ ] 2.5 Update `src/modules/gestion-productos/marca/dto/create-marca.dto.ts` and `src/modules/gestion-productos/marca/dto/update-marca.dto.ts` for safe denomination handling and positive audit IDs.

## Phase 2A: Product Search Contracts

- [ ] 2.6 Update `src/modules/gestion-productos/producto/dto/search-producto-rapido.dto.ts` so `exacto` is strict and invalid input returns controlled 400.
- [ ] 2.7 Update `src/modules/gestion-productos/producto/dto/search-producto-pagination-with.dto.ts` so exact-match flags are strict and optional `conStock` skips only absence, never malformed input.
- [ ] 2.8 Update `src/modules/gestion-productos/producto/dto/seach-informacion-producto.dto.ts` so invalid `fechaHasta` is rejected safely and valid values remain inclusive through end-of-day UTC.

## Phase 3: Validation Error Contract

- [ ] 3.1 Create `src/modules/common/validation/validation-error.factory.ts` to flatten nested validator constraints into deterministic `message[]` and property-path `fieldErrors`.
- [ ] 3.2 Configure `src/main.ts` to use the structured validation exception factory without changing the existing global pipe options.
- [ ] 3.3 Update `src/modules/common/filters/global-exception.filters.ts` to preserve `HttpException` response fields in the existing envelope and omit stack/internal details from production responses.

## Phase 4: Non-Test Verification

- [ ] 4.1 Run `yarn build` and resolve compilation failures only within the CR-001 implementation files.
- [ ] 4.2 Inspect `git diff --name-only` and `git diff --check`; confirm no test file or out-of-scope module changed and no margin formula, sign, or update semantics were introduced.

## Deferred Findings (Documentation Only — Not CR-001 Scope)

These findings are recorded so a later authorized change can pick them up. They are NOT
CR-001 tasks, are not part of its authorized scope, and MUST NOT be checked off here.
CR-001 remains paused; documenting them changes nothing about its scope, testing
exclusion, or resume state.

### CP-63 — A SuperLínea update that keeps its own denomination is wrongly rejected

- **Symptom**: a `PUT /api/superlinea/:id` that does not change `denominacion` is
  rejected with a denomination-uniqueness conflict. The CP-63 assertions in
  `src/modules/gestion-productos/superlinea/application/services/superlinea.service.spec.ts`
  (unit) and
  `src/modules/gestion-productos/superlinea/infraestructure/repositories/superlinea.persistence-adapter.int-spec.ts`
  (integration) are RED.
- **Root cause**: the uniqueness lookup cannot exclude the row being updated. The
  `excludeId` contract is missing at every layer:
  1. `SuperLineaService.update` calls `checkDenominacionExists(denominacion)` without the current `id`.
  2. `PoliticaCreacionSuperLinea.checkDenominacionExists(denominacion)` does not accept an `excludeId`.
  3. `ISuperLineaRepository.findByDenominacionWithDeleted(denominacion)` has no exclusion parameter.
  4. `SuperLineaPersistenceAdapter.findByDenominacionWithDeleted` emits
     `WHERE UPPER(superLinea.denominacion) = :denominacion` with no `AND id != :excludeId`.
  Additionally, `IsUniqueDenominacionConstraint.validate` computes `ignoreId` and
  `where.id = Not(ignoreId)` but never uses them, and `UpdateSuperLineaDto` inherits
  `@IsUniqueDenominacion()` through `PartialType` while the update body carries no `id`.
- **Required work to close it**:
  - Add an optional `excludeId` to the service, the policy, the repository interface, and
    `SuperLineaRepository`, and apply `AND superLinea.id != :excludeId` in the adapter
    when it is provided.
  - `update()` passes the route `id`; `create()` passes nothing.
  - Repair the malformed integration assertion: it queries `findByDenominacionWithDeleted('bebidas')`
    without the created `id`, so it can never return `null`; it must pass the id.
  - Resolve the update-path DTO validator: remove `@IsUniqueDenominacion` from the update
    DTO or supply the current id; update uniqueness belongs to the service.
- **Evidence**: archived change
  `openspec/changes/archive/2026-09-19-audit-linea-superlinea-test-coverage/` left CP-63
  documented as pending; production code was intentionally not modified there.
