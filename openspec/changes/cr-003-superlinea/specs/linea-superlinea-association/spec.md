# Línea–SuperLínea Association Specification

## Purpose

Define the mandatory `Linea` association to one active `SuperLinea`, including write semantics, public responses, persistence, and migration of existing data.

## Requirements

### Requirement: Required association on creation

The system MUST require every newly created `Linea` to reference exactly one existing active `SuperLinea`.

#### Scenario: Create a line with an active super line

- GIVEN `superLineaId` identifies an active `SuperLinea`
- WHEN an authorized user creates a valid `Linea`
- THEN the system MUST persist that association
- AND MUST return the created line with its associated super line

#### Scenario: Omit or null the association

- GIVEN a line creation request omits `superLineaId` or supplies `null`
- WHEN the request is validated
- THEN the system MUST reject the request
- AND MUST NOT create the `Linea`

#### Scenario: Reference an unavailable super line

- GIVEN `superLineaId` identifies no `SuperLinea` or a logically deleted one
- WHEN an authorized user attempts to create a `Linea`
- THEN the system MUST reject the association
- AND MUST NOT create the `Linea`

### Requirement: Association semantics on update

The system MUST preserve the current association when `superLineaId` is omitted, MUST reject explicit `null`, and MUST reassign only to an existing active `SuperLinea`.

#### Scenario: Omit the association during update

- GIVEN an existing `Linea` has a valid `SuperLinea`
- WHEN an authorized update omits `superLineaId`
- THEN the system MUST preserve the existing association

#### Scenario: Explicitly clear the association

- GIVEN an existing `Linea`
- WHEN an update supplies `superLineaId: null`
- THEN the system MUST reject the update
- AND MUST preserve the existing association

#### Scenario: Reassign to an active super line

- GIVEN `superLineaId` identifies a different active `SuperLinea`
- WHEN an authorized user updates the `Linea`
- THEN the system MUST persist the new association

#### Scenario: Reassign to an unavailable super line

- GIVEN `superLineaId` identifies no `SuperLinea` or a logically deleted one
- WHEN an authorized user updates the `Linea`
- THEN the system MUST reject the update
- AND MUST preserve the existing association

### Requirement: Reduced association response

Every public `Linea` response MUST expose the mandatory association as `superLinea: { id, denominacion }` and MUST NOT serialize the complete related entity as that field.

#### Scenario: Return a line

- GIVEN a persisted `Linea` references a `SuperLinea`
- WHEN the line is returned by a detail, search, or selector operation
- THEN `superLinea` MUST contain exactly the related `id` and `denominacion`
- AND the response MUST NOT replace it with only `superLineaId`

### Requirement: Persistent mandatory relationship

The persisted `Linea` relationship MUST be non-null and MUST enforce referential integrity to `SuperLinea`.

#### Scenario: Persist a valid association

- GIVEN an existing `SuperLinea` is assigned to a `Linea`
- WHEN the line is stored
- THEN the persisted relationship MUST reference that `SuperLinea`
- AND the relationship MUST NOT be null

#### Scenario: Reject an invalid persisted reference

- GIVEN a write would leave a `Linea` without a referenced `SuperLinea`
- WHEN persistence is attempted
- THEN the database MUST reject the invalid state

### Requirement: Existing-line migration

The migration MUST create or resolve an active `SuperLinea` named `Temporal`, assign every pre-existing `Linea` to it, and only then enforce the mandatory relationship.

#### Scenario: Backfill existing lines

- GIVEN one or more `Linea` rows exist without a super-line relationship
- WHEN the migration is applied
- THEN every such row MUST reference the active `Temporal` record
- AND no `Linea` relationship MUST remain null before the constraint is enforced

#### Scenario: Migrate an empty line table

- GIVEN no pre-existing `Linea` rows exist
- WHEN the migration is applied
- THEN an active `Temporal` record MUST still satisfy the approved provisional mapping
- AND the mandatory relationship constraint MUST be enforced
