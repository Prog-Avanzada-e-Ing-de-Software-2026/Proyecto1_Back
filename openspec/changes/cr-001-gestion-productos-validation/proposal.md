# Proposal: Validate Product Management Writes and Preserve Client Errors

## Intent

CR-001 requires rejecting invalid product-management data before persistence and returning actionable errors. Current DTO transformations can throw or silently coerce values, constraints diverge from persistence rules, and the global filter replaces `ValidationPipe` details with a generic message.

## Scope

### In Scope
- Align product, line, and brand create/update validation with persistence.
- Enforce strict booleans, numeric precision and boundaries, conditional fields, string lengths, and positive identifiers.
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
- `validation-error-contract`: Stable field-specific validation responses after global exception handling.

### Modified Capabilities
None.

## Approach

Use safe DTO transformations and explicit `class-validator` constraints matching persistence and domain invariants. Keep create and partial-update rules consistent. Build `fieldErrors` from `HttpException.getResponse()`, retain the public envelope, and exclude production internals.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/modules/gestion-productos/{producto,linea,marca}/` | Modified | Align DTO and entity-bound write validation. |
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
- [ ] Valid fractional quantities and supported boolean representations remain accepted.
- [ ] Development and production share the contract without exposing production internals.
- [ ] No test cases or test files are created or modified as part of CR-001.
- [ ] `yarn build` passes.
