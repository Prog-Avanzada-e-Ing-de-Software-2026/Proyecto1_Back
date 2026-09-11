# SuperLínea Management Specification

## Purpose

Define the lifecycle, queries, visibility, uniqueness, auditing, and deletion protection of the `SuperLinea` aggregate.

## Requirements

### Requirement: Attributes and globally unique denomination

The system MUST generate a numeric `id`, MUST require `denominacion`, MUST allow an optional string `observacion`, and MUST reserve each denomination across active and logically deleted records.

#### Scenario: Create a unique super line

- GIVEN no active or deleted `SuperLinea` has the submitted denomination
- WHEN an authorized user creates the `SuperLinea`
- THEN the system MUST persist it as active with a system-generated numeric `id`

#### Scenario: Use the optional observation

- GIVEN a valid `SuperLinea` request either omits `observacion` or supplies a string
- WHEN an authorized user creates or updates the `SuperLinea`
- THEN the system MUST accept the omitted value
- AND MUST preserve the supplied string when present

#### Scenario: Reuse a deleted denomination

- GIVEN a logically deleted `SuperLinea` has the submitted denomination
- WHEN an authorized user creates or renames another `SuperLinea` with it
- THEN the system MUST reject the operation as a denomination conflict

#### Scenario: Keep denomination during update

- GIVEN an active `SuperLinea` retains its own denomination
- WHEN an authorized user updates other permitted data
- THEN the system MUST allow the update without treating the record as its own conflict

### Requirement: Responsible-user auditing

The system MUST maintain `createdAt`, `updatedAt`, `deletedAt`, `usuarioCreated`, `usuarioUpdated`, and `usuarioDeleted` according to the established audit responsibilities.

#### Scenario: Audit creation

- GIVEN an authorized user creates a valid `SuperLinea`
- WHEN creation succeeds
- THEN the system MUST record `createdAt` and `usuarioCreated`
- AND `deletedAt` and `usuarioDeleted` MUST remain unset

#### Scenario: Audit modification

- GIVEN an active `SuperLinea`
- WHEN an authorized user modifies it successfully
- THEN the system MUST record `updatedAt` and `usuarioUpdated`

#### Scenario: Audit logical deletion

- GIVEN an active `SuperLinea` may be deleted
- WHEN an authorized user deletes it
- THEN the system MUST record `deletedAt` and `usuarioDeleted`
- AND MUST preserve its historical audit data

### Requirement: Collection query visibility

The system MUST provide paginated search and selector-oriented collection queries with stable `{ data, total }` results.

#### Scenario: Search active records by default

- GIVEN active and logically deleted super lines exist
- WHEN paginated search omits `incluirEliminados` or sets it to `false`
- THEN the system MUST return only matching active records
- AND `total` MUST represent the matching active records

#### Scenario: Search including deleted records

- GIVEN active and logically deleted super lines exist
- WHEN paginated search sets `incluirEliminados=true`
- THEN the system MUST return matching active and deleted records
- AND `total` MUST represent all matching records

#### Scenario: Query the selector

- GIVEN active and logically deleted super lines exist
- WHEN the selector collection is requested
- THEN the system MUST return only matching active records
- AND `total` MUST equal the actual result count

#### Scenario: Query an empty collection

- GIVEN no records match a collection query
- WHEN the query completes
- THEN the system MUST return `{ data: [], total: 0 }`
- AND MUST NOT replace that result with an error or guidance message

### Requirement: Protected logical deletion

The system MUST reject deletion while any active `Linea` references the `SuperLinea`, and MUST ignore logically deleted lines for this decision.

#### Scenario: Active line blocks deletion

- GIVEN an active `Linea` references an active `SuperLinea`
- WHEN an authorized user requests deletion of that `SuperLinea`
- THEN the system MUST reject the deletion
- AND MUST leave the `SuperLinea` active

#### Scenario: Deleted lines do not block deletion

- GIVEN only logically deleted lines reference an active `SuperLinea`
- WHEN an authorized user requests deletion of that `SuperLinea`
- THEN the system MUST logically delete it immediately
- AND MUST NOT require a backend confirmation step
