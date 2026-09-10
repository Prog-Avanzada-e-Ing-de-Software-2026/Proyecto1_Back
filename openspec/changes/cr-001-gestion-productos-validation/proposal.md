# Proposal: Validate Product Management Requests and Preserve Client Errors

## Intent

CR-001 requires rejecting invalid product-management data before persistence and returning actionable errors. Current write and product-search DTO transformations can throw, silently coerce values, or erase invalid optional query values, constraints diverge from persistence rules, and the global filter replaces `ValidationPipe` details with a generic message.

## Implementation Status

**Paused by explicit project direction.** Planning remains active and incomplete tasks stay unchecked, but implementation MUST NOT begin until the user explicitly resumes CR-001.

## Scope

### In Scope
- Align product, line, and brand create/update validation with persistence.
- Align `SearchProductoRapidoDto`, `SearchProductoPaginationWithDto`, and `SearchInformacionProductoDto` query transformation and validation.
- Enforce strict booleans, numeric precision and boundaries, conditional fields, string lengths, and positive identifiers.
- Reject invalid search booleans with controlled 400 responses instead of converting them to `undefined`; preserve inclusive `fechaHasta` semantics while rejecting invalid dates safely.
- Treat `Producto.porcentaje` as the persisted representation of the domain margin, without adding unresolved calculation rules.
- Preserve field-specific `ValidationPipe` messages through the global filter.

### Out of Scope
- Organization, utilities, authentication, user management, and system modules.
- The unimplemented `producto-operacion` scaffold, including its DTOs, service, and persistence contract.
- Creating or modifying test cases or test files; CR-001 verification is deferred to a separate change despite the project-level `strict_tdd` setting.
- Unrelated business rules, response contracts, or database schemas.

## Capabilities

### New Capabilities
- `product-write-validation`: Valid writes for products, lines, brands, and price updates, including the persisted product margin field.
- `product-search-validation`: Strict product-search boolean and date query contracts without silent omission or transform-time failures.
- `validation-error-contract`: Stable field-specific validation responses after global exception handling.

### Modified Capabilities
None.

## Approach

Use shared, semantically neutral request-value transformations and explicit `class-validator` constraints matching persistence and domain invariants. Keep create and partial-update rules consistent. Search boolean transforms preserve unsupported values for validation, and date transforms return a rejectable value without throwing while keeping `fechaHasta` inclusive through the end of the requested UTC day. Build `fieldErrors` from `HttpException.getResponse()`, retain the public envelope, and exclude production internals.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/modules/gestion-productos/{producto,linea,marca}/` | Modified | Align DTO and entity-bound write validation. |
| Product query DTOs in `src/modules/gestion-productos/producto/dto/` | Modified | Reject invalid search booleans and dates without silently omitting filters. |
| `src/modules/common/filters/global-exception.filters.ts` | Modified | Preserve validation messages and group them by field. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Clients send coercible invalid values | Medium | Document the stricter accepted representations and resulting 400 responses. |
| Error changes affect consumers | Medium | Retain current fields and add deterministic validation details. |
| DTO and database precision diverge | Low | Derive validation boundaries directly from entity column definitions. |

## Rollback Plan

Revert DTO and filter changes together. No database or data rollback is required.

## Dependencies

- Existing NestJS validation infrastructure.

## Success Criteria

- [ ] Invalid writes return 400 before persistence with field-specific messages.
- [ ] Invalid product-search booleans and dates return controlled 400 responses instead of being omitted or causing internal errors.
- [ ] Valid `fechaHasta` values remain inclusive through the end of the requested UTC day.
- [ ] Valid fractional quantities and supported boolean representations remain accepted.
- [ ] Development and production share the contract without exposing production internals.
- [ ] No test cases or test files are created or modified as part of CR-001.
- [ ] `yarn build` passes.
