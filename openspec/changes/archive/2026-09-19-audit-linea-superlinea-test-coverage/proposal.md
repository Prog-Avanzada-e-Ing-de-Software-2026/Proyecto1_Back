# Proposal: Correct Línea and SuperLínea Test Coverage

## Why

Current tests mix incomplete CP-47–CP-66 evidence with stale CP labels and runner boundaries that require verification. This change will make coverage traceable and executable under `docs/Estrategia_de_Testing.md` without changing production behavior.

## What Changes

### In Scope

- Audit and complete CP-47–CP-66 tests at the lowest valid level: unit/domain, HTTP contract, or MySQL integration.
- Correct stale CP labels without deleting independently valid selector/search tests or presenting them as current CP requirements.
- Audit the Testcontainers harness, MySQL 8 setup, migrations, cleanup, teardown, integration Jest configuration, and package command; fix only defects demonstrated by repository evidence.
- Keep `*.spec.ts` unit/HTTP tests isolated from `*.int-spec.ts` integration tests, as required by the testing strategy.
- Define exact CP-47–CP-66 execution through explicit file selection, focused commands, or named Jest projects. A narrowly scoped `jest.config.js` adjustment is allowed if required; selection must be semantic and must not hide unrelated failures through arbitrary path exclusions.
- Preserve a separately runnable Docker-dependent integration suite. Unavailable, skipped, timed-out, or failed integration execution must never be reported as passed.

### Out of Scope

- Production behavior, public APIs, schemas, migrations, or business-rule changes.
- New selector/search requirements outside CP-47–CP-66.
- Deleting valid tests merely because they are outside this change’s verification selection.

## Capabilities

### New Capabilities

- `linea-superlinea-test-coverage`: Defines CP-47–CP-66 traceability, test-level and runner separation, scoped execution, integration-harness evidence, and truthful result reporting.

### Modified Capabilities

None. Existing product and selector/search requirements remain unchanged.

## Impact

| Area | Impact |
|---|---|
| Línea/SuperLínea `*.spec.ts` and `*.int-spec.ts` | Correct and complete scoped evidence. |
| `jest.config.js`, `test/config/*.json`, `package.json` | Audit; selection is manifest-driven and narrowly scoped. |
| `test/integration/` | Audit/fix the per-file Testcontainers lifecycle only where needed. |

## Risks

- Runner changes could suppress unrelated failures; use explicit scope selection rather than broad exclusions.
- Docker/MySQL readiness may block integration evidence; report the observed limitation.
- Relabeling stale tests could erase useful intent; preserve their behavior as non-current coverage.

## Rollback Plan

Revert test, harness, runner, command, and change-artifact edits; production code and data remain untouched.

## Success Criteria

- [ ] CP-47–CP-66 map to strategy-compliant tests and exact focused commands/project selection.
- [ ] Default unit/HTTP selection excludes integration, while integration remains separately runnable with Docker.
- [ ] Testcontainers configuration is either evidenced as correct or minimally repaired and verified.
- [ ] Reports distinguish passed, failed, skipped, and unavailable evidence.
- [ ] No valid unrelated test is deleted or misrepresented as a current CP requirement.
