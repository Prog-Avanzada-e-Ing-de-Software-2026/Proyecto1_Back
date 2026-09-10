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
