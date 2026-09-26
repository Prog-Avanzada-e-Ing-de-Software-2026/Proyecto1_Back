# Producto–Presentación Association Specification

## Purpose

Require every `Producto` to reference exactly one active `Presentacion`, shape public responses, and migrate existing rows safely.

## Requirements

### Requirement: Mandatory association on create

The system MUST require an active `Presentacion` when creating a `Producto`.

#### Scenario: Create with active presentation

- GIVEN an active `Presentacion` exists
- WHEN an authorized user creates a `Producto` with that `presentacionId`
- THEN the system MUST persist the association

#### Scenario: Reject missing presentation on create

- GIVEN a create request omits `presentacionId` or supplies a non-integer
- WHEN creation is attempted
- THEN the system MUST reject the request

#### Scenario: Reject inactive or unknown presentation on create

- GIVEN `presentacionId` references a missing or logically deleted `Presentacion`
- WHEN creation is attempted
- THEN the system MUST reject the request

### Requirement: Update association semantics

The system MUST allow reassignment to another active `Presentacion`, MUST preserve the current association when `presentacionId` is omitted, and MUST reject explicit `null`.

#### Scenario: Reassign presentation

- GIVEN an active `Producto` and another active `Presentacion`
- WHEN an authorized user updates `presentacionId` to the new active id
- THEN the system MUST persist the new association

#### Scenario: Omit presentation on update

- GIVEN an active `Producto` already has a valid `Presentacion`
- WHEN an authorized user updates other fields without sending `presentacionId`
- THEN the system MUST preserve the existing association

#### Scenario: Reject null presentation on update

- GIVEN an update payload sets `presentacionId` to `null`
- WHEN the update is attempted
- THEN the system MUST reject the request

### Requirement: Reduced response shape

Every detail, search, and list `Producto` response MUST include `presentacion: { id, denominacion }`.

#### Scenario: Map reduced presentation

- GIVEN a `Producto` joined to its `Presentacion`
- WHEN it is mapped to a public DTO
- THEN the response MUST contain `presentacion.id` and `presentacion.denominacion`
- AND MUST NOT require the full `Presentacion` aggregate in the payload

### Requirement: Persistent relationship and migration

The database MUST store a non-null restrictive foreign key from `producto` to `presentacion`, backfilling existing rows through provisional denomination `Temporal`.

#### Scenario: Backfill populated products

- GIVEN existing `producto` rows without `presentacion_id`
- WHEN the migration runs
- THEN every row MUST reference the active `Temporal` presentation
- AND the column MUST become `NOT NULL` with `ON DELETE RESTRICT`

#### Scenario: Empty product table

- GIVEN no `producto` rows
- WHEN the migration runs
- THEN an active `Temporal` presentation MUST exist
- AND `producto.presentacion_id` MUST be mandatory

#### Scenario: Reject invalid references and duplicate denominations

- GIVEN the migrated schema
- WHEN a duplicate `presentacion.denominacion` or an invalid `presentacion_id` is inserted
- THEN MySQL MUST reject the operation

#### Scenario: Reversible down

- GIVEN the migration has been applied
- WHEN `down` runs
- THEN the FK, column, and `presentacion` table MUST be removed
- AND existing product rows MUST remain
