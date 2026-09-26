# partial-coincidence-search Specification

## Purpose

Defines the shared containment matching behavior used by denominación-based searches for Producto, Línea, and SuperLínea entities. The matcher determines whether a typed search term partially coincides with a denominación.

## Requirements

### Requirement: Substring containment

The system MUST treat a term as matching a denominación when the term is contained anywhere within it, not only at the beginning.

#### Scenario: Term contained mid-string

- GIVEN a denominación `"Harina integral"` and search term `"integral"`
- WHEN a containment match is evaluated
- THEN the denominación matches because the term appears after the start

#### Scenario: Term at the start

- GIVEN a denominación `"Harina integral"` and search term `"Hari"`
- WHEN a containment match is evaluated
- THEN the denominación matches because the term is a prefix

#### Scenario: Term not contained

- GIVEN a denominación `"Arroz"` and search term `"trigo"`
- WHEN a containment match is evaluated
- THEN the denominación does NOT match

### Requirement: Case-insensitive matching

The system MUST match denominación and search term without regard to letter case.

#### Scenario: Different case matches

- GIVEN a denominación `"Harina"` and search term `"harina"`
- WHEN a containment match is evaluated
- THEN the denominación matches

#### Scenario: Mixed case matches

- GIVEN a denominación `"Harina"` and search term `"HARINA"`
- WHEN a containment match is evaluated
- THEN the denominación matches

### Requirement: Accent-sensitive matching

The system MUST distinguish accented characters: a term without an accent MUST NOT match a denominación that uses an accent, and vice versa.

#### Scenario: Accent mismatch does not match

- GIVEN a denominación `"harína"` and search term `"harina"`
- WHEN a containment match is evaluated
- THEN the denominación does NOT match

#### Scenario: Matching accent matches

- GIVEN a denominación `"harína"` and search term `"harína"`
- WHEN a containment match is evaluated
- THEN the denominación matches
