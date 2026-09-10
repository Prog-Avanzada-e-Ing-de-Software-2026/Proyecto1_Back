# Repository Agent Guide

Follow this guide for every change in `Proyecto1_Back`. Prefer verified repository evidence over assumptions, keep changes narrowly scoped, and preserve unrelated work already present in the working tree.

## Quick path

1. Read the requested ticket, acceptance criteria, and any related files under `docs/` and `openspec/changes/`.
2. Inspect the current implementation before proposing or changing behavior. Use CodeGraph first for architecture, call-flow, dependency, or impact questions.
3. Identify the affected domain concept and preserve the existing module boundaries.
4. Implement the smallest complete change, following the applicable SDD and testing rules below.
5. Verify with non-mutating checks first, then report what changed, what was verified, and any remaining risk.

## Source-of-truth order

When sources disagree, do not silently choose one or broaden the task. Surface the conflict and resolve it with the user.

1. Explicit user direction and approved acceptance criteria.
2. The active change artifacts and status under `openspec/changes/<change>/`.
3. Current executable behavior and tests.
4. `docs/Analisis_de_Dominio.md` and other project documentation.
5. General conventions inferred from nearby code.

`docs/Analisis_de_Dominio.md` describes the intended DDD direction, but parts of it are aspirational and are not implemented yet. Never invent missing business rules or treat proposed concepts as existing behavior.

## Project stack and commands

- Runtime and package manager: Node.js 24 and Yarn 4. Use `yarn`; do not substitute npm commands.
- Backend: NestJS 11, TypeScript 5.7, TypeORM 0.3, and MySQL 8.
- Build: `yarn build`.
- Unit tests: `yarn test`.
- End-to-end tests: `yarn test:e2e`.
- Coverage: `yarn test:cov`.
- `yarn lint` and `yarn format` modify files. Do not run them as read-only verification, and inspect their resulting diff when used.

## Architecture and DDD

Preserve the repository's current modular NestJS organization and established spelling:

- `domain/entities` and `domain/services`: business state, invariants, and behavior.
- `application/controllers`: HTTP transport concerns only.
- `application/services`: use-case orchestration and coordination.
- `infraestructure`: TypeORM persistence adapters and external technical concerns.
- `dto`: request contracts and boundary validation.
- Module files: dependency wiring and repository-token bindings.

Apply these rules:

- Use the ubiquitous language from `docs/Analisis_de_Dominio.md` when it matches approved scope and current decisions.
- Put business invariants in entities or domain services, not in controllers or persistence adapters.
- Keep DTO validation at the request boundary; do not use DTOs as substitutes for domain invariants.
- Keep TypeORM-specific access in infrastructure. Application and domain code should depend on repository contracts where the module already uses them.
- Treat `Producto` as the intended aggregate root for product invariants, but do not introduce `MovimientoStock`, domain events, CQRS read models, `Precio`/`Margen` value objects, or undocumented pricing and stock rules without approved scope.
- Preserve existing DTO, Nest `Logger`, global exception-filter, soft-delete, audit, and transaction patterns unless the change explicitly improves them.
- Keep controllers and APIs documented through Swagger/OpenAPI when their public contract changes.
- Database synchronization is disabled. Schema changes require a TypeORM migration; never enable `synchronize` as a shortcut.

## Spec-Driven Development (SDD)

OpenSpec artifacts live under `openspec/`; `openspec/config.yaml` defines the project defaults.

- SDD is opt-in. Use it only when the user explicitly requests it or accepts an SDD proposal.
- For an existing change, read its `state.yaml`, proposal, specs, design, and tasks before editing source code.
- Honor operational states such as `paused` even when the engine reports that `apply` is technically ready.
- A scoped, explicit change decision may override a project default. Record the exception in the change artifacts rather than hiding it.
- Proposals define intent, scope, non-goals, risks, and rollback.
- Specifications use RFC 2119 terms and Given/When/Then scenarios.
- Designs preserve module boundaries and explain significant tradeoffs; use sequence diagrams only for genuinely complex flows.
- Tasks are numbered, phased, mapped to requirements, and small enough to complete and verify independently.
- Implementation follows approved tasks without silently expanding scope.
- Verification must prove conformance to the proposal, specs, design, and acceptance criteria before archival.
- Direct work outside SDD must not create synthetic OpenSpec artifacts or pretend that SDD phases ran.

## Testing and verification

- Derive test cases from acceptance criteria and observable contracts.
- The OpenSpec default is strict TDD: RED -> GREEN -> REFACTOR. Follow it unless the active change explicitly documents a scoped exception.
- Use Jest and `@nestjs/testing` for unit tests and Supertest for HTTP behavior.
- Testcontainers is not currently installed. Do not introduce or claim it is available without an explicit dependency and environment decision.
- Keep each commit buildable and passing the relevant tests when tests exist.
- Run the narrowest relevant tests first, then `yarn build`; expand verification according to the change's blast radius.
- Never claim a check passed unless its command actually completed successfully.

## Git and delivery

- Use feature branches and open pull requests into `develop`; do not commit directly to `develop` unless explicitly instructed.
- Keep commits small and atomic: one logical change per commit, with its tests and documentation when applicable.
- Use Conventional Commits: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, or `chore`, with an optional scope.
- Write the subject as an imperative action, without a final period, and keep it at 50 characters or fewer.
- State what changed in the subject; use the body for context and rationale when needed.
- Reference the ClickUp task, issue, or change request when applicable.
- Never add `Co-Authored-By`, AI attribution, or similar metadata.
- Do not commit broken code, secrets, logs, generated output, temporary files, or unrelated working-tree changes.
- Do not commit, push, create a branch, or open a pull request unless the user explicitly asks.

## Change discipline

- Reuse existing components and patterns before adding abstractions.
- Do not manufacture technical debt for reporting purposes. Record genuine debt, its impact, and a concrete follow-up instead.
- Preserve unrelated modified or untracked files.
- Ask one focused question only when a business rule, scope boundary, or destructive action cannot be resolved from authoritative evidence.