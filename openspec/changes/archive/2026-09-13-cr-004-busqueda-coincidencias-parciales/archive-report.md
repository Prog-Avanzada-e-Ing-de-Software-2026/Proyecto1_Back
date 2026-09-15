# Archive Report: cr-004-busqueda-coincidencias-parciales

**Archived**: 2026-09-13
**Change**: cr-004-busqueda-coincidencias-parciales
**Artifact store**: openspec
**Archive path**: `openspec/changes/archive/2026-09-13-cr-004-busqueda-coincidencias-parciales/`
**Verdict at close**: pass_with_warnings (0 CRITICAL, 0 blockers)
**SDD cycle**: COMPLETE

> This report describes the state of the change AT CLOSE. The final-state facts supplied in the archive launch prompt postdate `apply-progress.md` and `verify-report.md` and outrank those intermediate snapshots where they disagree. Snapshot-derived claims are attributed to their source and time.

## Final Delivery State (authoritative, post-dates intermediate snapshots)

Delivery is via 5 chained PRs on the tracker branch `CR-004`. All 5 are OPEN and NOT merged. Nothing has been merged to `develop`; the `CR-004` tracker branch will integrate the chain and then merge to `develop`.

| PR | Slice | Target branch | Size note |
|----|-------|---------------|-----------|
| #39 | helper (`partial-coincidence-search`) | `CR-004` | within budget |
| #40 | producto (HU-1 + HU-3 search) | slice-1 | within budget |
| #41 | linea (HU-2 selection) | slice-2 | within budget |
| #42 | superlinea (HU-3 selection) | slice-3 | within budget |
| #43 | team testing strategy | slice-4 | `size:exception` accepted (21 files / 1823 changed lines) |

## Specs Promoted to Source of Truth

All 5 domains are NEW capabilities. No canonical spec existed under `openspec/specs/` before this archive, so each delta spec was promoted as a full spec by mechanical byte-for-byte copy (no model Read/Write, no native-composition merge needed).

| Domain | Action | Requirements | Scenarios | Promoted path |
|--------|--------|--------------|-----------|---------------|
| `partial-coincidence-search` | Created | 3 | 7 | `openspec/specs/partial-coincidence-search/spec.md` |
| `product-search-by-denominacion` | Created | 3 | 7 | `openspec/specs/product-search-by-denominacion/spec.md` |
| `product-search-by-superlinea` | Created | 3 | 5 | `openspec/specs/product-search-by-superlinea/spec.md` |
| `linea-search-selection` | Created | 3 | 6 | `openspec/specs/linea-search-selection/spec.md` |
| `superlinea-search-selection` | Created | 3 | 6 | `openspec/specs/superlinea-search-selection/spec.md` |
| **Total** | | **15** | **31** | |

The delta specs were NOT deleted. They moved with the change folder into the archive and remain the audit trail for this change; the promoted copies in `openspec/specs/` are the new source of truth. The skill does not require deleting delta specs, and preserving them keeps the audit trail intact.

## Task Completion Gate

- Persisted `tasks.md` at close: 23 checked (`- [x]`), 0 unchecked (`- [ ]`).
- No stale-checkbox reconciliation was performed or required; `sdd-apply` marked every completed task in the persisted artifact.
- Native `sdd-status` at the time of archive: `tasks: 23/23 complete`, `apply: all_done`, `verify: all_done`, `archive: ready`, `blockedReasons: []`.

## Final Verification Evidence

Highest-ranked sources agree; numbers carried from the final state, not from the pre-remediation snapshot.

| Check | Result | Source rank |
|-------|--------|-------------|
| `yarn test:integration` | 4 suites / 30 tests green | final-state facts; corroborated by `verify-report.md` (remediation re-run) |
| `yarn test` (passing subset) | 25 suites / 83 tests green | final-state facts; matches `verify-report.md` passing subset |
| `yarn test` (repo-wide) | 22 failing suites, pre-existing and unrelated to CR-004 | final-state facts; corroborated by `verify-report.md` W-07 |
| `yarn build` | exit 0 | final-state facts; corroborated by `verify-report.md` |
| CR-004 scoped unit/controller run | 9 suites / 62 tests green — per `verify-report.md`, evidence revision `03f30ea5`, at verification time | intermediate snapshot (no later work changed it) |
| Spec conformance | 15/15 requirements, 31/31 scenarios | `verify-report.md` (verification time) |

Verification #1 (HEAD `8143510`, evidence revision `388fa5e`) returned `fail` on coverage. Remediation commit `6d1d9d0 "test(cr-004): close verify coverage gaps"` touched only 4 files and no production source, closing CR-01 (positive accent match) and W-01..W-04 (real-DB no-match + superlinea-join pagination) and backfilling the per-task TDD evidence. Verification #2 (HEAD `6d1d9d0`, evidence revision `03f30ea5`) returned `pass_with_warnings`.

## Team Testing Strategy (applied after the original apply)

The team testing strategy (`docs/Estrategia_de_Testing.md`) was applied to CR-004 after the initial implementation and is part of the final state. It added:

- Project testing policy plus CR-004 compliance in `docs/Estrategia_de_Testing.md`.
- A Testcontainers MySQL 8 integration harness: `test/integration/` and `jest.config.integration.js`, exposed via the `test:integration` script.
- Real persistence integration tests for producto, linea, and superlinea, plus the migrated migration spec.
- DTO unit specs, endpoint success/failure paths, and service-scope alignment.

## Mechanical Copy and Move Evidence

Archival is a mechanical filesystem operation. File content was copied/moved only with native shell commands (`cp`, `mv`) via Git Bash; no artifact content passed through model Read/Write.

**Step 2 — spec promotion readback (`diff -r` source vs. staged copy; empty = byte-identical):** exit status 0, empty output for all 5 domains:

```text
### DOMAIN: partial-coincidence-search
--- diff -r .../specs/partial-coincidence-search/spec.md .../.spec.md.ZxaUHO (empty output = byte-identical):
--- diff exit status: 0
[promoted partial-coincidence-search -> openspec/specs/partial-coincidence-search/spec.md]
### DOMAIN: product-search-by-denominacion
--- diff -r .../specs/product-search-by-denominacion/spec.md .../.spec.md.IaLlqf (empty output = byte-identical):
--- diff exit status: 0
[promoted product-search-by-denominacion -> openspec/specs/product-search-by-denominacion/spec.md]
### DOMAIN: product-search-by-superlinea
--- diff -r .../specs/product-search-by-superlinea/spec.md .../.spec.md.T0FETA (empty output = byte-identical):
--- diff exit status: 0
[promoted product-search-by-superlinea -> openspec/specs/product-search-by-superlinea/spec.md]
### DOMAIN: linea-search-selection
--- diff -r .../specs/linea-search-selection/spec.md .../.spec.md.gv5adK (empty output = byte-identical):
--- diff exit status: 0
[promoted linea-search-selection -> openspec/specs/linea-search-selection/spec.md]
### DOMAIN: superlinea-search-selection
--- diff -r .../specs/superlinea-search-selection/spec.md .../.spec.md.ss8iu5 (empty output = byte-identical):
--- diff exit status: 0
[promoted superlinea-search-selection -> openspec/specs/superlinea-search-selection/spec.md]
ALL_PROMOTIONS_DONE
```

**Step 3 — change-folder move readback (pre-move recursive snapshot vs. archived tree):** exit status 0, empty output:

```text
--- git mv intentionally NOT used (launch constraint: do not stage); running mechanical mv
--- diff -r snapshot destination (empty output = byte-identical):
--- diff exit status: 0
ARCHIVE_MOVE_OK
```

Verification of the archive:
- Main specs updated: yes (5 created).
- Change folder moved: yes, to `openspec/changes/archive/2026-09-13-cr-004-busqueda-coincidencias-parciales/`.
- Archive contains all artifacts: proposal.md, design.md, tasks.md, verify-report.md, apply-progress.md, exploration.md, research.md, preproposal.yaml, and `specs/` (5 domain deltas).
- Archived `tasks.md`: 0 unchecked implementation tasks.
- Active `openspec/changes/` no longer contains this change (only `archive`, `cr-001-...`, `cr-003-...`).
- `diff -r` readback present and empty: yes.

**Deviation (recorded):** the skill prefers `git mv` when the change is tracked. The launch constraint forbids staging. The change folder is tracked and the working tree was clean, so `git mv` would have staged the rename. A plain mechanical `mv` was used instead, preserving every other guard (recursive snapshot, destination-collision rejection, source-absence check, `diff -r` byte-identity readback). Content identity is unaffected; only the git index state differs (rename left unstaged for the orchestrator/user to stage as they choose).

## Findings at Close

Ranked per final-state authority. The launch prompt's final-state facts do not state that the `verify-report` warnings W-08, S-02, S-04, S-05, or S-06 were fixed, so they are recorded as observed at verification time; only W-07 is explicitly retained as a final-state fact.

- **W-07 (retained, final state)** — Repo-wide `yarn test` exits 1 on 22 pre-existing failing suites in modules untouched by CR-004. Not a CR-004 regression; out of scope; blocks nothing. Recommendation: track repository-wide suite health separately; do not claim the full suite is green.
- **W-08 (per `verify-report`, at verification time)** — Misleading test label in `producto.service.spec.ts` L76 (named as an accent-mismatch case but asserts repository delegation). Real accent coverage exists in the persistence int-specs.
- **S-02** — Redundant helper assertions in `query-builder-helpers.spec.ts` (tests 1 and 3 both assert `expect(result).toBe(query)`).
- **S-04** — `GET /producto/search-by-denominacion` reuses `PaginationWithDenominacionDto`, whose `incluirEliminados` parameter is validated but silently discarded. Not a spec violation (active-only is required); consider a dedicated DTO.
- **S-05** — `design.md` open questions not annotated with their resolution/deferral; the HU-2 "products of a selected línea" question is served implicitly by the pre-existing `findBy` `lineaId` filter.
- **S-06** — Pagination fixture uses 12 rows for PD-3 where the scenario text says 15; 10-per-page behavior is still proven and PS-3 mirrors the scenario exactly (15 -> 10 + 5).

Resolved by remediation (previous verification's findings): CR-01 (positive accent direction untested) and W-01..W-06, S-01 — all closed, per `verify-report.md` (verification time). CRITICAL findings at close: none.

**Contradictions**: none. The final-state facts and the `verify-report`/`apply-progress` snapshots agree on every overlapping number (integration 4/30, passing unit 25/83, build exit 0, 15/15 requirements, 31/31 scenarios, 23/23 tasks).

## Change State / Closure

- `openspec/config.yaml` `rules.archive` requires warning before merging destructive deltas. This archive merged only ADDED (new) capabilities — no REMOVED/MODIFIED sections, no destructive delta — so no warning/confirmation was required.
- `cr-004` never had a `state.yaml` (unlike `cr-001` and `cr-003`). Per `openspec-convention.md`, the orchestrator owns `openspec/changes/{change-name}/state.yaml`, so no state file was fabricated by archive. Closure is represented by the archive move and is confirmed by native status.
- Post-archive native status: `archived` with `archived.path: openspec\changes\archive\2026-09-13-cr-004-busqueda-coincidencias-parciales`, `dependencies.archive: all_done`, `nextRecommended: archived`, `blockedReasons: []`.
- The archive is an AUDIT TRAIL: nothing inside it may be deleted or modified. This report is additive to the archived folder and did not exist in the pre-move source snapshot, so it is excluded from the byte-identity comparison above.

## Final-State Source Ranking Used

1. Persisted `tasks.md` (completion visibility): 23/23.
2. Explicit final-state facts in the archive launch prompt (PR set, testing-strategy application, remediation outcome, final evidence numbers, retained W-07).
3. `verify-report.md` / `apply-progress.md` (intermediate snapshots) — used only for snapshot-time details, attributed as such.

## Key Learnings

1. A change folder can be archived correctly with a plain mechanical `mv` when the launch constraint forbids staging; snapshot plus `diff -r` readback preserves byte-identity evidence even without `git mv`.
2. When no canonical spec exists for a new capability, promoting the delta spec as a full spec is a shell copy, not a native-composition merge, and the delta specs stay in the archive as the audit trail.
3. The archive report must rank final-state facts above intermediate `verify-report` and `apply-progress` snapshots, because remediation and post-apply work routinely change counts and close findings after those snapshots are written.
