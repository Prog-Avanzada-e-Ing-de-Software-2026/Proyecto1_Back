# Presentación Management Specification

## Purpose

Define the lifecycle, queries, visibility, uniqueness, auditing, and deletion protection of the `Presentacion` aggregate.

## Requirements

### Requirement: Attributes and globally unique denomination

The system MUST generate a numeric `id`, MUST require `denominacion`, MUST allow an optional string `observacion`, and MUST reserve each denomination across active and logically deleted records.

#### Scenario: Create a unique presentation

- GIVEN no active or deleted `Presentacion` has the submitted denomination
- WHEN an authorized user creates the `Presentacion`
- THEN the system MUST persist it as active with a system-generated numeric `id`

#### Scenario: Use the optional observation

- GIVEN a valid `Presentacion` request either omits `observacion` or supplies a string
- WHEN an authorized user creates or updates the `Presentacion`
- THEN the system MUST accept the omitted value
- AND MUST preserve the supplied string when present

#### Scenario: Reuse a deleted denomination

- GIVEN a logically deleted `Presentacion` has the submitted denomination
- WHEN an authorized user creates or renames another `Presentacion` with it
- THEN the system MUST reject the operation as a denomination conflict

#### Scenario: Keep denomination during update

- GIVEN an active `Presentacion` retains its own denomination
- WHEN an authorized user updates other permitted data
- THEN the system MUST allow the update without treating the record as its own conflict

### Requirement: Responsible-user auditing

The system MUST maintain `createdAt`, `updatedAt`, `deletedAt`, `usuarioCreated`, `usuarioUpdated`, and `usuarioDeleted` according to the established audit responsibilities.

#### Scenario: Audit creation

- GIVEN an authorized user creates a valid `Presentacion`
- WHEN creation succeeds
- THEN the system MUST record `createdAt` and `usuarioCreated`
- AND `deletedAt` and `usuarioDeleted` MUST remain unset

#### Scenario: Audit modification

- GIVEN an active `Presentacion`
- WHEN an authorized user modifies it successfully
- THEN the system MUST record `updatedAt` and `usuarioUpdated`

#### Scenario: Audit logical deletion

- GIVEN an active `Presentacion` may be deleted
- WHEN an authorized user deletes it
- THEN the system MUST record `deletedAt` and `usuarioDeleted`
- AND MUST preserve its historical audit data

### Requirement: Collection query visibility

The system MUST provide paginated search and selector-oriented collection queries with stable `{ data, total }` results.

#### Scenario: Search active records by default

- GIVEN active and logically deleted presentations exist
- WHEN paginated search omits `incluirEliminados` or sets it to `false`
- THEN the system MUST return only matching active records
- AND `total` MUST represent the matching active records

#### Scenario: Search including deleted records

- GIVEN active and logically deleted presentations exist
- WHEN paginated search sets `incluirEliminados=true`
- THEN the system MUST return matching active and deleted records
- AND `total` MUST represent all matching records

#### Scenario: Query the selector

- GIVEN active and logically deleted presentations exist
- WHEN the selector collection is requested
- THEN the system MUST return only matching active records
- AND `total` MUST equal the actual result count

#### Scenario: Query an empty collection

- GIVEN no records match a collection query
- WHEN the query completes
- THEN the system MUST return `{ data: [], total: 0 }`
- AND MUST NOT replace that result with an error or guidance message

### Requirement: Protected logical deletion

The system MUST reject deletion while any active `Producto` references the `Presentacion`, and MUST ignore logically deleted products for this decision.

#### Scenario: Active product blocks deletion

- GIVEN an active `Producto` references an active `Presentacion`
- WHEN an authorized user attempts to delete that `Presentacion`
- THEN the system MUST reject the deletion

#### Scenario: Only deleted products allow deletion

- GIVEN every referencing `Producto` is logically deleted (or none exist)
- WHEN an authorized user deletes the `Presentacion`
- THEN the system MUST soft-delete it successfully
