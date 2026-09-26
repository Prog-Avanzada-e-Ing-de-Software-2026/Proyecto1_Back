# Archive Report: audit-linea-superlinea-test-coverage

## Status

Archived on 2026-09-19 as `2026-09-19-audit-linea-superlinea-test-coverage`.
Delivery strategy: single-pr (no PR opened, nothing committed or staged; changes remain in the working tree on branch `CR-003-Testing`).

## Artifacts preserved

All source artifacts moved byte-for-byte (verified with `diff -r`, empty output):

- proposal.md
- exploration.md
- design.md
- tasks.md
- specs/linea-superlinea-test-coverage/spec.md

## Specs synced

| Capability | Action | Details |
|---|---|---|
| linea-superlinea-test-coverage | Created | New main spec at `openspec/specs/linea-superlinea-test-coverage/spec.md`; 4 requirements added (Current CP traceability, Behavior and evidence-level classification, Separate and scoped runners, Truthful infrastructure reporting and scope preservation). +4, ~0, -0. |

## Validation

| Command | Result |
|---|---|
| `openspec validate audit-linea-superlinea-test-coverage --strict` (pre-archive) | valid |
| `openspec archive audit-linea-superlinea-test-coverage -y` | exit 0; spec created (+4 requirements); change archived |
| `openspec validate linea-superlinea-test-coverage --strict` (post-archive) | valid |
| `diff -r /tmp/sdd-archive-snap <archived change folder>` | empty (exit 0) — byte-identical move |

## Task completion

`tasks.md` reports 13/14 tasks complete. The single unfinished item is an intentional, real production gap:

- **CP-63 (SuperLínea self-denomination on update)** remains RED/pending. `SuperLineaService.checkDenominacionExists` is called with a single argument and does not receive the current entity ID, so a self-update is wrongly reported as a denomination conflict. The assertion is preserved as RED evidence and the fix is **deferred to a separate branch**. Production code was intentionally NOT modified in this change.

## Final-state facts (post-dating the intermediate apply/verify snapshots)

- The 9 Línea/SuperLínea test files were normalized to Spanish using the `CP-XX - <descripción>` / `No-CP - <descripción>` convention. 94 description strings changed (`git diff --stat`: 94 insertions / 94 deletions). Only title strings changed — no logic and no CP label changes.
- `tasks.md` and `design.md` were reconciled with the actual branch-wide Testcontainers/manifest refactor: manifest-driven selection (`test/config/without-testcontainers.json`, `test/config/with-testcontainers.json`), a single `jest.config.js`, per-file MySQL container (`test/integration/mysql-test-container.ts`), `test/integration/test-datasource.ts`, and `test/integration/harness-safety.int-spec.ts`. `jest.config.integration.js`, `global-setup.ts`, `global-teardown.ts`, and the `test:linea-superlinea*` scripts no longer exist.

## Verification evidence observed on this branch (Docker available)

| Command | Result |
|---|---|
| `yarn test` | 147 passed, 1 failed (CP-63) |
| `yarn test:integration` | 82 passed, 1 failed (CP-63) |
| `yarn build` | OK |
| `openspec validate ... --strict` | valid |

The single failure in each suite is the truthful CP-63 production gap above; it is reported as pending, not as passing evidence.

## Unresolved findings

- CP-63 self-denomination on SuperLínea update: RED, deferred to a separate branch.

## Source of truth updated

`openspec/specs/linea-superlinea-test-coverage/spec.md` now reflects the change behavior.

## Cycle closure

The SDD cycle for this change is closed. Implementation is partial by design: all CP evidence except CP-63 is complete and green. Verification was observed (unit, integration, build, strict spec validation). Production code, API, schema, and migrations are unchanged. No commit or push was performed.
