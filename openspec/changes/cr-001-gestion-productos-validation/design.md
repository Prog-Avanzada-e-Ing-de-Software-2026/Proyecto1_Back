# Design: Validate Product Management Writes and Preserve Client Errors

## Technical Approach

Keep validation at the NestJS transport boundary. Product, line, brand, and dormant price-update DTOs will use shared, non-throwing transforms plus `class-validator` constraints derived from the current TypeORM columns. `ValidationPipe.exceptionFactory` will convert Nest validation errors into a stable structured payload, and `GlobalExceptionFilter` will preserve that payload while adding the existing response envelope. No service, repository, entity, or `producto-operacion` behavior is added.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Shared transforms | Add product-management-local pure transforms that normalize strings only when strings and convert only `true`, `false`, `"true"`, and `"false"` | Keep unsafe inline transforms; change shared controller pipes | One implementation prevents thrown `TypeError` and false coercion without changing unrelated modules that also use the shared pipes. |
| DTO constraints | Encode length, positive ID, conditional-field, decimal scale, and storage-range rules in create DTOs; updates inherit them through `PartialType` and only require the update audit ID | Duplicate create/update decorators; defer checks to services/database | A single transport contract rejects invalid input before lookups and persistence and prevents create/update drift. |
| Margin representation | Validate `Producto.porcentaje` as the persisted domain margin using `decimal(5,2)` compatibility only | Introduce a `margen` field; calculate price; force a sign or business range | The entity already persists the concept as `porcentaje`; formula, sign, and update semantics are intentionally not part of CR-001. |
| Validation errors | Build `message[]` and `fieldErrors` in a pure exception factory, then preserve them in the global filter | Parse message strings in the filter; expose raw `ValidationError` objects | Structured errors retain property identity, support nested paths, and avoid exposing validator internals. |
| Dormant price DTO | Correct `UpdatePrecioDto` validation only; add no endpoint or mapper change | Expose a route; repair specialized persistence flow | CR-001 defines validation, not previously unavailable price-update behavior. |

## Data Flow

```text
HTTP body -> global ValidationPipe -> route normalization pipes -> controller/service -> repository
                    |
                    +-> BadRequestException { message[], fieldErrors }
                                                |
                                                v
                                   GlobalExceptionFilter -> 400 envelope
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/modules/gestion-productos/common/validation/product-write.transforms.ts` | Create | Safe denomination and strict-boolean transforms. |
| `src/modules/gestion-productos/producto/dto/create-producto.dto.ts` | Modify | Apply product lengths, strict booleans, decimal/storage bounds, conditional values, VAT set, and positive IDs. |
| `src/modules/gestion-productos/producto/dto/update-producto.dto.ts` | Modify | Remove divergent duplicated rules; inherit partial create validation and require `usuarioUpdatedId`. |
| `src/modules/gestion-productos/producto/dto/update-precio.dto.ts` | Modify | Align field-specific numeric, precision, margin, and user-ID validation without making the flow reachable. |
| `src/modules/gestion-productos/linea/dto/create-linea.dto.ts`, `src/modules/gestion-productos/linea/dto/update-linea.dto.ts` | Modify | Apply safe denomination, fractional stock, conditional minimum, strict boolean, and positive audit ID rules. |
| `src/modules/gestion-productos/marca/dto/create-marca.dto.ts`, `src/modules/gestion-productos/marca/dto/update-marca.dto.ts` | Modify | Apply safe denomination and positive audit ID rules consistently. |
| `src/modules/common/validation/validation-error.factory.ts` | Create | Flatten nested `ValidationError` constraints into public messages grouped by property path. |
| `src/main.ts` | Modify | Configure `ValidationPipe.exceptionFactory` with the structured validation response. |
| `src/modules/common/filters/global-exception.filters.ts` | Modify | Preserve `HttpException` response fields and exclude stack/internal details from production responses. |

## Interfaces / Contracts

```ts
interface ValidationErrorResponse {
  statusCode: 400;
  timestamp: string;
  path: string;
  message: string[];
  fieldErrors: Record<string, string[]>;
}
```

`producto-operacion` is excluded in full. `porcentaje` remains the API and persistence name for margin.

## Testing Strategy

Testing is deferred by explicit project direction. CR-001 will not create or modify test cases or test files; validation behavior will be verified in a later, separately authorized change.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Deploy the DTO, pipe, and filter changes together; revert those implementation changes together if clients depend on invalid coercions.

## Open Questions

None.
