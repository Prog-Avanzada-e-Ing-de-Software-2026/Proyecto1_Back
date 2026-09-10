# Tasks: Validate Product Management Writes and Preserve Client Errors

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 280–380 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR with two implementation work units |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Enforce product-management DTO contracts | Single PR | Deferred — no test command authorized for CR-001 | N/A — runtime testing deferred | Product-management transforms and DTO changes |
| 2 | Preserve structured validation errors | Single PR | Deferred — no test command authorized for CR-001 | N/A — runtime testing deferred | Exception factory, global pipe wiring, and filter changes |

Testing is deferred to a separately authorized change. These tasks MUST NOT create or modify test cases or test files.

## Phase 1: Shared Validation Foundation

- [ ] 1.1 Create `src/modules/gestion-productos/common/validation/product-write.transforms.ts` with non-throwing string normalization and strict conversion for booleans and their supported string forms.

## Phase 2: Product Write Contracts

- [ ] 2.1 Update `src/modules/gestion-productos/producto/dto/create-producto.dto.ts` with the 200-character denomination limit, safe transforms, strict booleans, persistence-compatible decimals, conditional fields, VAT values, string bounds, and positive references.
- [ ] 2.2 Simplify `src/modules/gestion-productos/producto/dto/update-producto.dto.ts` to inherit partial create rules while requiring a positive `usuarioUpdatedId`.
- [ ] 2.3 Align `src/modules/gestion-productos/producto/dto/update-precio.dto.ts` numeric, precision, persisted-margin (`porcentaje`), and positive-user validation without exposing or repairing the dormant flow.
- [ ] 2.4 Update `src/modules/gestion-productos/linea/dto/create-linea.dto.ts` and `src/modules/gestion-productos/linea/dto/update-linea.dto.ts` for safe denomination handling, fractional non-negative stock, conditional minimum stock, strict boolean input, and positive audit IDs.
- [ ] 2.5 Update `src/modules/gestion-productos/marca/dto/create-marca.dto.ts` and `src/modules/gestion-productos/marca/dto/update-marca.dto.ts` for safe denomination handling and positive audit IDs.

## Phase 3: Validation Error Contract

- [ ] 3.1 Create `src/modules/common/validation/validation-error.factory.ts` to flatten nested validator constraints into deterministic `message[]` and property-path `fieldErrors`.
- [ ] 3.2 Configure `src/main.ts` to use the structured validation exception factory without changing the existing global pipe options.
- [ ] 3.3 Update `src/modules/common/filters/global-exception.filters.ts` to preserve `HttpException` response fields in the existing envelope and omit stack/internal details from production responses.

## Phase 4: Non-Test Verification

- [ ] 4.1 Run `yarn build` and resolve compilation failures only within the CR-001 implementation files.
- [ ] 4.2 Inspect `git diff --name-only` and `git diff --check`; confirm no test file or out-of-scope module changed and no margin formula, sign, or update semantics were introduced.
