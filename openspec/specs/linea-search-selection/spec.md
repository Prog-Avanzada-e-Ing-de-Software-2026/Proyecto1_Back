# linea-search-selection Specification

## Purpose

Search active líneas by denominación for selection purposes, returning a slim selection shape rather than full entities. Satisfies HU-2.

## Requirements

### Requirement: Search active líneas by denominación

The system MUST return active (non-soft-deleted) líneas whose denominación contains the supplied term, using case-insensitive, accent-sensitive containment matching.

#### Scenario: Matching active línea returned

- GIVEN an active línea `"Harinas"` and search term `"harina"`
- WHEN a línea selection search is executed
- THEN the active línea is returned

#### Scenario: Accent mismatch excluded

- GIVEN an active línea `"harínas"` and search term `"harina"`
- WHEN a línea selection search is executed
- THEN the línea is NOT returned

#### Scenario: No match returns empty result

- GIVEN no línea denominación contains the search term `"xyz"`
- WHEN a línea selection search is executed
- THEN an empty result set is returned

#### Scenario: Empty term returns empty result

- GIVEN an empty or whitespace-only search term
- WHEN a línea selection search is executed
- THEN an empty result set is returned and no líneas are fetched

### Requirement: Exclude inactive líneas

The system MUST NOT return soft-deleted líneas in selection search results.

#### Scenario: Soft-deleted línea excluded

- GIVEN a soft-deleted línea `"Harinas"` and an active línea `"Harinas premium"`
- WHEN a línea selection search for `"harina"` is executed
- THEN only the active línea is returned

### Requirement: Slim selection shape

The system MUST return each matching línea in a slim selection shape exposing `codigo`, `nombre`, and `descripcion`, without full entity fields.

#### Scenario: Slim shape returned

- GIVEN an active línea with code, name, and description
- WHEN a línea selection search matches it
- THEN the result exposes only the selection fields (code, name, description)
