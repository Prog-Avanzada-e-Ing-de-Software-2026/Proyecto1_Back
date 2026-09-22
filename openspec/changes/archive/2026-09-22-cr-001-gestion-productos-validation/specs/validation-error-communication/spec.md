# Validation Error Communication Specification

## Purpose

Define the stable, production-safe public response for recognized global `ValidationPipe` failures while adding deterministic field-specific details.

## Requirements

### Requirement: Stable validation error envelope

For a recognized request-validation failure, the API MUST return HTTP 400 and MUST retain the existing public envelope keys `statusCode`, `timestamp`, `path`, and the generic `message`. Field-specific validation detail MUST be additive and MUST NOT replace or remove those keys.

#### Scenario: Single invalid field

- GIVEN a Product, Línea, Marca, Presentación, Producto-Operación, or SuperLínea request violates one DTO rule
- WHEN the global validation boundary formats the response
- THEN the response MUST have status 400
- AND it MUST contain `statusCode`, `timestamp`, `path`, and the existing generic `message`
- AND it MUST include deterministic detail identifying the invalid field and violated public rule

#### Scenario: Multiple invalid fields

- GIVEN one request violates rules for multiple fields
- WHEN the validation response is formatted
- THEN field details MUST include every affected field
- AND field ordering and each field's message ordering MUST be deterministic
- AND persistence MUST NOT be attempted

### Requirement: Production-safe field details

Validation details MUST contain only sanitized public field names (safe identifier and numeric index segments) and authored constraint messages. They MUST NOT expose stack traces, raw exception objects, internal class names, arbitrary request values, database details, or implementation-specific diagnostics. Non-validation exceptions MUST retain their existing status and public-envelope behavior.

#### Scenario: Production validation failure

- GIVEN the application is running in production mode and a DTO validation failure occurs
- WHEN the error response is returned
- THEN it MUST expose the same public validation shape and deterministic field details as in development
- AND it MUST NOT expose a stack trace, raw exception, or internal diagnostic data

#### Scenario: Non-validation exception

- GIVEN an exception is not a recognized global request-validation failure
- WHEN the global error boundary formats the response
- THEN its existing status and public-envelope behavior MUST remain unchanged
- AND the validation-detail field MUST NOT be populated from arbitrary internal exception data

### Requirement: Normalized nested field paths

When validation reports nested or indexed properties, the public detail MUST normalize them into deterministic field paths that identify the failing request field without exposing internal object representations.

#### Scenario: Nested validation path

- GIVEN a recognized validation failure occurs on a nested or indexed request property
- WHEN the public response is generated
- THEN the detail MUST identify the normalized nested path
- AND repeated equivalent failures MUST produce the same path and ordering
