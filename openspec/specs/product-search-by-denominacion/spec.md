# product-search-by-denominacion Specification

## Purpose

Search active products by denominación using partial containment matching, returned with 10-per-page pagination. Satisfies HU-1.

## Requirements

### Requirement: Search active products by denominación

The system MUST return active (non-soft-deleted) products whose denominación contains the supplied term, using case-insensitive, accent-sensitive containment matching.

#### Scenario: Matching active products returned

- GIVEN an active product `"Harina integral"` and search term `"harina"`
- WHEN a product search by denominación is executed
- THEN the active product is returned

#### Scenario: Accent mismatch excluded

- GIVEN an active product `"harína"` and search term `"harina"`
- WHEN a product search by denominación is executed
- THEN the product is NOT returned

#### Scenario: No match returns empty result

- GIVEN no product denominación contains the search term `"xyz"`
- WHEN a product search by denominación is executed
- THEN an empty result set is returned

#### Scenario: Empty term returns empty result

- GIVEN an empty or whitespace-only search term
- WHEN a product search by denominación is executed
- THEN an empty result set is returned and no products are fetched

### Requirement: Exclude inactive products

The system MUST NOT return soft-deleted products in denominación search results.

#### Scenario: Soft-deleted product excluded

- GIVEN a soft-deleted product `"Harina"` and an active product `"Harina integral"`
- WHEN a product search by denominación for `"harina"` is executed
- THEN only the active product is returned

### Requirement: Paginated results

The system MUST return denominación search results in pages of 10 by default.

#### Scenario: First page of ten

- GIVEN 15 active products whose denominación contains `"harina"`
- WHEN a product search requests the first page
- THEN 10 products are returned

#### Scenario: Remaining page

- GIVEN 15 active products whose denominación contains `"harina"`
- WHEN a product search requests the second page
- THEN the remaining 5 products are returned
