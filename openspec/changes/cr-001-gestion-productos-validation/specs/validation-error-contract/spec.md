# Validation Error Contract Specification

## Purpose

Ensure DTO validation failures remain actionable after global exception handling.

## Requirements

### Requirement: Validation messages reach API clients

For every `ValidationPipe` failure, the API MUST return HTTP 400 with `statusCode`, `timestamp`, `path`, a `message` array containing the validator messages, and `fieldErrors` grouping those messages by property. The global exception filter MUST NOT replace them with only `Bad Request Exception`.

#### Scenario: Invalid product request
- GIVEN a product write request violates one or more DTO rules
- WHEN the global exception filter produces the response
- THEN the response MUST retain every validation message and associate it with its field

#### Scenario: Multiple invalid fields
- GIVEN one request violates rules on multiple properties
- WHEN validation fails
- THEN `fieldErrors` MUST contain every affected property without attempting persistence

### Requirement: Validation responses are environment independent

The public validation contract MUST be identical in development and production. Production responses MUST NOT expose stack traces or internal exception objects.

#### Scenario: Production validation failure
- GIVEN the application runs outside development mode
- WHEN DTO validation fails
- THEN the client MUST receive the same field messages and MUST NOT receive stack or internal exception details
