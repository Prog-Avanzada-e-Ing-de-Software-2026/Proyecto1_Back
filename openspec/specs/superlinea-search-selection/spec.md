# superlinea-search-selection Specification

## Purpose

Search active superlíneas by denominación for selection purposes, returning a slim selection shape rather than full entities. Satisfies HU-3.

## Requirements

### Requirement: Search active superlíneas by denominación

The system MUST return active (non-soft-deleted) superlíneas whose denominación contains the supplied term, using case-insensitive, accent-sensitive containment matching.

#### Scenario: Matching active superlínea returned

- GIVEN an active superlínea `"Almacén"` and search term `"almacen"`
- WHEN a superlínea selection search is executed
- THEN the active superlínea is returned

#### Scenario: Accent mismatch excluded

- GIVEN an active superlínea `"almacén"` and search term `"almacen"`
- WHEN a superlínea selection search is executed
- THEN the superlínea is NOT returned

#### Scenario: No match returns empty result

- GIVEN no superlínea denominación contains the search term `"xyz"`
- WHEN a superlínea selection search is executed
- THEN an empty result set is returned

#### Scenario: Empty term returns empty result

- GIVEN an empty or whitespace-only search term
- WHEN a superlínea selection search is executed
- THEN an empty result set is returned and no superlíneas are fetched

### Requirement: Exclude inactive superlíneas

The system MUST NOT return soft-deleted superlíneas in selection search results.

#### Scenario: Soft-deleted superlínea excluded

- GIVEN a soft-deleted superlínea `"Almacén"` and an active superlínea `"Almacén mayorista"`
- WHEN a superlínea selection search for `"almacen"` is executed
- THEN only the active superlínea is returned

### Requirement: Slim selection shape

The system MUST return each matching superlínea in a slim selection shape exposing `codigo`, `nombre`, and `descripcion`, without full entity fields.

#### Scenario: Slim shape returned

- GIVEN an active superlínea with code, name, and description
- WHEN a superlínea selection search matches it
- THEN the result exposes only the selection fields (code, name, description)
