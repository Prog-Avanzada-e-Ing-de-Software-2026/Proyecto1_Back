## Exploration: CR-001 Product Management Validation

### Current State

Product, line, and brand DTOs normalize denominations before checking their type. Product boolean transforms collapse every unsupported value to `false`, while optional validation can also skip `null`. Numeric DTO rules do not consistently match the TypeORM column contracts: money is `decimal(15,5)`, quantities are `decimal(12,3)`, and percentages are `decimal(5,2)`. Product denomination is additionally limited to 200 characters by the domain service, despite the entity using `text` and the DTO allowing 255.

The global `ValidationPipe` uses Nest's default exception factory. The installed NestJS 11 implementation flattens `ValidationError[]` into message strings before constructing `BadRequestException`; therefore, the global filter can preserve `message`, but it cannot reliably reconstruct property names from those strings. The filter currently ignores `getResponse()` and emits `exception.message`, which reduces validation failures to `Bad Request Exception`.

`producto-operacion` is scaffold code: its DTOs are empty, its service returns fixed strings, and no write reaches TypeORM. The entity suggests `producto`, a positive `operacionId`, and `tipoOperacion`, but the repository contains no authoritative closed set of operation types.

### Affected Areas

- `src/modules/gestion-productos/producto/dto/` — unsafe transforms, numeric bounds, conditional values, positive references, and inconsistent messages.
- `src/modules/gestion-productos/producto/domain/entities/producto.entity.ts` — persistence precision and length evidence for DTO boundaries.
- `src/modules/gestion-productos/linea/` — fractional minimum stock and conditional validation.
- `src/modules/gestion-productos/marca/` — safe denomination normalization and aligned create/update rules.
- `src/modules/gestion-productos/producto-operacion/` — preventive contract gate before persistence is implemented.
- `src/main.ts` — the `ValidationPipe` exception factory is the last point where structured property paths exist.
- `src/modules/common/filters/global-exception.filters.ts` — public error-envelope preservation and production-safe output.
- Product DTO unit tests and HTTP/e2e tests — boundary, transformation, field grouping, and no-persistence evidence.

### Approaches

1. **DTO-local decorators and filter-side message parsing** — add validators in each DTO and infer `fieldErrors` keys from flattened strings.
   - Pros: Small initial code change.
   - Cons: Duplicates rules; string parsing is coupled to message wording and cannot safely support nested fields.
   - Effort: Medium

2. **Reusable validation primitives and structured pipe errors** — centralize safe transforms and numeric policies, create `fieldErrors` while `ValidationError[]` still contain property paths, and make the filter preserve the structured HTTP response.
   - Pros: Deterministic grouping, shared create/update behavior, direct tests against persistence limits, and no reliance on message parsing.
   - Cons: Touches both bootstrap validation configuration and the filter; recursive error flattening needs focused tests.
   - Effort: Medium

### Recommendation

Use reusable, side-effect-free transforms: trim/lowercase only strings, convert only exact JSON booleans or lowercase strings `"true"` and `"false"`, and leave every other value unchanged so validation rejects it. For optional booleans, skip only `undefined`, not `null`.

Match DTO boundaries to persistence: money `0..9,999,999,999.99999` with at most 5 decimals; stock and minimum stock `0..999,999,999.999` with at most 3 decimals; pack quantity as an integer of at least 1; percentage within `decimal(5,2)` with at most 2 decimals. The codebase does not establish whether a negative percentage represents a discount, so do not introduce a non-negative rule beyond the existing specification. Treat this as a business decision before changing percentage semantics. Keep VAT closed to `0`, `10.5`, `21`, and `27`.

Build `message` and recursive dot-path `fieldErrors` in a custom `ValidationPipe.exceptionFactory`, then have the global filter use `HttpException.getResponse()` as the public source. Preserve `statusCode`, `timestamp`, and `path`; never emit stack traces or raw exceptions in production. Avoid deriving field names from localized messages.

For `producto-operacion`, define the future minimum shape as `productoId` and `operacionId` positive integers plus an enum-backed `tipoOperacion`. Do not invent enum members from comments and do not enable persistence until the domain owner or an implemented operation module supplies the authoritative set. Unknown fields remain rejected by the existing whitelist configuration.

External `sdd-research` is not needed. Repository code, TypeORM column metadata, installed NestJS source, and the existing specifications are sufficient for the technical design; external sources cannot resolve the two domain-owned questions of percentage meaning and allowed operation types.

### Risks

- Tightening booleans intentionally turns previously coerced payloads into HTTP 400 responses and may expose client dependencies on invalid inputs.
- `@IsOptional()` accepts `null`; reusing it unchanged would violate the strict boolean scenarios.
- JavaScript message parsing would make `fieldErrors` unstable when validator text or language changes.
- Applying conditional requirements to partial updates must evaluate the effective state; DTO-only checks see only the patch and can require a companion value when a flag is explicitly changed to `true`, but cannot infer an omitted persisted flag.
- The allowed percentage sign and `tipoOperacion` members remain domain decisions; silently guessing either would create a false contract.

### Ready for Proposal

Yes. The existing proposal and specifications are technically supportable and the change is ready for design. The design should record percentage sign as an unresolved business semantic without blocking precision validation, and keep product-operation persistence gated until the closed operation-type set is defined.
