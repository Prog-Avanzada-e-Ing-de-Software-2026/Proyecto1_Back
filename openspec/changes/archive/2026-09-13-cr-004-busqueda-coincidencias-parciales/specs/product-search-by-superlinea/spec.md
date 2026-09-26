# product-search-by-superlinea Specification

## Purpose

List active products belonging to a selected superlínea by traversing Producto → Línea → SuperLínea, returned with 10-per-page pagination. Satisfies HU-3.

## Requirements

### Requirement: List active products of a superlínea

The system MUST return the active (non-soft-deleted) products whose línea belongs to the selected superlínea, including products from all líneas under that superlínea.

#### Scenario: Products across multiple líneas returned

- GIVEN a superlínea `"Almacén"` with two active líneas, each having active products
- WHEN a products-by-superlínea query for `"Almacén"` is executed
- THEN the active products of both líneas are returned

#### Scenario: Superlínea with no products returns empty

- GIVEN a superlínea with líneas that have no active products
- WHEN a products-by-superlínea query is executed
- THEN an empty result set is returned

### Requirement: Exclude inactive products

The system MUST NOT return soft-deleted products or products under soft-deleted líneas in superlínea product results.

#### Scenario: Soft-deleted product excluded

- GIVEN an active and a soft-deleted product under the same superlínea
- WHEN a products-by-superlínea query is executed
- THEN only the active product is returned

### Requirement: Paginated results

The system MUST return superlínea product results in pages of 10 by default.

#### Scenario: First page of ten

- GIVEN 15 active products under a selected superlínea
- WHEN a products-by-superlínea query requests the first page
- THEN 10 products are returned

#### Scenario: Remaining page

- GIVEN 15 active products under a selected superlínea
- WHEN a products-by-superlínea query requests the second page
- THEN the remaining 5 products are returned
