# Product Search Validation Specification

## Purpose

Define strict and predictable query validation for product searches without silently dropping invalid filters.

## Requirements

### Requirement: Strict product-search boolean inputs

The system MUST accept `true`, `false`, `"true"`, and `"false"` for `SearchProductoRapidoDto.exacto` and `SearchProductoPaginationWithDto.codReferenciaExacto`, `codProveedorExacto`, and `conStock`. It MUST NOT coerce or erase any unsupported value. Invalid values MUST produce a controlled HTTP 400 response.

#### Scenario: Supported boolean query value
- GIVEN a product-search boolean field contains a supported boolean or lowercase string form
- WHEN the query DTO is transformed and validated
- THEN the field MUST retain the represented boolean value

#### Scenario: Invalid required-or-defaulted boolean query value
- GIVEN `exacto`, `codReferenciaExacto`, or `codProveedorExacto` contains an unsupported string, number, or null
- WHEN the query is validated
- THEN the API MUST return HTTP 400 naming the invalid field
- AND the search MUST NOT execute with a substituted default

### Requirement: Optional stock filter does not hide invalid input

`SearchProductoPaginationWithDto.conStock` MAY be omitted. When present, it MUST satisfy the strict boolean contract; only true absence (`undefined`) MAY bypass validation.

#### Scenario: Stock filter omitted
- GIVEN `conStock` is absent from the query
- WHEN the query is validated
- THEN validation MUST allow the search without a stock filter

#### Scenario: Invalid stock filter supplied
- GIVEN `conStock` is null or contains an unsupported value
- WHEN the query is validated
- THEN the API MUST return HTTP 400 naming `conStock`
- AND the value MUST NOT become `undefined` through transformation

### Requirement: Safe inclusive product-search date boundary

`SearchInformacionProductoDto.fechaHasta` MUST be validated as a date without transformation throwing or substituting an accepted fallback. A valid value MUST remain an inclusive upper bound through `23:59:59.999` UTC on the requested day. An invalid value MUST produce a controlled HTTP 400 response.

#### Scenario: Valid inclusive end date
- GIVEN a valid `fechaHasta` date value
- WHEN the query DTO is transformed and validated
- THEN the resulting upper bound MUST be the end of that UTC day

#### Scenario: Invalid end date
- GIVEN `fechaHasta` cannot be parsed as a valid date
- WHEN the query DTO is transformed and validated
- THEN transformation MUST NOT throw
- AND the API MUST return HTTP 400 naming `fechaHasta`
