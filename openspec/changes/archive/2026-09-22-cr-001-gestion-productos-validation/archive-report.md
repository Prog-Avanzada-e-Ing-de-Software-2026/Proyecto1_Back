# Archive Report: Harden Product Management Validation (CR-001)

**Change**: `cr-001-gestion-productos-validation`
**Archived to**: `openspec/changes/archive/2026-09-22-cr-001-gestion-productos-validation/`
**Branch**: `CR-001`
**Compared with base**: `def7a2c`
**Archive date**: 2026-09-22
**Artifact store (declared)**: `hybrid` — file archive performed; this report is also mirrored to Engram (`sdd/cr-001-gestion-productos-validation/archive-report`).

This report is the terminal record of the cycle. It describes the state of the change at close. Per the Final-State Authority hierarchy, explicit final-state facts in the archive launch prompt outrank the intermediate `verify-report` snapshot where they differ.

## Outcome

The change shipped. The latest re-verification records **ARCHIVE READY**: all CR-001-owned normative implementation requirements are met by the current code and corrected specifications, the unit suite and build pass, and the selected integration run contains no new CR-001 failure. One documented, scoped testing exception and several pre-existing/non-blocking items are recorded below without being reclassified as CR-001 defects.

## What Shipped

All six planned slices plus review/verification fixes are applied as local commits on branch `CR-001`. `git log --oneline def7a2c..HEAD` lists:

- `ec8bed3` refactor(openspec): re-plan CR-001 artifacts
- `34f5891` feat(producto): harden product validation — PR1a (shared helpers + Product DTOs)
- `70ff861` feat(catalogo): harden catalog dto validation — PR1b (catalog DTOs)
- `66d56b2` feat(producto): harden search and operation dtos — PR1c (search + `producto-operacion` DTOs)
- `01baffc` feat(producto): enforce product numeric rules — PR2 (Product domain/application numeric rules)
- `3536ba2` feat(catalogo): add catalog intrinsic validation — PR3 (catalog intrinsic validation services)
- `6d25af8` feat(common): expose field validation errors — PR4 (global validation-error communication)

Review/verification fixes:

- `61bd585` fix(validation): correct decimal scale check
- `f1335ff` fix(producto): restore optional search filter
- `16afc23` fix(producto): make precio optional on create
- `b2dc57f` fix(producto): bound remaining monetary fields

## Final Verification State

- **Unit suite**: 26 suites / 195 tests / 0 failed (`yarn test`).
- **Build**: `yarn build` passes.
- **Selected catalog integration**: 38/38 passes (final-state fact from the archive launch prompt).
- **Full selected integration run** (catalog + Product HTTP): 48 tests, 45 passed, 3 failed. Per the launch prompt, all three failures are **pre-existing on base `def7a2c`** and out of CR-001 scope. The intermediate `verify-report.md` snapshot, at verification time, recorded the same three failures as reproduced on base with no additional CR-001 failure.

### Pre-existing integration failures (NOT CR-001 defects)

Reproduced on `def7a2c`, out of CR-001 scope:

1. `producto.http.int-spec.ts` — one test expects a partial Product update to return 200 but receives 400.
2. `producto.busqueda-general.http.int-spec.ts` — exact reference-code search returns an extra row.
3. `producto.busqueda-general.http.int-spec.ts` — the database-down response expects `Error inesperado en la base de datos.` but receives `Internal Server Error`.

No additional integration failure was observed, so the selected run contains zero CR-001 regressions.

## Documented Testing Exception

Strict TDD is a documented, scoped exception for this change: **no new test files or test cases were authored**; the existing suites are the specification. The only permitted test edit was replacing the obsolete `FAIL BY DESIGN` comment in `producto.service.registro.spec.ts`; no assertion was weakened or added.

## Persistence / Schema

No entity, entity-mapping, shared column decorator, database schema, or migration change was made. `producto.denominacion` remains mapped as `text`; the 200-character Product limit is an application-only boundary. No TypeORM `synchronize`, data cleanup, or schema rollback is required.

## Task Progress (bytes preserved, not repaired)

- Native refreshed status: **28 / 33 complete**, 5 pending.
- All Phase PR1a–PR4 tasks are checked `[x]`.
- The 5 pending items are the Final Verification tasks `V.1`–`V.5`, left unchecked in `tasks.md`. Their evidence is covered by the verification run (unit suite, build, integration, scope diff) described above, but the checkboxes were intentionally **not** repaired during archive; the archived `tasks.md` retains its original bytes.

## Specs Synced (delta → main store)

The archive launch prompt and refreshed native status report the two delta domains; neither main spec existed in `openspec/specs/`, so each delta was treated as a full spec and copied mechanically (shell `cp`, verified by `diff -r`):

| Domain | Action | Details |
|--------|--------|---------|
| `product-management-validation` | Created | Full spec copied to `openspec/specs/product-management-validation/spec.md` (10 requirements). |
| `validation-error-communication` | Created | Full spec copied to `openspec/specs/validation-error-communication/spec.md` (3 requirements). |

These domains are newly introduced by CR-001, so no existing main-spec requirement was modified or removed. The shared `sdd-archive-compose` path was not applicable (no canonical main spec to merge into).

## Archive Contents (observed at close)

- `proposal.md`: present
- `specs/`: present (`product-management-validation/`, `validation-error-communication/`)
- `design.md`: present
- `exploration.md`: present
- `tasks.md`: present — 28/33 tasks complete; 5 unfinished (V.1–V.5 unchecked)
- `state.yaml`: present (stale; see notes)
- `verify-report.md`: present
- `archive-report.md`: this file (additive; did not exist in the source change folder)

## Remaining Non-blocking Notes

1. **OpenSpec parser mismatch (pre-existing, systemic)**: `openspec validate ... --strict` fails for this change because it uses `## Requirements` instead of recognized delta headers (`## ADDED Requirements`, etc.). Per the launch prompt this is **not** a CR-001 defect; the installed CLI also warns that object-shaped `rules.apply`/`rules.verify` are ignored. This was reported as a limitation rather than worked around by hand-editing artifact headers.
2. **Stale `state.yaml` (non-CR-001)**: it still reports paused / 0 completed / missing apply progress / verify blocked and references superseded spec paths (`product-write-validation`, `product-search-validation`, `validation-error-contract`). Refreshed native status supersedes it and reports `archive: ready`; the historical file was preserved unchanged.
3. **Accepted coverage gaps**: Marca, Presentación, and `producto-operacion` DTO validation plus global validation-error communication lack dedicated automated coverage under the approved no-new-tests policy. This gap is accepted, not an oversight.
4. **Task wording residue (non-blocking)**: `tasks.md` scope-guardrail line 50 still states catalog relation/audit IDs are optional, while the detailed task rows, both specs, design, and implementation all require a positive `usuarioUpdatedId`. The stale sentence was not modified during archive; a documentation cleanup pass could correct it.
5. **Review workload**: the aggregate `def7a2c..HEAD` diff remains above the 400-line review budget; the established review slices (PR1a–PR4) are preserved.

## Commands Run and Observed Results

| Command | Exit | Observed result |
|---|---:|---|
| `git status --short` / `git branch --show-current` / `git log --oneline def7a2c..HEAD` | 0 | Branch `CR-001`; 11 commits listed; unrelated docs/untracked working-tree entries preserved. |
| `gentle-ai sdd-status cr-001-gestion-productos-validation --cwd <repo> --json` | 0 | `artifactStore: openspec`, `archive: ready`, `allowedEditRoots: [<repo>]`, tasks 28/33. |
| `cp` + `diff -r` (main spec `product-management-validation`) | 0 | Empty diff (exit 0) between delta and copied main spec; then `mv` into place. |
| `cp` + `diff -r` (main spec `validation-error-communication`) | 0 | Empty diff (exit 0) between delta and copied main spec; then `mv` into place. |
| `git mv` change folder → archive + `diff -r <snapshot> <destination>` | 0 | `GIT_MV_OK`; verbatim `diff -r` output empty (exit 0); source directory absent after move. |

Verbatim archive-move readback:

```
--- diff -r snapshot vs destination (MANDATORY readback) ---
--- (diff exit 0) ---
```

Verbatim spec-copy readbacks (each empty = byte-identical):

```
--- diff -r openspec/changes/cr-001-gestion-productos-validation/specs/product-management-validation/spec.md openspec/specs/product-management-validation/.spec.md.OTVAen (domain: product-management-validation) ---
--- (exit 0) ---
--- diff -r openspec/changes/cr-001-gestion-productos-validation/specs/validation-error-communication/spec.md openspec/specs/validation-error-communication/.spec.md.juOreN (domain: validation-error-communication) ---
--- (exit 0) ---
```

## SDD Cycle Complete

The change is archived. Implementation: complete on branch `CR-001` (all PR1a–PR4 slices, plus review and verification fixes), with no schema or entity change. Verification: ARCHIVE READY — unit 26/195/0, build passes, selected catalog integration 38/38, and no new CR-001 integration failure (3 failures are pre-existing on base `def7a2c`). Unfinished tasks: V.1–V.5 checkboxes remain unchecked in the preserved `tasks.md`; their evidence is covered by the verification run. No unresolved CR-001 defect; remaining items are pre-existing/systemic, accepted-coverage, stale-state, or documentation-cleanup notes.
