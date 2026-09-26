# Design: Harden Product Management Validation

## Technical Approach

Implement CR-001 as defense-in-depth validation without changing entities, entity mappings, repositories, database schema, or migrations:

1. Request DTOs in all six `gestion-productos` modules reject malformed values through non-throwing transforms and explicit `class-validator` constraints.
2. Product and catalog domain services enforce the approved intrinsic rules when application services are called without an HTTP boundary.
3. Application services validate the request state, resolve required active relations, and only then call persistence. Product updates are full replacements, so the request carries all mandatory fields and no merge with persisted state occurs; catalog updates accept partial payloads and validate only the fields that are present.
4. `producto-operacion` receives DTO validation only; its generated controller/service behavior and persistence boundary remain unchanged.
5. A custom `ValidationPipe.exceptionFactory` creates a recognizable request-validation exception. `GlobalExceptionFilter` adds deterministic `fieldErrors` only for that exception type while preserving the existing envelope and all non-validation behavior.

This implements both `product-management-validation` and `validation-error-communication`. Existing suites are the specification: no new test files or cases are authored, so strict TDD is a documented, scoped exception for this change.

## Architecture Decisions

### Decision: Keep shared DTO helpers inside Product Management

**Choice**: Create `src/modules/gestion-productos/common/validation/request-validation.helpers.ts` for pure, non-throwing request transforms, storage-compatible numeric constants/predicates, and an `IsOptionalWhenUndefined` decorator helper. DTOs remain responsible for request contracts; domain services may reuse only pure numeric predicates/constants.

**Alternatives considered**: Put DTO helpers in `src/modules/common/`; keep independent inline transforms; introduce a global custom pipe for each value type.

**Rationale**: The helpers are specific to CR-001 and the six Product Management modules. Keeping them under `gestion-productos` avoids expanding the shared module's DTO responsibilities, eliminates transform drift, and preserves current controller/module boundaries. `src/modules/common/` is touched only for global validation-error communication.

The helper contract is:

- String normalization trims and lowercases only strings; all other values are returned unchanged for validators to reject.
- Strict booleans accept `true`, `false`, `"true"`, and `"false"` only. Every other present value is preserved, not coerced or erased.
- Query-number and date transforms convert only recognized valid representations; malformed values and explicit `null` remain invalid values.
- Optional fields use `ValidateIf((_, value) => value !== undefined)` semantics. Omission is skipped, but explicit `null` continues through validation and fails.
- Decimal validation rejects non-numbers, `NaN`, infinities, excess fractional digits, and values outside the current `decimal(15,5)`, `decimal(12,3)`, or `decimal(5,2)` ranges.

### Decision: Product update requests require the mandatory fields

**Choice**: `UpdateProductoDto` MUST redeclare and require the mandatory Product fields directly — the denomination, the positive relation IDs, and the mandatory numeric rules — using the shared hardened helpers. Only genuinely optional fields remain optional on Product update. Explicit `null` is rejected. The catalog update DTOs (`Línea`, `Marca`, `Presentación`, `SuperLínea`) remain intentionally partial for their denomination and relation fields, and all four require a positive `usuarioUpdatedId` exactly as their existing update DTOs already did on the base revision: omission of the denomination (and of the relation/quantity fields where applicable) is allowed, while a present invalid value or an explicit `null` is rejected.

**Alternatives considered**: Inherit create rules through `PartialType` so present fields keep create validation; keep separately redeclared update fields; require every Product field on update; require the catalog mandatory fields on update; validate updates only after loading persistence state.

**Rationale**: The Product update endpoint is `@Put(':id')` (full replacement), the "Modificar Producto" user story lists every mandatory field as required, and the existing Product update controller tests require those fields. `PartialType` semantics would make the mandatory Product fields optional and rely on persisted state to reconstruct validity, which contradicts full replacement. The catalog update controller/service suites, by contrast, send partial payloads (for example, only `denominacion` plus `usuarioUpdatedId`); requiring the catalog mandatory fields would break those existing suites, and the project policy forbids modifying them. Catalog updates therefore keep create-level validation for present fields only: omission passes through `undefined`-only optionality, while a present invalid value and explicit `null` remain invalid. Requiring the mandatory Product fields keeps the Product create and update contracts aligned with the transport semantics.

### Decision: Validate the request state directly

**Choice**: Application and domain validation validate the request state. Because `UpdateProductoDto` requires every mandatory field, the Product update service validates the request values directly and passes them to the intrinsic domain service before uniqueness checks, relation lookups, or repository mutation. Línea, Marca, Presentación, and SuperLínea update services require a positive `usuarioUpdatedId` and validate the denomination (and, for Línea, the relation/quantity fields) only when present in the request; omission of those partial fields is allowed at the boundary, but a present invalid value still fails.

**Alternatives considered**: Load persisted state and compose an effective state with explicit undefined checks; validate only fields present in the update; move validation into repositories or entities.

**Rationale**: Full-replacement Product PUT requests already carry the mandatory fields, so merging request values with persisted state would both duplicate the contract and silently accept incomplete requests; catalog updates validate only the fields present in the request, so they need no persisted-state composition either. Validating the request state keeps a single source of truth, rejects explicit `null`, and leaves repositories and entities out of scope. No merge with persisted state is performed.

### Decision: Extend Product intrinsic validation and add catalog intrinsic services

**Choice**: Extend the real double-extension file `src/modules/gestion-productos/producto/domain/services/producto-intrinsic-validation.service.ts.ts`. Its validation input gains `costo`, `porcentaje`, `stock`, `stockMinimo`, stock/pack flags, and `cantidadPorPack`; it enforces requiredness, finiteness, storage precision/range, and the approved sign rules. Add focused intrinsic services for Línea, Marca, Presentación, and SuperLínea and inject them into their application services.

**Alternatives considered**: DTO-only validation; entity constructors/mutators; add the rules to deletion/creation policies with unrelated responsibilities; one cross-module domain service.

**Rationale**: DTO-only rules can be bypassed by direct service calls and would leave the eleven Product registration tests red. Entity changes are prohibited. Dedicated intrinsic services preserve each module's domain language and keep uniqueness/deletion policies focused.

Product rules are authoritative and unconditional for Product update requests: `costo >= 0`, `porcentaje > 0`, `stock > 0`, and `stockMinimo > 0`. Although `utilizaStockMinimo` controls downstream stock behavior, CR-001's approved mandatory rule and the eleven registration cases require `stockMinimo` even when the flag is false. `cantidadPorPack` is required and a positive integer only when `utilizaPack` is true.

### Decision: Reuse soft-delete-aware relation lookups

**Choice**: Validate positive integer relation IDs before any lookup, then use existing lookup paths: `MarcaService.findEntityById`, `LineaService.findEntityById`, `PresentacionRepository.findOne`, and `SuperLineaRepository.findOne`. These repository paths already exclude rows with `deletedAt` and therefore represent active records. Product continues to reject system Marca/Línea records through `ProductoValidationService`.

For full-replacement Product updates, all three required relations — `marcaId`, `lineaId`, and `presentacionId` — are resolved from the request before persistence. Línea resolves its required SuperLínea from the request `superLineaId` the same way.

**Alternatives considered**: New repository methods; database constraints; validate only changed relations; always write retained relation objects.

**Rationale**: Existing methods already express active soft-delete behavior. Validating every required request relation satisfies the specification without widening repository or persistence scope.

### Decision: Keep Producto-Operación as a DTO-only scaffold

**Choice**: Define `CreateProductoOperacionDto` with positive integer `productoId`, positive integer `operacionId`, and non-empty string `tipoOperacion` with a 255-character maximum. `UpdateProductoOperacionDto` remains `PartialType(CreateProductoOperacionDto)` and skips only omitted fields.

**Alternatives considered**: Resolve Product or operation relations; add a repository; change the entity; add business validation to `ProductoOperacionService`.

**Rationale**: The existing entity's inferred varchar contract supports a 255-character request bound, but persistence and business behavior are explicitly out of scope. DTO validation is exercised through isolated DTO/controller tests without changing the generated hardcoded service.

### Decision: Recognize validation failures by type, not response shape

**Choice**: Add `src/modules/common/validation/validation-error.factory.ts` containing a `RequestValidationException` and a pure recursive normalizer. `src/main.ts` supplies the factory to the global `ValidationPipe`. `GlobalExceptionFilter` appends `fieldErrors` only when `exception instanceof RequestValidationException`.

**Alternatives considered**: Detect any status-400 response with a `message[]`; parse validator message strings in the filter; expose raw `ValidationError[]`; globally change every `BadRequestException` response.

**Rationale**: Shape matching can misclassify application exceptions and expose arbitrary response data. A dedicated exception type creates an explicit trust boundary. The factory strips `target`, `value`, contexts, exception objects, and all unknown metadata before the filter sees public details; the emitted detail is composed only of sanitized public field names (safe identifier/index segments) and authored constraint messages.

Normalization rules are deterministic:

1. Traverse only `ValidationError.property`, `constraints`, and `children`.
2. Emit only sanitized public field names: accept safe identifier segments and numeric indexes; reject reserved or malformed segments.
3. Render nested object paths as `parent.child` and array indexes as `items[0].field`.
4. Sort fields lexicographically.
5. Sort constraints by constraint key, deduplicate their authored public messages, and emit only strings.

### Decision: Preserve the existing generic error envelope exactly

**Choice**: Recognized request-validation failures return HTTP 400 with the existing generic `message` value and one additive field:

```json
{
  "statusCode": 400,
  "timestamp": "2026-09-22T12:00:00.000Z",
  "path": "/api/producto",
  "message": "Bad Request Exception",
  "fieldErrors": [
    {
      "field": "denominacion",
      "messages": ["La denominación no puede superar los 200 caracteres."]
    },
    {
      "field": "marcaId",
      "messages": ["La marca debe ser un número entero positivo."]
    }
  ]
}
```

**Alternatives considered**: Replace `message` with validator messages; add raw exception response fields; include `fieldErrors` for all 400 errors.

**Rationale**: Clients retain `statusCode`, `timestamp`, `path`, and the same generic message. The ordered array makes field ordering explicit and supports nested paths without relying on JSON object key order. Non-validation exceptions follow the existing filter branch unchanged, including status, generic message, development-only diagnostics, and logging. Production validation responses never include stack traces, raw values, raw exceptions, class names, or database data.

## Data Flow

### Create/update validation and persistence

```text
HTTP input
   |
   v
ValidationPipe -> safe DTO transforms -> class-validator constraints
   | valid
   v
Application service -> validate request state
   |                  -> (update) load current record only for existence/uniqueness
   v
Intrinsic domain validation
   | valid
   v
uniqueness checks -> active relation lookups -> existing repository call
```

Every failed stage stops before subsequent lookups or persistence. Product relation lookup remains application orchestration: Marca and Línea are resolved through `ProductoRelatedEntitiesValidator`, Presentación through the existing soft-delete-aware repository path, and `ProductoValidationService` applies the current system-record policy.

### Recognized request-validation failure

```text
ValidationError[]
   |
   v
validation-error.factory -> safe sorted FieldValidationError[]
   |
   v
RequestValidationException
   |
   v
GlobalExceptionFilter -> existing envelope + fieldErrors -> HTTP 400
```

This sequence is included because the distinction between trusted validation metadata and arbitrary exceptions is security-sensitive. All other exceptions bypass the additive branch.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/modules/gestion-productos/common/validation/request-validation.helpers.ts` | Create | Non-throwing string/boolean/number/date transforms, undefined-only optional helper, and storage-compatible numeric constants/predicates. |
| `src/modules/gestion-productos/producto/dto/create-producto.dto.ts` | Modify | Enforce safe normalization, strict booleans, Product 200-character bound, required numeric state, finite decimal ranges/scales, conditional pack count, and positive relation/audit IDs. |
| `src/modules/gestion-productos/producto/dto/update-producto.dto.ts` | Modify | Require the mandatory Product fields for full-replacement PUT — denomination, positive relation IDs, and the mandatory numeric rules — using the shared hardened helpers; only genuinely optional fields remain optional; explicit `null` is rejected; require positive `usuarioUpdatedId`. |
| `src/modules/gestion-productos/producto/dto/actualizacion-precio.dto.ts` | Modify | Apply safe numeric transforms, finite storage bounds, positive IDs, and explicit-null rejection. |
| `src/modules/gestion-productos/producto/dto/update-precio.dto.ts` | Modify | Align dormant request validation without making the persistence flow reachable. |
| `src/modules/gestion-productos/producto/dto/search-producto-rapido.dto.ts` | Modify | Preserve unsupported boolean/query values for controlled validation. |
| `src/modules/gestion-productos/producto/dto/search-producto-pagination-with.dto.ts` | Modify | Strictly parse exact-match and stock flags; reject invalid present values. |
| `src/modules/gestion-productos/producto/dto/seach-informacion-producto.dto.ts` | Modify | Make date transformation non-throwing and reject explicit null/malformed dates. The existing misspelled filename is preserved. |
| `src/modules/gestion-productos/producto/dto/search-producto-superlinea.dto.ts` | Modify | Require a positive `superLineaId` while retaining existing pagination rules. |
| `src/modules/gestion-productos/linea/dto/create-linea.dto.ts` | Modify | Safe denomination, 255-character bound, strict boolean, fractional quantity contract, and positive IDs. The system-managed `createdAt` and the `deletedAt` field are intentionally retained as `@IsOptional()` (explicit `null` accepted): `deletedAt` preserves the existing `linea.controller.spec.ts` contract that sends `deletedAt: null`, a documented deviation from the no client-controlled deletion value intent. |
| `src/modules/gestion-productos/linea/dto/update-linea.dto.ts` | Modify | Validate present Línea update fields via the shared helpers: omission of denomination, `superLineaId`, and quantity is allowed, a present invalid value and explicit `null` are rejected, and the required `usuarioUpdatedId` must be a positive integer. |
| `src/modules/gestion-productos/linea/dto/select-linea.dto.ts` | Modify | Distinguish omission from explicit null for the optional search string. |
| `src/modules/gestion-productos/marca/dto/create-marca.dto.ts`, `src/modules/gestion-productos/marca/dto/update-marca.dto.ts` | Modify | Safe 255-character denomination and positive create/update audit identifiers; the catalog update requires a positive `usuarioUpdatedId` and validates the denomination only when present. |
| `src/modules/gestion-productos/presentacion/dto/create-presentacion.dto.ts`, `src/modules/gestion-productos/presentacion/dto/update-presentacion.dto.ts`, `src/modules/gestion-productos/presentacion/dto/select-presentacion.dto.ts` | Modify | Preserve safe transforms, reject explicit null, and enforce denomination/audit-ID rules; the catalog update requires a positive `usuarioUpdatedId` and validates the denomination only when present. |
| `src/modules/gestion-productos/superlinea/dto/create-superlinea.dto.ts`, `src/modules/gestion-productos/superlinea/dto/update-superlinea.dto.ts`, `src/modules/gestion-productos/superlinea/dto/select-superlinea.dto.ts` | Modify | Enforce safe 255-character denomination, undefined-only optionality, and positive audit IDs; the catalog update requires a positive `usuarioUpdatedId` and validates the denomination only when present. |
| `src/modules/gestion-productos/producto-operacion/dto/create-producto-operacion.dto.ts`, `src/modules/gestion-productos/producto-operacion/dto/update-producto-operacion.dto.ts` | Modify | Add the validated scaffold contract without changing service or persistence behavior. |
| `src/modules/gestion-productos/producto/domain/services/producto-intrinsic-validation.service.ts.ts` | Modify | Add mandatory numeric, finite decimal, request-state, and conditional pack rules to the existing double-extension service. |
| `src/modules/gestion-productos/{linea,marca,presentacion,superlinea}/domain/services/*-intrinsic-validation.service.ts` | Create | Add module-local intrinsic validation for denomination, IDs, and applicable quantity state. |
| `src/modules/gestion-productos/producto/application/services/producto.service.ts` | Modify | Validate the create/update request state and resolve every required active relation before persistence. |
| `src/modules/gestion-productos/{linea,marca,presentacion,superlinea}/application/services/*.service.ts` | Modify | Invoke intrinsic validation on the request state before uniqueness/relation/persistence work. |
| `src/modules/gestion-productos/{linea,marca,presentacion,superlinea}/*.module.ts` | Modify | Register each new intrinsic validation service as a provider. |
| `src/modules/common/validation/validation-error.factory.ts` | Create | Define the recognized exception type and safe deterministic `ValidationError` normalizer. |
| `src/main.ts` | Modify | Configure the existing global `ValidationPipe` with the custom exception factory; preserve unrelated bootstrap behavior. |
| `src/modules/common/filters/global-exception.filters.ts` | Modify | Append `fieldErrors` only for `RequestValidationException`; leave all other response and logging paths unchanged. |
| `src/modules/gestion-productos/**/*.spec.ts` | Modify only where strictly necessary | Replace the obsolete `FAIL BY DESIGN` comment in `producto.service.registro.spec.ts` with the approved expectation. The existing suites are the specification; no new spec files or test cases are created. |

No entity, mapper, repository, shared column decorator, migration, or schema file is modified. `producto-operacion.service.ts` and its entity remain unchanged.

## Interfaces / Contracts

### Intrinsic Product state

```ts
interface ProductoIntrinsicState {
  denominacion: unknown;
  costo: unknown;
  porcentaje: unknown;
  stock: unknown;
  stockMinimo: unknown;
  marcaId: unknown;
  lineaId: unknown;
  presentacionId: unknown;
  utilizaStockMinimo: unknown;
  utilizaPack: unknown;
  cantidadPorPack?: unknown;
  alicuotaIva?: unknown;
}
```

Using `unknown` at this defense-in-depth boundary prevents direct service callers from bypassing runtime checks through TypeScript assertions. Successful validation narrows values for orchestration; it does not mutate entities.

### Public validation detail

```ts
interface FieldValidationError {
  field: string;
  messages: string[];
}

interface RequestValidationErrorResponse {
  statusCode: 400;
  timestamp: string;
  path: string;
  message: 'Bad Request Exception';
  fieldErrors: FieldValidationError[];
}
```

`fieldErrors` exists only for failures created by the global `ValidationPipe` exception factory. Application-thrown `BadRequestException`, `NotFoundException`, conflict/database exceptions, and unexpected errors retain their current response shape and do not receive this field.

### Numeric contracts

| Kind | Persistence reference | Maximum | Fractional digits | Product sign rule |
|---|---|---:|---:|---|
| Money | `decimal(15,5)` | `9,999,999,999.99999` | 5 | `costo >= 0` |
| Quantity | `decimal(12,3)` | `999,999,999.999` | 3 | `stock > 0`, `stockMinimo > 0` |
| Percentage | `decimal(5,2)` | `999.99` | 2 | `porcentaje > 0` |

All values must be finite numbers. Positive integer contracts apply to relation IDs, audit IDs, and `cantidadPorPack` when required.

## Testing Strategy

Existing test suites are the specification for this change. No new test files or test cases are authored, so strict TDD is a documented, scoped exception: implementation must make the existing suites pass rather than starting from authored RED tests. The only permitted test edit is replacing the obsolete `FAIL BY DESIGN` comment in `producto.service.registro.spec.ts` with the approved CR-001 expectation; no other assertion is weakened or extended.

Suites that MUST stay green:

- `yarn test` — the existing unit manifest, including the eleven `producto.service.registro.spec.ts` rejection cases.
- `yarn test:integration` — the existing Testcontainers suites, where Docker is available.
- `yarn build`.

Accepted coverage limitation: because no tests are added, the following changed areas have NO existing automated coverage and will not gain any under this policy:

- Marca, Presentación, and `producto-operacion` DTO validation.
- Global validation-error communication (`validation-error.factory`, the `GlobalExceptionFilter` additive branch, and the `main.ts` pipe wiring).

This gap is an accepted limitation of the no-new-tests decision, not an oversight, and it must be reported honestly rather than implied to be covered.

`yarn test` and `yarn test:integration` only execute files listed in their respective JSON manifests.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary is changed. The global HTTP error boundary is covered by production-safety tests but does not trigger the process-integration threat matrix.

## Migration / Rollout

No migration required. No feature flag is needed because no persisted representation changes.

Deploy DTO, domain/application validation, and pipe/filter handling together so every accepted request and every validation response follows one contract. Existing clients that send coerced booleans, zero/negative IDs, explicit nulls, excessive precision, or incomplete Product state will begin receiving HTTP 400; this is intentional but should be called out in release notes.

Rollback is application-only: revert the validation-detail factory/filter/bootstrap changes first if the additive response causes client issues, then revert DTO and service/domain validation together with their existing suites as one unit. No data or schema rollback is required.

The expected implementation diff still exceeds the 400-line review budget once the DTO work is combined, so the work is re-sliced into reviewable units: PR1a shared validation helpers + Product DTOs, PR1b catalog DTOs (`linea`, `marca`, `presentacion`, `superlinea`), PR1c Product search DTOs + `producto-operacion` DTOs, PR2 Product domain/application numeric rules, PR3 catalog domain/application services, and PR4 global validation-error communication. Under the session's `ask-on-risk` strategy, confirm the delivery decision before apply if the risk remains high.

## Open Questions

None.
