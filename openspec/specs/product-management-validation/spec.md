# Product Management Validation Specification

## Purpose

Define safe request transformation and defense-in-depth validation for the six `gestion-productos` modules: `producto`, `linea`, `marca`, `presentacion`, `producto-operacion`, and `superlinea`. This specification changes application validation only; it MUST NOT require entity, entity-mapping, database-schema, or migration changes.

## Requirements

### Requirement: Safe and strict request transformation

All six modules MUST preserve invalid input for validation instead of throwing from transforms, silently erasing it, or coercing it into a valid substitute. String normalization MAY trim and normalize case only after confirming that the input is a string. Boolean fields MUST accept JSON booleans and the string representations `"true"` and `"false"` only. Unsupported values, including `1`, `0`, `"yes"`, and explicit `null`, MUST be rejected when the field is present.

NOTE: The system-managed `createdAt` field on the create and update DTOs and the Línea `deletedAt` field retain the existing `@IsOptional()` contract, so an explicit `null` value is accepted for them. For Línea `deletedAt` this preserves the existing `linea.controller.spec.ts` contract, which sends `deletedAt: null`.

#### Scenario: Non-string denomination is rejected safely

- GIVEN a denomination in `producto`, `linea`, `marca`, `presentacion`, or `superlinea` is `null`, numeric, or another non-string value
- WHEN the request DTO is transformed and validated
- THEN validation MUST return a controlled client validation failure naming the denomination field
- AND transformation MUST NOT throw an internal `TypeError`

#### Scenario: Strict boolean representation

- GIVEN a Product boolean field receives `true`, `false`, `"true"`, or `"false"`
- WHEN the DTO is transformed and validated
- THEN the represented boolean MUST be retained and accepted
- AND GIVEN the same field receives `1`, `0`, `"yes"`, or explicit `null`, validation MUST reject it without substituting a boolean

#### Scenario: Optional omission differs from explicit null

- GIVEN an optional field is omitted and therefore has value `undefined`
- WHEN the DTO is validated
- THEN omission MAY be accepted when the contract marks the field optional
- AND GIVEN that field is explicitly supplied as `null`
- THEN validation MUST reject it unless the field contract explicitly permits null

### Requirement: Product denomination and product write contract

Product create and Product update requests MUST require a denomination of at most 200 characters, positive integer `marcaId`, `lineaId`, and `presentacionId`, and positive integer audit identifiers when supplied. The Product request boundary MUST accept fractional stock quantities, enforce the approved numeric rules, and validate dependent values when their controlling flags require them.

#### Scenario: Product denomination boundary

- GIVEN a Product denomination contains exactly 200 characters
- WHEN Product creation or Product update request validation runs
- THEN the denomination MUST be accepted if all other rules pass
- AND GIVEN it contains 201 characters
- THEN validation MUST reject it before persistence

#### Scenario: Product numeric boundaries

- GIVEN `costo` is `0`, `porcentaje` is greater than `0`, `stock` is `1.125`, and `stockMinimo` is `0.001`
- WHEN Product creation or Product update request validation runs
- THEN the state MUST be accepted if its values fit the applicable precision and scale
- AND GIVEN `costo` is `-1`, `porcentaje` is `0`, `stock` is `0`, or `stockMinimo` is `0`
- THEN the state MUST be rejected

#### Scenario: Product required values and relations

- GIVEN any of `costo`, `porcentaje`, `stock`, `stockMinimo`, `marcaId`, `lineaId`, or `presentacionId` is missing or explicitly `null`
- WHEN Product creation or Product update request validation runs
- THEN validation MUST reject the state and identify the missing or invalid field
- AND identifiers equal to `0`, negative values, non-integers, or non-finite numbers MUST be rejected before relation lookup

#### Scenario: Product conditional values

- GIVEN `utilizaStockMinimo` is true and `stockMinimo` is omitted, or `utilizaPack` is true and `cantidadPorPack` is omitted or is not a positive integer
- WHEN Product validation runs
- THEN validation MUST reject the request naming the dependent field
- AND when the controlling flag is false, an omitted optional dependent value MAY be accepted

### Requirement: Product numeric precision and storage-compatible limits

Product numeric request values MUST be finite and MUST fit the shared persistence contracts without changing those contracts: monetary values MUST fit `decimal(15,5)` with maximum `9,999,999,999.99999`; quantity values MUST fit `decimal(12,3)` with maximum `999,999,999.999`; percentage values MUST fit `decimal(5,2)` with maximum `999.99`. Values with more fractional digits or values beyond these limits MUST be rejected. These rules MUST apply at DTO and applicable domain/application validation boundaries.

#### Scenario: Fractional quantity precision

- GIVEN `stock` or `stockMinimo` is `1.125`
- WHEN a Product or Línea request is validated
- THEN the value MUST be accepted when all other rules pass
- AND GIVEN the value is `1.1255`
- THEN validation MUST reject it for exceeding three fractional digits

#### Scenario: Numeric maximums and finite values

- GIVEN a monetary value is `9,999,999,999.99999`, a quantity is `999,999,999.999`, or a percentage is `999.99`
- WHEN the corresponding request is validated
- THEN the value MUST be accepted when its sign rule passes
- AND values above those maxima, `NaN`, positive infinity, and negative infinity MUST be rejected

### Requirement: Product domain and application enforcement

Product domain/application validation MUST enforce `costo >= 0`, `porcentaje` (margin) `> 0`, `stock` (current stock) `> 0`, and `stockMinimo > 0` for creation and for Product update requests. Required Marca, Línea, and Presentación identifiers MUST resolve to active related records before persistence. The eleven existing rejection cases in `producto.service.registro.spec.ts` MUST be treated as required behavior, not as design-intended failures.

#### Scenario: Registration rejects each invalid mandatory numeric rule

- GIVEN a Product registration has one of `costo`, `porcentaje`, `stock`, or `stockMinimo` missing, `0` where zero is forbidden, or `-1`
- WHEN the registration service validates the state
- THEN it MUST reject the request with a controlled bad-request validation outcome
- AND all eleven existing rejection cases MUST pass without weakening their assertions

#### Scenario: Update request requires the mandatory fields

- GIVEN a Product update omits any of `denominacion`, `costo`, `porcentaje`, `stock`, `stockMinimo`, `marcaId`, `lineaId`, or `presentacionId`
- WHEN the request is validated
- THEN validation MUST reject it before persistence

#### Scenario: Required relations are active

- GIVEN a Product references a missing or inactive Marca, Línea, or Presentación
- WHEN creation or update validation runs
- THEN the operation MUST be rejected before persistence

### Requirement: Línea validation

Línea CREATE requests MUST require a string denomination of at most 255 characters, a positive integer `superLineaId`, and a positive integer `usuarioCreatedId`. Línea UPDATE requests MUST require a positive integer `usuarioUpdatedId` and MUST validate the denomination, `superLineaId`, and quantity (`stockMinimo`) only when present: omission is allowed, but a present invalid value or explicit `null` MUST be rejected. A Línea quantity such as `stockMinimo` MUST use the finite `decimal(12,3)` contract, and a required SuperLínea MUST exist and be active.

#### Scenario: Línea create denomination and relation boundaries

- GIVEN a Línea create request has a denomination of exactly 255 characters and `superLineaId` is a positive integer referring to an active SuperLínea
- WHEN the request is validated
- THEN it MUST be accepted if all other rules pass
- AND GIVEN the denomination contains 256 characters or `superLineaId` is `0` or `-1`
- THEN validation MUST reject the request before persistence or relation lookup

#### Scenario: Línea update validates present fields and requires the audit ID

- GIVEN a Línea update request omits `denominacion`, `superLineaId`, or `stockMinimo`
- WHEN the request is validated
- THEN omission MUST be accepted at the DTO boundary
- AND GIVEN any omitted field is instead present but invalid, such as a 256-character denomination, `superLineaId` of `0` or `-1`, an invalid quantity, or an explicit `null`
- THEN validation MUST reject the request before persistence or relation lookup
- AND GIVEN `usuarioUpdatedId` is omitted, `0`, `-1`, fractional, non-finite, or explicit `null`
- THEN validation MUST reject the request before persistence

#### Scenario: Línea fractional quantity

- GIVEN `stockMinimo` is `1.125`
- WHEN a Línea request is validated
- THEN it MUST be accepted
- AND GIVEN it is `1.1255`, `NaN`, or infinity
- THEN validation MUST reject it

### Requirement: Marca validation

Marca CREATE requests MUST require a string denomination of at most 255 characters and a positive integer `usuarioCreatedId`. Marca UPDATE requests MUST require a positive integer `usuarioUpdatedId` and MUST validate the denomination only when present: omission is allowed, but a present invalid value or explicit `null` MUST be rejected. Invalid types, explicit nulls, zero, negative, non-integer, and non-finite identifiers MUST be rejected without unsafe transformation.

#### Scenario: Marca create denomination boundary

- GIVEN a Marca create request has a denomination of exactly 255 characters
- WHEN the request is validated
- THEN it MUST be accepted if all other rules pass
- AND GIVEN it contains 256 characters
- THEN validation MUST reject it before persistence

#### Scenario: Marca update validates present fields and requires the audit ID

- GIVEN a Marca update request omits `denominacion`
- WHEN the request is validated
- THEN omission MUST be accepted at the DTO boundary
- AND GIVEN the denomination is present but invalid, such as a 256-character denomination or explicit `null`
- THEN validation MUST reject the field with a deterministic field-specific failure
- AND GIVEN `usuarioUpdatedId` is omitted, `0`, `-1`, fractional, non-finite, or explicit `null`
- THEN validation MUST reject the field with a deterministic field-specific failure

#### Scenario: Marca audit identifier

- GIVEN `usuarioCreatedId` or `usuarioUpdatedId` is `0`, `-1`, a fractional number, or explicit `null`
- WHEN the corresponding Marca request is validated
- THEN validation MUST reject the field with a deterministic field-specific failure

### Requirement: Presentación validation

Presentación CREATE requests MUST require a string denomination of at most 255 characters and a positive integer `usuarioCreatedId`. Presentación UPDATE requests MUST require a positive integer `usuarioUpdatedId` and MUST validate the denomination only when present: omission is allowed, but a present invalid value or explicit `null` MUST be rejected. Optional fields MUST distinguish omission from explicit invalid null, and transformations MUST never throw for malformed values.

#### Scenario: Presentación create denomination boundary

- GIVEN a Presentación create request has a denomination of exactly 255 characters
- WHEN the request is validated
- THEN it MUST be accepted if all other rules pass
- AND GIVEN it contains 256 characters or is non-string
- THEN validation MUST reject it without an internal transformation error

#### Scenario: Presentación update validates present fields and requires the audit ID

- GIVEN a Presentación update request omits `denominacion`
- WHEN the update DTO is validated
- THEN omission MUST be accepted
- AND GIVEN the denomination is present but invalid, such as a 256-character or non-string denomination, or explicit `null`
- THEN validation MUST reject it
- AND GIVEN `usuarioUpdatedId` is omitted, `0`, `-1`, or explicit `null`
- THEN validation MUST reject it

#### Scenario: Presentación identifier boundary

- GIVEN a Presentación update request omits `usuarioUpdatedId`
- WHEN the update DTO is validated
- THEN validation MUST reject it
- AND GIVEN the identifier is explicitly `null`, `0`, or `-1`
- THEN validation MUST reject it

### Requirement: SuperLínea validation

SuperLínea CREATE requests MUST require a string denomination of at most 255 characters and a positive integer `usuarioCreatedId`. SuperLínea UPDATE requests MUST require a positive integer `usuarioUpdatedId` and MUST validate the denomination only when present: omission is allowed, but a present invalid value or explicit `null` MUST be rejected. Invalid explicit nulls, malformed values, and unsupported identifier forms MUST be rejected before persistence.

#### Scenario: SuperLínea create denomination boundary

- GIVEN a SuperLínea create request has a denomination of exactly 255 characters
- WHEN the request is validated
- THEN it MUST be accepted if all other rules pass
- AND GIVEN it contains 256 characters or is numeric
- THEN validation MUST reject it safely

#### Scenario: SuperLínea update validates present fields and requires the audit ID

- GIVEN a SuperLínea update request omits `denominacion`
- WHEN the request is validated
- THEN omission MUST be accepted at the DTO boundary
- AND GIVEN the denomination is present but invalid, such as a 256-character or numeric denomination, or explicit `null`
- THEN validation MUST reject it and MUST NOT perform a persistence operation
- AND GIVEN `usuarioUpdatedId` is omitted, `0`, `-1`, fractional, non-finite, or explicit `null`
- THEN validation MUST reject it and MUST NOT perform a persistence operation

#### Scenario: SuperLínea audit identifier boundary

- GIVEN an audit identifier is `0`, negative, fractional, non-finite, or explicit `null`
- WHEN the request is validated
- THEN validation MUST reject it and MUST NOT perform a persistence operation

### Requirement: Producto-Operación remains a validated scaffold

The `producto-operacion` module MUST remain a scaffold with no new repository, persistence, entity, relation-resolution, or business behavior. Its create request MUST validate positive integer `productoId`, positive integer `operacionId`, and required bounded string `tipoOperacion`. Its update request MUST preserve the same field rules for fields that are present.

#### Scenario: Valid Producto-Operación request

- GIVEN `productoId` and `operacionId` are positive integers and `tipoOperacion` is a non-empty string within its declared maximum length
- WHEN the DTO is validated
- THEN the request MUST be accepted without invoking persistence or business behavior

#### Scenario: Invalid Producto-Operación boundary

- GIVEN either identifier is `0`, negative, fractional, non-finite, or null, or `tipoOperacion` is missing, null, non-string, empty, or over its declared maximum length
- WHEN the DTO is validated
- THEN validation MUST reject the request with field-specific failures
- AND the scaffold service, repository, entity, and database behavior MUST remain unchanged

### Requirement: No persistence-model or schema changes

CR-001 validation MUST be implemented without modifying entities, entity mappings, shared column decorators, database schema, or migrations. In particular, `producto.denominacion` MUST remain mapped as `text`; the 200-character Product limit is an application boundary only.

#### Scenario: Application-only Product length rule

- GIVEN a Product denomination has 200 characters
- WHEN application validation runs against the existing entity mapping
- THEN the request MUST be accepted without requiring a schema alteration
- AND no entity or migration change MUST be needed to enforce the 200-character boundary
