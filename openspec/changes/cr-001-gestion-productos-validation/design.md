# Design: Validate Product Management Requests and Preserve Client Errors

## Technical Approach

Keep validation at the NestJS transport boundary. Product write and product-search DTOs will use shared, non-throwing request-value transforms plus `class-validator` constraints. Write constraints remain derived from the current TypeORM columns; search constraints strictly parse supported boolean query forms and preserve inclusive date behavior. `ValidationPipe.exceptionFactory` will convert Nest validation errors into a stable structured payload, and `GlobalExceptionFilter` will preserve that payload while adding the existing response envelope. No service, repository, entity, or `producto-operacion` behavior is added.

## Implementation Status

**Paused.** The design and task plan are authoritative, but no source or test changes may begin until the user explicitly resumes CR-001.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Shared transforms | Add product-management-local `request-value.transforms.ts` with pure helpers for safe strings, strict booleans, and inclusive end-date conversion | Keep unsafe inline transforms; use a write-only helper; change shared controller pipes | A neutral request-value module can serve write and search DTOs without coupling searches to a write-named abstraction. Invalid values remain available to validators instead of throwing or disappearing. |
| Search query validation | Apply strict boolean parsing to `exacto`, `codReferenciaExacto`, `codProveedorExacto`, and `conStock`; apply safe inclusive-date conversion to `fechaHasta` | Preserve permissive omission; validate inside services | DTO-bound validation rejects malformed queries consistently before business logic; optional `conStock` skips only true absence, and invalid dates remain rejectable. |
| DTO constraints | Encode length, positive ID, conditional-field, decimal scale, and storage-range rules in create DTOs; updates inherit them through `PartialType` and only require the update audit ID | Duplicate create/update decorators; defer checks to services/database | A single transport contract rejects invalid input before lookups and persistence and prevents create/update drift. |
| Margin representation | Validate `Producto.porcentaje` as the persisted domain margin using `decimal(5,2)` compatibility only | Introduce a `margen` field; calculate price; force a sign or business range | The entity already persists the concept as `porcentaje`; formula, sign, and update semantics are intentionally not part of CR-001. |
| Validation errors | Build `message[]` and `fieldErrors` in a pure exception factory, then preserve them in the global filter | Parse message strings in the filter; expose raw `ValidationError` objects | Structured errors retain property identity, support nested paths, and avoid exposing validator internals. |
| Dormant price DTO | Correct `UpdatePrecioDto` validation only; add no endpoint or mapper change | Expose a route; repair specialized persistence flow | CR-001 defines validation, not previously unavailable price-update behavior. |

## Data Flow

```text
HTTP body/query -> global ValidationPipe -> route normalization pipes -> controller/service -> repository
                         |
                         +-> BadRequestException { message[], fieldErrors }
                                                     |
                                                     v
                                        GlobalExceptionFilter -> 400 envelope
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/modules/gestion-productos/common/validation/request-value.transforms.ts` | Create | Safe string normalization, strict-boolean parsing, and non-throwing inclusive end-date conversion shared by write and search DTOs. |
| `src/modules/gestion-productos/producto/dto/create-producto.dto.ts` | Modify | Apply product lengths, strict booleans, decimal/storage bounds, conditional values, VAT set, and positive IDs. |
| `src/modules/gestion-productos/producto/dto/update-producto.dto.ts` | Modify | Remove divergent duplicated rules; inherit partial create validation and require `usuarioUpdatedId`. |
| `src/modules/gestion-productos/producto/dto/update-precio.dto.ts` | Modify | Align field-specific numeric, precision, margin, and user-ID validation without making the flow reachable. |
| `src/modules/gestion-productos/linea/dto/create-linea.dto.ts`, `src/modules/gestion-productos/linea/dto/update-linea.dto.ts` | Modify | Apply safe denomination, fractional stock, conditional minimum, strict boolean, and positive audit ID rules. |
| `src/modules/gestion-productos/marca/dto/create-marca.dto.ts`, `src/modules/gestion-productos/marca/dto/update-marca.dto.ts` | Modify | Apply safe denomination and positive audit ID rules consistently. |
| `src/modules/gestion-productos/producto/dto/search-producto-rapido.dto.ts` | Modify | Parse `exacto` strictly and preserve invalid input for a controlled 400 response. |
| `src/modules/gestion-productos/producto/dto/search-producto-pagination-with.dto.ts` | Modify | Parse exact-match flags and optional `conStock` strictly; only absent `conStock` is omitted. |
| `src/modules/gestion-productos/producto/dto/seach-informacion-producto.dto.ts` | Modify | Reject invalid dates without transform-time errors and retain inclusive `fechaHasta` as end of the requested UTC day. |
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

Supported boolean inputs are the booleans `true` and `false` plus the lowercase query strings `"true"` and `"false"`. Unsupported strings, numbers, and `null` are not coerced or erased. An omitted optional `conStock` remains optional. A valid `fechaHasta` represents an inclusive upper bound at `23:59:59.999` UTC; invalid date input reaches `@IsDate()` as invalid and returns 400.

## Testing Strategy

Testing is deferred by explicit project direction. CR-001 will not create or modify test cases or test files; validation behavior will be verified in a later, separately authorized change.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. After explicit resume, deploy the DTO, pipe, and filter changes together; revert those implementation changes together if clients depend on invalid coercions or silently ignored search filters.

## Open Questions

None.
