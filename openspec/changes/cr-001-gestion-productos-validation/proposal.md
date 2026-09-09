# Proposal: Validate Product Management Writes and Preserve Client Errors

## Intent

CR-001 requires rejecting invalid product-management data before persistence and returning actionable errors. Current DTO transformations can throw or silently coerce values, constraints diverge from persistence rules, and the global filter replaces `ValidationPipe` details with a generic message.

## Scope

### In Scope
- Align product, line, and brand create/update validation with persistence.
- Enforce strict booleans, numeric precision and boundaries, conditional fields, string lengths, and positive identifiers.
- Define validation required before product-operation writes can be enabled.
- Preserve field-specific `ValidationPipe` messages through the global filter.
- Add focused tests using strict RED-GREEN-REFACTOR.

### Out of Scope
- Organization, utilities, authentication, user management, and system modules.
- Enabling unfinished product-operation persistence.
- Unrelated business rules, response contracts, or database schemas.

## Capabilities

### New Capabilities
- `product-write-validation`: Valid writes for products, lines, brands, price updates, and product-operation prerequisites.
- `validation-error-contract`: Stable field-specific validation responses after global exception handling.

### Modified Capabilities
None.

## Approach

Use safe DTO transformations and explicit `class-validator` constraints matching persistence and domain invariants. Keep create and partial-update rules consistent. Build `fieldErrors` from `HttpException.getResponse()`, retain the public envelope, and exclude production internals.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/modules/gestion-productos/{producto,linea,marca}/` | Modified | Align DTO and entity-bound write validation. |
| `src/modules/gestion-productos/producto-operacion/` | Modified | Define preventive DTO validation; persistence remains disabled. |
| `src/modules/common/filters/global-exception.filters.ts` | Modified | Preserve validation messages and group them by field. |
| Product and HTTP test suites | New/Modified | Prove rejection and response shape. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Clients send coercible invalid values | Medium | Document stricter 400 responses and test accepted representations. |
| Error changes affect consumers | Medium | Retain current fields and add deterministic validation details. |
| DTO and database precision diverge | Low | Derive boundary tests from entity column definitions. |

## Rollback Plan

Revert DTO, filter, and test changes together. No database or data rollback is required.

## Dependencies

- Existing NestJS validation and Jest/Supertest infrastructure.

## Success Criteria

- [ ] Invalid writes return 400 before persistence with field-specific messages.
- [ ] Valid fractional quantities and supported boolean representations remain accepted.
- [ ] Development and production share the contract without exposing production internals.
- [ ] Product-operation persistence remains unavailable until its contract is enforced.
- [ ] Focused tests, `yarn test`, and `yarn build` pass.
