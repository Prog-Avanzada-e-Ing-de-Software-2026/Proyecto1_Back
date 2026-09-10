## Exploration: CR-001 Product Management Validation

### Current State

Product, line, and brand DTOs normalize denominations before checking their type. Product boolean transforms collapse every unsupported value to `false`, while optional validation can also skip `null`. Numeric DTO rules do not consistently match the TypeORM column contracts: money is `decimal(15,5)`, quantities are `decimal(12,3)`, and percentages are `decimal(5,2)`. Product denomination is additionally limited to 200 characters by the domain service, despite the entity using `text` and the DTO allowing 255.

The global `ValidationPipe` uses Nest's default exception factory. The installed NestJS 11 implementation flattens `ValidationError[]` into message strings before constructing `BadRequestException`; therefore, the global filter can preserve `message`, but it cannot reliably reconstruct property names from those strings. The filter currently ignores `getResponse()` and emits `exception.message`, which reduces validation failures to `Bad Request Exception`.

### Affected Areas

- `src/modules/gestion-productos/producto/dto/` — unsafe transforms, numeric bounds, conditional values, positive references, and inconsistent messages.
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

2. **Reusable validation primitives and structured pipe errors** — centralize safe transforms and numeric policies, create `fieldErrors` while `ValidationError[]` still contain property paths, and make the filter preserve the structured HTTP response.
   - Pros: Deterministic grouping, shared create/update behavior, direct alignment with persistence limits, and no reliance on message parsing.
   - Cons: Touches both bootstrap validation configuration and the filter; recursive error flattening requires careful implementation.
   - Effort: Medium

### Recommendation

Use reusable, side-effect-free transforms: trim/lowercase only strings, convert only exact JSON booleans or lowercase strings `"true"` and `"false"`, and leave every other value unchanged so validation rejects it. For optional booleans, skip only `undefined`, not `null`.

Match DTO boundaries to persistence: money `0..9,999,999,999.99999` with at most 5 decimals; stock and minimum stock `0..999,999,999.999` with at most 3 decimals; pack quantity as an integer of at least 1; percentage within `decimal(5,2)` with at most 2 decimals. The codebase does not establish whether a negative percentage represents a discount, so do not introduce a non-negative rule beyond the existing specification. Treat this as a business decision before changing percentage semantics. Keep VAT closed to `0`, `10.5`, `21`, and `27`.

Build `message` and recursive dot-path `fieldErrors` in a custom `ValidationPipe.exceptionFactory`, then have the global filter use `HttpException.getResponse()` as the public source. Preserve `statusCode`, `timestamp`, and `path`; never emit stack traces or raw exceptions in production. Avoid deriving field names from localized messages.

Testing is explicitly deferred from CR-001. This change must not create or modify test cases or test files; the project-level `strict_tdd` configuration remains unchanged and applies again when the deferred verification work is authorized.

External `sdd-research` is not needed. Repository code, TypeORM column metadata, installed NestJS source, the confirmed equivalence between `Producto.porcentaje` and the domain margin, and the existing specifications are sufficient for the technical design.

### Risks

- Tightening booleans intentionally turns previously coerced payloads into HTTP 400 responses and may expose client dependencies on invalid inputs.
- `@IsOptional()` accepts `null`; reusing it unchanged would violate the strict boolean scenarios.
- JavaScript message parsing would make `fieldErrors` unstable when validator text or language changes.
- Applying conditional requirements to partial updates must evaluate the effective state; DTO-only checks see only the patch and can require a companion value when a flag is explicitly changed to `true`, but cannot infer an omitted persisted flag.
- The allowed margin sign and exact calculation behavior remain domain decisions; silently guessing either would create a false contract.

### Ready for Proposal

Yes. The existing proposal and specifications are technically supportable and the change is ready for design. The equivalence between `Producto.porcentaje` and the domain margin is settled; the design should avoid inventing sign, range, calculation, or update behavior beyond confirmed domain evidence while allowing persistence-aligned precision validation.
