## Exploration: CR-001 Product Management Validation

### Current State

Product, line, and brand DTOs normalize denominations before checking their type. Product write boolean transforms collapse every unsupported value to `false`, while optional validation can also skip `null`. Product-search DTOs have a related failure mode: `SearchProductoRapidoDto.exacto` and `SearchProductoPaginationWithDto.codReferenciaExacto`, `codProveedorExacto`, and optional `conStock` transform unsupported values to `undefined`. In particular, `@IsOptional()` then hides invalid `conStock` input instead of rejecting it. `SearchInformacionProductoDto.fechaHasta` constructs a date and shifts valid values to the end of the UTC day; invalid dates must remain rejectable without a thrown transformation error or silent acceptance. Numeric DTO rules do not consistently match the TypeORM column contracts: money is `decimal(15,5)`, quantities are `decimal(12,3)`, and percentages are `decimal(5,2)`. Product denomination is additionally limited to 200 characters by the domain service, despite the entity using `text` and the DTO allowing 255.

The global `ValidationPipe` uses Nest's default exception factory. The installed NestJS 11 implementation flattens `ValidationError[]` into message strings before constructing `BadRequestException`; therefore, the global filter can preserve `message`, but it cannot reliably reconstruct property names from those strings. The filter currently ignores `getResponse()` and emits `exception.message`, which reduces validation failures to `Bad Request Exception`.

### Affected Areas

- `src/modules/gestion-productos/producto/dto/` — unsafe transforms, numeric bounds, conditional values, positive references, and inconsistent messages.
- `src/modules/gestion-productos/producto/dto/search-producto-rapido.dto.ts` — strict parsing for `exacto`.
- `src/modules/gestion-productos/producto/dto/search-producto-pagination-with.dto.ts` — strict parsing for exact-match flags and optional `conStock` without hiding invalid input.
- `src/modules/gestion-productos/producto/dto/seach-informacion-producto.dto.ts` — safe date parsing with explicit inclusive `fechaHasta` semantics; the existing filename typo is retained to avoid an unrelated rename.
- `src/modules/gestion-productos/producto/domain/entities/producto.entity.ts` — persistence precision and length evidence for DTO boundaries.
- `src/modules/gestion-productos/linea/` — fractional minimum stock and conditional validation.
- `src/modules/gestion-productos/marca/` — safe denomination normalization and aligned create/update rules.
- `src/main.ts` — the `ValidationPipe` exception factory is the last point where structured property paths exist.
- `src/modules/common/filters/global-exception.filters.ts` — public error-envelope preservation and production-safe output.

### Approaches

1. **DTO-local decorators and filter-side message parsing** — add validators in each DTO and infer `fieldErrors` keys from flattened strings.
   - Pros: Small initial code change.
   - Cons: Duplicates rules; string parsing is coupled to message wording and cannot safely support nested fields.
   - Effort: Medium

2. **Reusable request-value primitives and structured pipe errors** — centralize safe transforms for writes and product searches under a neutral name, create `fieldErrors` while `ValidationError[]` still contain property paths, and make the filter preserve the structured HTTP response.
   - Pros: Deterministic grouping, shared create/update behavior, direct alignment with persistence limits, and no reliance on message parsing.
   - Cons: Touches both bootstrap validation configuration and the filter; recursive error flattening requires careful implementation.
   - Effort: Medium

### Recommendation

Use reusable, side-effect-free transforms in a neutral `request-value.transforms.ts`: trim/lowercase only strings, convert only exact JSON booleans or lowercase strings `"true"` and `"false"`, and leave every other value unchanged so validation rejects it. For optional booleans, skip only an absent value (`undefined`), not `null` or malformed input. Apply the same strict parser to `exacto`, `codReferenciaExacto`, `codProveedorExacto`, and `conStock`; an unsupported query representation must reach validation and produce a controlled 400.

For `SearchInformacionProductoDto.fechaHasta`, preserve the documented inclusive boundary by converting a valid date to `23:59:59.999` UTC. Invalid input must remain an invalid, validator-rejectable date value and must neither throw during transformation nor be replaced with an accepted default. `fechaDesde` remains validated as a date and is not made inclusive.

Match DTO boundaries to persistence: money `0..9,999,999,999.99999` with at most 5 decimals; stock and minimum stock `0..999,999,999.999` with at most 3 decimals; pack quantity as an integer of at least 1; percentage within `decimal(5,2)` with at most 2 decimals. The codebase does not establish whether a negative percentage represents a discount, so do not introduce a non-negative rule beyond the existing specification. Treat this as a business decision before changing percentage semantics. Keep VAT closed to `0`, `10.5`, `21`, and `27`.

Build `message` and recursive dot-path `fieldErrors` in a custom `ValidationPipe.exceptionFactory`, then have the global filter use `HttpException.getResponse()` as the public source. Preserve `statusCode`, `timestamp`, and `path`; never emit stack traces or raw exceptions in production. Avoid deriving field names from localized messages.

Testing is explicitly deferred from CR-001. This change must not create or modify test cases or test files; the project-level `strict_tdd` configuration remains unchanged and applies again when the deferred verification work is authorized.

Implementation is paused by explicit project direction. Documentation may be aligned, but no source or test changes may begin until CR-001 is explicitly resumed.

External `sdd-research` is not needed. Repository code, TypeORM column metadata, installed NestJS source, the confirmed equivalence between `Producto.porcentaje` and the domain margin, and the existing specifications are sufficient for the technical design.

### Risks

- Tightening booleans intentionally turns previously coerced payloads into HTTP 400 responses and may expose client dependencies on invalid inputs.
- Search clients that rely on malformed boolean filters being ignored will now receive HTTP 400.
- Date-only `fechaHasta` inputs retain end-of-UTC-day semantics; clients sending timestamps must not assume a different timezone interpretation beyond the documented contract.
- `@IsOptional()` accepts `null`; reusing it unchanged would violate the strict boolean scenarios.
- JavaScript message parsing would make `fieldErrors` unstable when validator text or language changes.
- Applying conditional requirements to partial updates must evaluate the effective state; DTO-only checks see only the patch and can require a companion value when a flag is explicitly changed to `true`, but cannot infer an omitted persisted flag.
- The allowed margin sign and exact calculation behavior remain domain decisions; silently guessing either would create a false contract.

### Ready for Proposal

Yes from a planning perspective. The proposal, specifications, design, and tasks can describe the expanded search scope, but implementation remains paused until explicit user authorization. The equivalence between `Producto.porcentaje` and the domain margin is settled; the design avoids inventing sign, range, calculation, or update behavior beyond confirmed domain evidence while allowing persistence-aligned precision validation.
