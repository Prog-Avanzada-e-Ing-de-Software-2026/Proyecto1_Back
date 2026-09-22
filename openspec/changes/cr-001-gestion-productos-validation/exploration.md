# Exploration: CR-001 — Validation of invalid data across `gestion-productos`

> Read-only exploration. No source or test files were modified. This artifact supersedes the
> prior paused planning (proposal/specs/design/tasks) in this change folder.

## Current State

CR-001 ("Validación de datos: evitar valores inválidos, mostrar errores claros, no permitir
guardar datos incorrectos") has **no domain impact**: no new entities or Value Objects. The
work is enforcement of *existing* business rules across the four layers of every write/read
path in `src/modules/gestion-productos/`.

The module is a NestJS/DDD implementation with one submodule per aggregate
(`producto`, `linea`, `marca`, `presentacion`, `superlinea`) plus the `producto-operacion`
scaffold. Each submodule follows `dto/` → `application/controllers` → `application/services`
→ `domain/services` + `domain/entities` → `infraestructure/repositories`.

Validation today is **fragmented and inconsistent across layers**:

- DTOs use `class-validator`, but several `@Transform` callbacks are unsafe (call `.trim()` on
  non-strings, collapse any invalid boolean to `false`, or erase invalid query values to
  `undefined`), and numeric/length/reference rules do not match the TypeORM column contracts
  or the domain service.
- Application services enforce uniqueness and relation existence, but **do not enforce the
  numeric invariants** the "Registrar/Modificar Producto" HU requires (`costo`, `margen`/
  `porcentaje`, `stock`, `stockMinimo`).
- Domain services enforce denomination length (200), relation IDs `> 0`, `sistema` flags, and
  optional price hierarchy, but the hierarchy fields do not exist in the entity/DTO.
- Entities hold rich *price-change* behavior but no creation-time invariant enforcement.

### Global pipeline (context only — OUT of scope)

`src/main.ts` configures `ValidationPipe({ transform, whitelist, forbidNonWhitelisted })` with
Nest's default exception factory, and `GlobalExceptionFilter` emits `exception.message`,
collapsing validation failures to `Bad Request Exception`. Both live in `src/modules/common/`
and `src/main.ts`, which the new scope **excludes**. This exploration therefore treats the
error-shape problem as a documented gap, not a CR-001 deliverable.

### Test baseline (measured, not assumed)

`TEST_SUITE=without-testcontainers node node_modules/jest/bin/jest.js` →
**26 suites, 195 tests: 184 pass, 11 fail.** All 11 failures are in
`producto/application/services/producto.service.registro.spec.ts` and are explicitly
documented in that file as **"FAIL BY DESIGN"**:

> "La mayoría de los rechazos esperados … NO están implementados en el modelo de producción:
> `costo`, `porcentaje` (margen), `stock` (stockActual) y `stockMinimo` (stockMínimo) son
> opcionales y no se validan a nivel de servicio. Esas filas fallan EXPRESAMENTE (FAIL BY
> DESIGN) y no deben 'arreglarse' tocando código de producción."

The failing cases expect `BadRequestException` for missing/`0`/`-1` `costo`, `porcentaje`,
`stock`, `stockMinimo` — exactly the rules CR-001 is meant to enforce. **This is the single
most important conflict in this exploration** (see Risks / Ready for Proposal).

Integration suite (`with-testcontainers.json`) requires Docker and was **not run**.

## Affected Areas

### 1. DTOs (request boundary)

- `producto/dto/create-producto.dto.ts`
  - `denominacion`: `@Transform(({value}) => value.trim().toLowerCase())` throws a `TypeError`
    for `undefined`/`null`/number **before** `@IsString` can return a controlled 400 → 500.
    `@MaxLength(255)` message wrongly reads "no puede estar vacía"; domain service caps at 200;
    entity column is `text` (no DB limit). Three different limits.
  - `costoEnDolar`, `destacado`, `envioGratis`: `@Transform(v => v === 'true' || v === true)`
    silently coerces every other value (`1`, `"yes"`, `null`) to `false`; `@IsOptional()` also
    accepts `null`.
  - `utilizaStockMinimo`, `utilizaPack`: required `@IsBoolean()` with **no transform** →
    rejects the `"true"`/`"false"` strings the other booleans accept. Inconsistent contract.
  - Numeric: `costo`, `porcentaje`, `precio` are bare `@IsNumber()` (no `@Min`, no precision);
    `stock`, `stockMinimo` are `@IsInt()` although the entity uses `CantidadColumn`
    `decimal(12,3)` (fractional quantities); `cantidadPorPack` has no `@Min(1)`.
  - References `lineaId`, `marcaId`, `presentacionId`, `usuarioCreatedId`: `@IsNotEmpty` +
    `@IsInt` accepts `0` and negatives (`@IsNotEmpty` only rejects `null`/`undefined`/`''`).
    The domain service re-checks the three relation IDs `> 0` but **not** `usuarioCreatedId`.
- `producto/dto/update-producto.dto.ts`
  - Extends `PartialType(OmitType(CreateProductoDto, [...]))` then re-declares the omitted
    fields, so updates actually **require** `costo`, `porcentaje`, `stock`, `stockMinimo`,
    `marcaId`, `lineaId`, `presentacionId`, `denominacion` despite the "Partial" name.
  - `denominacion` regex differs from create (`-` only vs create's `\w % - / .`); no 200-char
    alignment; `usuarioUpdatedId` accepts `0`/negatives.
- `producto/dto/actualizacion-precio.dto.ts` — active bulk-price DTO. `valor` uses
  `@Transform(Number)` (NaN fails `@IsNumber`, `null`→`0` fails `@IsPositive`); `lineaId`
  `@IsOptional()+@IsInt` accepts `0`. Covered by `actualizacion-precio.dto.spec.ts`.
- `producto/dto/update-precio.dto.ts` — **dormant**: referenced only by the repository/mapper
  chain (`actualizarPrecio`), which no controller/service invokes. `usuarioId` is `@IsNumber()`
  (not `@IsInt`, not positive); `porcentaje` `@Min(0)` allows `0`; copy-pasted
  `'skip debe ser…'` messages.
- `producto/dto/search-producto-rapido.dto.ts` — `exacto` transform returns `undefined` for
  unsupported values; with no `@IsOptional` it still fails `@IsBoolean`, but the message is
  generic.
- `producto/dto/search-producto-pagination-with.dto.ts` — `codReferenciaExacto` /
  `codProveedorExacto` same pattern; **`conStock` has `@IsOptional()` + transform→`undefined`,
  so an invalid `conStock` is silently dropped** instead of rejected. `codigoProveedor` /
  `codigoReferencia` are typed `: string` but decorated `@IsOptional()`.
- `producto/dto/seach-informacion-producto.dto.ts` — **not wired to any route** (no controller
  reference). `fechaHasta` transform returns `Invalid Date` for garbage (fails `@IsDate`), but
  `new Date(null)` → epoch is silently accepted.
- `linea/dto/create-linea.dto.ts` — unsafe `value.trim()` transform; `stockMinimo` `@IsInt()`
  vs `decimal(12,3)`; `superLineaId`/`usuarioCreatedId` accept `0`/negatives; `deletedAt`
  exposed as client input.
- `linea/dto/update-linea.dto.ts` — `superLineaId` `@ValidateIf(v !== undefined)` correctly
  rejects `null` (tested), but still accepts `0`/negatives.
- `marca/dto/create-marca.dto.ts`, `marca/dto/update-marca.dto.ts` — unsafe `value.trim()`
  transform; audit IDs accept `0`/negatives.
- `presentacion/dto/create-presentacion.dto.ts`, `update-presentacion.dto.ts` — guarded
  transform (good); `usuarioCreatedId`/`usuarioUpdatedId` accept `0`/negatives.
- `superlinea/dto/create-superlinea.dto.ts`, `update-superlinea.dto.ts` — guarded transform
  (good); audit IDs accept `0`/negatives. No DB unique index (removed by migration); uniqueness
  is service-enforced.
- `producto-operacion/dto/*` — `CreateProductoOperacionDto` is **empty `{}`**; no validation.

### 2. Application services (orchestration)

- `producto/application/services/producto.service.ts` — `validarYPrepararCreacion` /
  `validarYPrepararActualizacion` call intrinsic validation, uniqueness (`excludeId` on update),
  relation existence, `sistema` policy, and user existence. **No numeric validation** for
  `costo`/`porcentaje`/`stock`/`stockMinimo` (root cause of the 11 red tests).
- `linea/application/services/linea.service.ts` — uniqueness via `findByDenominacionWith` with
  `id` exclusion; `findActiveSuperLinea`. `create` skips `ensureNotSistemaEntity` (only
  update/remove check it).
- `marca/application/services/marca.service.ts` — uniqueness with `id` exclusion; `create` skips
  `sistema` check.
- `presentacion/application/services/presentacion.service.ts` — uniqueness via
  `PoliticaCreacionPresentacion` with `excludeId`.
- `superlinea/application/services/superlinea.service.ts` — uniqueness via
  `PoliticaCreacionSuperLinea` with `excludeId`.
- **Duplication**: uniqueness exists in both an infra validator
  (`producto/infraestructure/validators/producto-uniqueness.validator.ts`) and a second domain
  helper (`producto/domain/helpers/producto-validator.helper.ts`) that is **dead code** (no
  imports, not registered in `producto.module.ts`; its `validarMarcaLinea` never fetches
  `linea`). No `@IsUniqueDenominacion` decorator exists anywhere in `src`.

### 3. Domain services

- `producto/domain/services/producto-intrinsic-validation.service.ts.ts` — denomination
  required + `≤ 200`; relation IDs `> 0`; optional price hierarchy (`precioMayorista`/
  `precioCliente`/`precioOcasional` — **fields that exist nowhere else**); `alicuotaIva` 0..100
  (DTO enum is stricter: only 0/10.5/21/27). No numeric product rules.
- `producto/domain/services/producto-validation.service.ts.ts` — rejects `sistema === 1`
  marca/linea.
- `{linea,marca,presentacion,superlinea}/domain/services/politica-eliminacion-*.service.ts` —
  deletion guards, implemented and tested.
- `presentacion|superlinea/domain/services/politica-creacion-*.service.ts` — uniqueness policies.
- Note: the file names contain a double extension (`*.service.ts.ts`) and one service is not
  `@Injectable()` (`PoliticaCreacionPresentacion`, `PoliticaCreacionSuperLinea`).

### 4. Entities / domain invariants

- `producto/domain/entities/producto.entity.ts` — columns: `denominacion` `text`,
  `codigoProveedor` `varchar(255)`, money `decimal(15,5)` (`MonetarioColumn`), quantities
  `decimal(12,3)` (`CantidadColumn`), `porcentaje`/`alicuotaIva` `decimal(5,2)`
  (`PorcentajeColumn`). Rich price behavior (`cambiarPrecio`, `aumentar/disminuir*`) throws
  plain `Error` (→ 500 through the filter), not `HttpException`. No creation-time invariant
  enforcement; `precio` is nullable while the HU calls it required.
- `producto/domain/entities/cambio-precio.entity.ts` — `precioAnterior`/`precioNuevo`
  money columns; `motivo` varchar(255); `fecha` timestamp.
- `linea/domain/entities/linea.entity.ts` — unique index `(denominacion, deletedAt)`;
  `stockMinimo` `decimal(12,3)`.
- `marca/domain/entities/marca.entity.ts` — unique index `(denominacion, deletedAt)`.
- `presentacion/domain/entities/presentacion.entity.ts` — unique index on `denominacion`.
- `superlinea/domain/entities/superlinea.entity.ts` — no unique index.
- `producto-operacion/entities/producto-operacion.entity.ts` — referenced by `Producto` via
  `productosOperacion`.

### 5. Existing tests that constrain the change

- DTO unit specs: `linea/dto/linea.dto.spec.ts`, `linea/dto/select-linea.dto.spec.ts`,
  `superlinea/dto/superlinea.dto.spec.ts`, `producto/dto/search-producto-superlinea.dto.spec.ts`,
  `producto/dto/actualizacion-precio.dto.spec.ts`. No DTO spec for `producto` create/update,
  `marca`, or `presentacion`.
- Service unit specs: `presentacion.service.spec.ts`, `linea.service.spec.ts`,
  `marca.service.spec.ts`, `superlinea.service.spec.ts`,
  `producto/domain/services/producto-intrinsic-validation.service.spec.ts` (200-char boundary),
  `producto/domain/entities/producto.entity.spec.ts` (price invariants).
- **Red**: `producto.service.registro.spec.ts` (11 tests, "FAIL BY DESIGN").
- Integration: `producto.registro.int-spec.ts` (200-char `BadRequestException`, duplicate
  `ConflictException`, inactive presentation `NotFoundException`),
  `marca.http.int-spec.ts` (400 for `>255`), `superlinea.persistence-adapter.int-spec.ts`
  (CP-63 note). Integration not executed here.

### 6. `producto-operacion` — in scope?

**Evidence says exclude.** Its DTOs are empty, its service returns hardcoded strings
(`'This action adds a new productoOperacion'`), it has no `class-validator` usage, and it has no
persistence contract wired into the write/read validation paths. Its only coupling is the
`Producto.productosOperacion` relation, which is unrelated to CR-001 input validation. It is
inside the module folder but is a generator scaffold, not a validated aggregate.

## Difference vs. the prior paused change

| Aspect | Prior (paused) plan | New scope |
|---|---|---|
| Global exception filter / `ValidationPipe` factory | In scope (`src/modules/common/filters`, `src/main.ts`, new `validation-error.factory.ts`) | **Excluded** (outside `gestion-productos`) |
| Product-search DTOs | In scope | Still relevant, but only as `gestion-productos` DTOs |
| Application/domain service validation | Not addressed | **In scope** |
| Entity invariants | Not addressed | **In scope** |
| Existing tests | Explicitly excluded ("do not create or modify tests") | **In scope** (must not break/duplicate) |
| `producto-operacion` | Excluded | Reported for decision (evidence → exclude) |

## Approaches

1. **Boundary-only hardening** — fix unsafe `@Transform`s and add `class-validator`
   constraints (lengths, numeric bounds, precision, positive IDs, strict booleans) in every
   `gestion-productos` DTO.
   - Pros: smallest blast radius; keeps changes at the transport edge; aligns with Nest idioms.
   - Cons: leaves the 11 red service tests red; HU rules enforced only when a request passes
     through the pipe; service is still callable with invalid data internally; does not address
     entity invariants.
   - Effort: Low–Medium

2. **Full-layer enforcement** — DTO hardening **plus** required numeric invariants in
   `ProductoIntrinsicValidationService` (and `LineaService`/`MarcaService` where relevant)
   **plus** creation-time guards/consistency in entities; update the existing specs so the
   "FAIL BY DESIGN" cases become green.
   - Pros: satisfies the "Registrar/Modificar Producto" HU; defense in depth; existing tests
     become meaningful; matches the user's stated layer coverage.
   - Cons: changes observable behavior; flips 11 intentionally-red tests; needs explicit
     authorization because the spec file currently forbids fixing them via production code;
     larger diff.
   - Effort: Medium–High

3. **Staged: boundary + domain service, entity invariants deferred** — fix DTOs and add the
   missing required-numeric rules in the domain/application services; keep entities untouched
   except where they already own the rule (price changes).
   - Pros: covers the HU and the 11 tests without over-reaching into entity redesign; clean
     rollback boundary.
   - Cons: entity can still be constructed in an invalid state in code; some duplication with
     DTO constraints.
   - Effort: Medium

## Recommendation

Adopt **Approach 3 as the baseline, with the option to promote to Approach 2** for the
creation-time invariants that the HU names as mandatory:

1. **DTOs** — make every `@Transform` non-throwing and side-effect-free (guard non-strings
   before `.trim()`; never coerce invalid booleans; never erase invalid query values); align
   numeric constraints to the column contracts (money `decimal(15,5)`, quantities
   `decimal(12,3)`, percentages `decimal(5,2)`); require positive relation/audit IDs; apply the
   same rules on create and update; fix the three conflicting denomination limits (choose 200
   for product per the HU, 255 for linea/marca/presentacion/superlinea).
2. **Application/domain services** — enforce the HU's required numeric invariants
   (`costo ≥ 0`, `porcentaje/margen > 0`, `stock > 0`, `stockMinimo > 0`) in
   `ProductoIntrinsicValidationService` and the linea equivalents, using the effective state on
   update. This is what turns `producto.service.registro.spec.ts` green.
3. **Entities** — only align what already belongs there; avoid inventing new aggregates, VOs,
   events, or pricing rules (per AGENTS.md).
4. **Keep excluded**: `src/modules/common/`, `src/main.ts`, auth/users/system, and
   `producto-operacion`.
5. **Tests** — do not modify existing assertions to hide regressions. Adding *new* focused specs
   for the CR-001 rules is consistent with the new scope; reconciling the 11 red cases is a
   **user decision** (see below).

This keeps CR-001 an enforcement change, not a domain redesign, and honors the hard scope
boundary.

## Risks

- **Red-test conflict (blocking decision).** `producto.service.registro.spec.ts` says the
  `costo`/`margen`/`stock`/`stockMinimo` rejections "no deben arreglarse tocando código de
  producción", while the new scope includes service validation and existing tests. CR-001 cannot
  both enforce those HU rules and leave the file's comment true. The user must confirm whether
  CR-001 is authorized to make those 11 tests pass.
- **Unsafe transforms are live 500s.** `value.trim()` on a non-string throws during
  transformation; Nest's default factory turns that into an unhandled error, not a 400. Fixing
  them is low-risk but changes some 500s into 400s.
- **Stricter booleans/IDs change client contracts.** Payloads relying on `1`/`"yes"`/`0` being
  coerced or accepted will start returning 400.
- **Denomination limit ambiguity.** Choosing 200 (HU) vs 255 (DTO/column) changes accepted
  input; the entity column (`text`) imposes no DB limit, so the domain service is the only
  current 200-char gate.
- **Unused search DTO.** `SearchInformacionProductoDto` is not wired to any route; changing it
  has no runtime effect until a route uses it — validate scope before investing there.
- **Entity `Error` vs `HttpException`.** Entity invariant failures surface as 500 through the
  global filter (which is out of scope), so entity-level messages may not reach clients clearly.
- **Duplicate/stale code.** The dead `ProductoValidator` helper and the dormant
  `UpdatePrecioDto` path invite accidental duplication; decide whether CR-001 cleans them up or
  leaves them.
- **Integration suite unverified.** Testcontainers specs (including the CP-63 superlinea
  uniqueness assertions) were not run; they must be run before claiming CR-001 conformance.

## Ready for Proposal

**Yes, with one required decision.** The layer map, affected files, and test baseline are
complete enough to write proposal/spec/design/tasks. Before `sdd-propose` finalizes scope, the
orchestrator must ask the user to resolve the red-test conflict:

> CR-001's scope now includes application/domain service validation and existing tests, but
> `producto.service.registro.spec.ts` documents its 11 failing `costo`/`margen`/`stock`/
> `stockMinimo` cases as "FAIL BY DESIGN — must not be fixed via production code." Should
> CR-001 enforce those mandatory rules and make those tests pass?

Recommended answers to carry into the proposal (pending user confirmation):
`producto-operacion` excluded; `src/modules/common/` and `src/main.ts` excluded; error-envelope
redesign deferred; Approach 3 (promote to 2 only if the user authorizes entity-level creation
invariants).
