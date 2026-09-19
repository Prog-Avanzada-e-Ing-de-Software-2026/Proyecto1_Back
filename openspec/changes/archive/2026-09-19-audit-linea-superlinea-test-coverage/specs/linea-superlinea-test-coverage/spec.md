# Línea/SuperLínea Test Coverage Specification

## Purpose

Define executable evidence for CP-47 through CP-66 without changing production behavior.

## ADDED Requirements

### Requirement: Current CP traceability

CP-47 through CP-66 in `docs/temp/Casos de prueba - Línea y SuperLínea.md` MUST be the sole CP authority for this change. Every automated test presented as coverage MUST map to one or more of those CPs; other behavior MUST be labeled non-CP or stale and MUST NOT be presented as current CP coverage. A mapping MAY combine related outcomes where the behavior remains observable, and SHOULD prioritize rules, boundaries, errors, and regressions rather than exhaustive low-value CRUD duplication.

#### Scenario: Complete catalog coverage

- GIVEN the current CP catalog contains CP-47..CP-66
- WHEN coverage is reviewed
- THEN each CP in that inclusive range has a mapped evidence entry or is explicitly reported as pending
- AND no removed, inferred, or selector/search-only CP is treated as current authority

#### Scenario: Preserve useful non-CP tests

- GIVEN an automated test exercises behavior outside CP-47..CP-66
- WHEN its traceability is reported
- THEN the test remains available when independently valid
- AND it is labeled non-CP or stale rather than counted as current CP coverage

### Requirement: Behavior and evidence-level classification

Each CP evidence item MUST state whether its proof is unit, HTTP contract, persistence integration, or manual E2E, matching execution. Evidence MUST cover documented successes, rejections/errors, and relevant boundaries: Línea association and reassignment (CP-47..56), SuperLínea creation, uniqueness, listing, update, deletion, and deleted-detail behavior (CP-57..66), including length and soft-delete cases. The suite MUST NOT reintroduce selector/search requirements absent from CP-47..CP-66.

#### Scenario: Correct level for database semantics

- GIVEN a CP outcome depends on MySQL collation, joins, ordering, filtering, or soft-delete persistence
- WHEN its automated evidence runs
- THEN it is classified as persistence integration and observes the real database outcome

#### Scenario: Correct level for isolated behavior

- GIVEN a CP outcome is a pure rule, DTO validation, orchestration, or public response contract
- WHEN its automated evidence runs
- THEN it is classified as unit or HTTP contract as appropriate
- AND manual E2E is used only for complete UI/system flows not claimed as automated evidence

### Requirement: Separate and scoped runners

Default unit/HTTP Jest runs MUST NOT execute `*.int-spec.ts` or tests outside the selected focused CP verification command/project. Integration runs MUST execute `*.int-spec.ts` separately and use real MySQL 8 through Testcontainers when database semantics are the object of proof. Focused selection MUST be explicit and semantic; configuration or scripts MUST NOT hide unrelated failures through arbitrary exclusions.

#### Scenario: Default run isolation

- GIVEN the default Jest command is invoked
- WHEN tests are collected
- THEN integration files and unselected focused CP tests are not executed

#### Scenario: Integration isolation

- GIVEN the integration command is invoked
- WHEN tests are collected
- THEN `*.int-spec.ts` are executed separately against the integration environment
- AND unit/HTTP tests are not silently substituted for database evidence

### Requirement: Truthful infrastructure reporting and scope preservation

Docker/Testcontainers unavailable, skipped, timed out, or failed execution MUST NOT be reported as passing evidence. The integration harness MUST use the real migrations and deterministic lifecycle needed by the executed proof. Changes to Jest configs, scripts, or harnesses MAY occur only when necessary to satisfy these observable runner contracts and MUST preserve visibility of unrelated failures. Production behavior, API, schema, and migrations MUST remain unchanged.

#### Scenario: Infrastructure unavailable

- GIVEN Docker or MySQL cannot be started
- WHEN integration verification is attempted
- THEN the result is reported unavailable or failed with the observed cause
- AND CP evidence is not marked passed

#### Scenario: Production boundary

- GIVEN this change is implemented and verified
- WHEN the resulting diff is inspected
- THEN only test, test-runner, harness, and traceability artifacts may change
- AND production code, public API, schema, and migrations are unchanged
