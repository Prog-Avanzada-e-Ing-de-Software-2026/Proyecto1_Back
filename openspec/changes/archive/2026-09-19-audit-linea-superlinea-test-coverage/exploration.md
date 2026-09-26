# Exploration: Audit Current Línea and SuperLínea Test Coverage

**Status:** Static re-audit complete. Tests were not executed.

## Executive summary

`docs/temp/Casos de prueba - Línea y SuperLínea.md` is the current authority. It defines exactly CP-47 through CP-66; the earlier inferred label `LIN-CP-57` was incorrect and is not used here. Every current CP has at least one identifier-bearing test assertion, but no current CP is proven completely at the documented acceptance level: HTTP, persistence, and all documented examples are not consistently covered. The catalog's `Integración` labels therefore overstate the evidence in the unit/controller suites, although two repository files are genuine integration specs.

The current document contains no explicit selector/search exclusion. Selector labels found in tests are consequently stale/removed from this current CP set and are reported below rather than treated as current requirements.

## Current authority and current CP set

The following titles are transcribed from the current document (the table at lines 329–349 and scenario headings at lines 11–324).

| Current CP | Exact current title | Current documented level | Static assertion assessment |
|---|---|---|---|
| CP-47 | Registrar una Línea | Integración | **Partially covered** — integration create/detail asserts one active association, but not the full registration contract. |
| CP-48 | Registrar una Línea | Unitario + Integración | **Partially covered** — omitted/null DTO and mocked missing/deleted parent paths exist; examples are not separately distinguished and no persistence proof exists. |
| CP-49 | Registrar una Línea | Unitario + Integración | **Partially covered** — empty/255/256 and duplicate paths exist, but active versus soft-deleted uniqueness is not separately proven. |
| CP-50 | Modificar Línea | Integración | **Partially covered** — integration reassignment asserts the new parent, but not the complete documented response contract. |
| CP-51 | Modificar Línea | Integración | **Partially covered** — integration omission preserves the association; no complete response contract is asserted. |
| CP-52 | Modificar Línea | Unitario + Integración | **Partially covered** — null/missing/deleted paths are represented by mocks, without distinct state fixtures or post-rejection association proof. |
| CP-53 | Modificar Línea | Unitario + Integración | **Partially covered** — empty/256, duplicate, and self-name paths exist; 255 acceptance and all documented duplicate variants are absent. |
| CP-54 | Consultar Línea | Integración | **Partially covered** — integration detail asserts reduced SuperLínea data; HTTP evidence is absent. |
| CP-55 | Eliminar Línea | Integración | **Partially covered** — integration asserts soft-delete persistence and HTTP unit coverage asserts 200 separately; one complete HTTP-to-database proof is absent. |
| CP-56 | Eliminar Línea | Integración | **Partially covered** — service policy test asserts conflict/no removal, but no integration fixture proves the active Product relationship. |
| CP-57 | Registrar SuperLínea | Integración + E2E/manual | **Partially covered** — service/controller cover creation and 201 with mocks; persisted identifier and response data are not proven. |
| CP-58 | Registrar SuperLínea | Unitario | **Partially covered** — DTO tests cover empty/255/256, but do not establish the complete scenario result contract. |
| CP-59 | Registrar SuperLínea | Integración | **Partially covered** — integration checks soft-deleted case/accent variants; active and all three documented examples are not independently asserted. |
| CP-60 | Consultar SuperLíneas | Integración + E2E/manual | **Partially covered** — integration checks active filtering, fields, and total; populated HTTP behavior is absent. |
| CP-61 | Consultar SuperLíneas | Integración + E2E/manual | **Partially covered** — integration checks empty data/total and controller checks 200, but not as one complete HTTP-to-persistence scenario. |
| CP-62 | Modificar SuperLínea | Integración + E2E/manual | **Partially covered** — integration proves persisted update and identifier preservation; controller 200 is mocked and not connected to persistence. |
| CP-63 | Modificar SuperLínea | Unitario + Integración | **Partially covered** — DTO length validation and self-name policy coverage exist; 255 acceptance and active/soft-deleted duplicate variants are absent. |
| CP-64 | Eliminar SuperLínea | Integración | **Partially covered** — integration proves soft-delete and detail exclusion, but does not separately cover no lines versus only deleted lines. |
| CP-65 | Impedir la eliminación de una SuperLínea con Líneas activas asociadas | Integración + E2E/manual | **Partially covered** — policy/service conflict evidence exists and the integration repository checks active-line detection, but no complete delete-flow integration assertion exists. |
| CP-66 | Consultar el detalle de una SuperLínea eliminada | Integración | **Partially covered** — service exception and integration detail exclusion exist; the documented HTTP 404 assertion is absent. |

### Fully covered current CPs

**None.** “Fully covered” would require all documented examples and the observable level stated by the current document, not merely an identifier-bearing assertion.

### Current CPs with no test evidence

**None at identifier level.** CP-47 through CP-66 each appear in at least one actual test name/description and have a corresponding assertion path. This does not mean every documented example or acceptance condition is tested; those gaps are listed above.

## Stale labels and mappings to removed CPs

The following labels remain in current Línea/SuperLínea test names or descriptions but are not present in the current authority document:

| Stale label | Files/examples | Finding |
|---|---|---|
| CP-68 | both persistence integration specs | “No coincidencias” tests; no current CP mapping. |
| CP-72 | both persistence integration specs and product-related tests | Empty-term tests; no current CP mapping. |
| CP-79 | `linea.controller.spec.ts` | Unsupported select-parameter test; no current CP mapping. |
| CP-82 | Línea controller/service/DTO and Línea integration spec | Selector mapping/order tests; no current CP mapping. |
| CP-83 | Línea integration spec | Accent-sensitive selector tests; no current CP mapping. |
| CP-84 | Línea integration spec | Case-insensitive selector test; no current CP mapping. |
| CP-85 | Línea integration spec | Active-only selector test; no current CP mapping. |
| CP-86 | `linea.controller.spec.ts`, `select-linea.dto.spec.ts` | Empty selector request tests; no current CP mapping. |
| CP-87 | SuperLínea integration spec | Selector case/accent/active-only tests; no current CP mapping. |

There are **no tests mapped to a removed current-document CP-47–CP-66**. The stale labels above refer to CP numbers outside the current document, so they must not be used to infer current requirements. In particular, `CP-87` is not a current SuperLínea requirement, and `LIN-CP-57` must not be reconstructed or retained as a separate identifier.

## Evidence boundary

- **Static evidence:** based only on source inspection of the current test files and the complete current CP document. Assertions were classified by their actual mocks, fixtures, and expectations.
- **Executed evidence:** none. No Jest, build, integration, or E2E command was run during this corrective adjustment.
- Repository integration specs exist at `linea.persistence-adapter.int-spec.ts` and `superlinea.persistence-adapter.int-spec.ts`, but their presence does not prove execution or complete feature-level integration coverage.

## Preserved scope boundaries

No exclusion is explicitly stated in the current CP document. Therefore this re-audit does not preserve the earlier undocumented exclusion of selector cases; instead, it records selector CP-68/72/79/82–87 labels as stale because they are absent from the current authority. No application or test source files were modified.

## Affected areas

- `docs/temp/Casos de prueba - Línea y SuperLínea.md` — current CP authority, read completely.
- `src/modules/gestion-productos/linea/**/*.spec.ts` and `*.int-spec.ts` — Línea evidence inspected.
- `src/modules/gestion-productos/superlinea/**/*.spec.ts` and `*.int-spec.ts` — SuperLínea evidence inspected.
- This artifact only: `openspec/changes/audit-linea-superlinea-test-coverage/exploration.md`.

## Recommendation

Use this corrected mapping as the baseline for any later proposal. First decide whether the intended change is to add the missing documented examples, to add HTTP/integration coverage, or both. Do not add selector tests under CP-47–CP-66 unless the current authority is updated first.

## Risks

- Static evidence can overstate runtime confidence because no tests were executed.
- Mocked repository results cannot prove TypeORM soft-delete, transaction, or relation behavior.
- Stale CP labels can continue to mislead reports until test descriptions are renamed in a separately approved implementation change.

## Ready for Proposal

Yes. The current CP set and its evidence boundary are now explicit; proposal work should treat CP-47 through CP-66 as the only current requirements and retain the no-test-execution boundary from this adjustment.

## Key Learnings

1. The current authority defines CP-47 through CP-66 and does not contain the previously inferred `LIN-CP-57` label.
2. Every current CP has identifier-level test evidence, but none is fully covered at the documented example and execution level.
3. Selector labels CP-68, CP-72, CP-79, and CP-82 through CP-87 are stale relative to the current authority.
4. Static source inspection and executed test evidence must remain separate; this adjustment produced no executed evidence.
