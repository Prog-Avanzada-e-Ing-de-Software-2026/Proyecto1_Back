# Product Write Validation Specification

## Purpose

Define the accepted write contract for products, product lines, brands, and price updates.

## Requirements

### Requirement: Safe and consistent denomination validation

The system MUST normalize denomination values only when they are strings and MUST apply the same rules on create and update. Product denominations MUST contain at most 200 characters; line and brand denominations MUST contain at most 255 characters. Each rejected rule MUST identify the field and cause.

#### Scenario: Valid denomination
- GIVEN a supported string denomination with surrounding whitespace
- WHEN a product, line, or brand is created or updated
- THEN the normalized value MUST be validated and accepted

#### Scenario: Invalid denomination type
- GIVEN a null, numeric, or non-string denomination
- WHEN the request is validated
- THEN it MUST return 400 with a denomination type error and MUST NOT produce an internal error

### Requirement: Strict boolean inputs

Product boolean fields MUST accept only JSON booleans or the strings `"true"` and `"false"`; the system MUST NOT coerce any other value to a boolean.

#### Scenario: Invalid boolean representation
- GIVEN `costoEnDolar`, `destacado`, or `envioGratis` contains `1`, null, or an unrelated string
- WHEN the request is validated
- THEN it MUST return 400 and MUST NOT persist a substituted value

### Requirement: Persistable numeric values

Costs and prices MUST be non-negative decimals with at most 5 decimal places; stock and minimum stock MUST be non-negative decimals with at most 3 decimal places. Pack quantity MUST be a positive integer. Product `porcentaje`, which represents the domain margin, and VAT values MUST fit their persisted precision; VAT MUST be one of 0, 10.5, 21, or 27. Validation MUST NOT impose an unconfirmed margin formula, sign, or range beyond persistence constraints.

#### Scenario: Fractional stock
- GIVEN stock or minimum stock is `1.5`
- WHEN a product or line is written
- THEN validation MUST accept the value

#### Scenario: Invalid numeric boundary
- GIVEN a negative cost, price, stock, or minimum stock, an over-precision decimal, or a non-positive pack quantity
- WHEN the request is validated
- THEN it MUST return 400 with the field and violated boundary

### Requirement: Conditional product values

When `utilizaStockMinimo` is true, `stockMinimo` MUST be supplied for products and lines. When `utilizaPack` is true, `cantidadPorPack` MUST be supplied. Optional dependent values MAY be omitted when their controlling flag is false.

#### Scenario: Missing dependent value
- GIVEN a controlling flag is true and its dependent value is absent
- WHEN the request is validated
- THEN it MUST return 400 naming the missing field

### Requirement: Persistable strings and positive references

`codigoProveedor` MUST contain at most 255 characters. Product relation and audit identifiers, including line, brand, provider, and user identifiers when present, MUST be positive integers.

#### Scenario: Invalid relation identifier
- GIVEN a write request contains a relation identifier equal to zero or below
- WHEN the request is validated
- THEN it MUST return 400 before any relation lookup or persistence attempt

### Requirement: Price update error clarity

Price-update validation MUST identify `costo`, `costoDolar`, `cotizacionDolar`, `porcentaje`, or `usuarioId` by name and MUST distinguish type, range, and precision failures.

#### Scenario: Invalid price update
- GIVEN a price update contains an invalid numeric value or non-positive user identifier
- WHEN the request is validated
- THEN every returned message MUST name the actual invalid field and rule
