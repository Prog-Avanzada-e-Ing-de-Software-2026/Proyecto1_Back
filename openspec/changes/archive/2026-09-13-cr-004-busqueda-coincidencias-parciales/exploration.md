# Exploration: CR-004 — Partial-coincidence search by Denominación, Línea, SuperLínea

## Current State

### Ubiquitous language and entity shape
- The three entities all expose the field `denominacion` (NOT `nombre`):
  - `Producto.denominacion` → `text` (`src/modules/gestion-productos/producto/domain/entities/producto.entity.ts:29-30`)
  - `Linea.denominacion` → `varchar(255)` (`.../linea/domain/entities/linea.entity.ts:24-25`)
  - `SuperLinea.denominacion` → `varchar(255)` (`.../superlinea/domain/entities/superlinea.entity.ts:19-20`)
- `SuperLínea` (`super_linea` table) was introduced by CR-003; `Linea` now has a mandatory `super_linea_id` FK. CR-003 is complete (has verify-report).
- Gap: `docs/Analisis_de_Dominio.md` still does NOT document `SuperLínea` — it only lists Producto/Marca/Línea. The ubiquitous-language doc lags the implemented domain.

### Soft-delete
- All entities use a `deletedAt` column, but inconsistently:
  - `Linea`, `SuperLinea`, `Marca` use `@DeleteDateColumn` (TypeORM auto soft-delete).
  - `Producto` uses a plain `@Column({ type: 'timestamp', nullable: true }) deletedAt` (NOT `@DeleteDateColumn`) — so TypeORM's automatic soft-delete/`withDeleted()` does NOT apply to Producto; its queries manually add `producto.deletedAt IS NULL`.

### Repository pattern (two layers + token binding)
- Domain contract: `domain/interfaces/*.repository.interface.ts` (`IProductoRepository`, `ILineaRepository`, `ISuperLineaRepository`).
- Facade repository: `infraestructure/repositories/*.repository.ts` (implements interface, delegates).
- Persistence adapter: `infraestructure/repositories/*.persistence-adapter.ts` (real TypeORM work).
- Module wiring binds a string token to the facade class, e.g. `{ provide: 'IProductoRepository', useClass: ProductoRepository }` (`producto.module.ts:44-47`, `linea.module.ts:28-31`, `superlinea.module.ts:36-39`). Services inject via `@Inject('I…Repository')`.

### Existing partial-coincidence search (already duplicated across adapters)
Partial containment search by denominación ALREADY exists but is copy-pasted in each adapter and is **accent-insensitive**:
- Producto `findBy` / `findByRapido` — `producto.persistence-adapters.ts:219-341` (`UPPER(producto.denominacion) LIKE UPPER(:denominacion)` with `%…%`).
- Linea `findByDenominacionFiltered` / `findAllFor` / `findAllSinSistemaFor` — `linea.persistence-adapter.ts:191-252`.
- SuperLinea `findBy` / `findAllFor` via private `applyDenominacionFilter` — `superlinea.persistence-adapter.ts:81-181` (`UPPER(alias.denominacion) LIKE :denominacion` with `%…%`).

### Common module infrastructure (partially adopted)
`src/modules/common/` already hosts the reusable pieces CR-004 asks for:
- `persistence/base-persistence.adapter.ts` — abstract `BasePersistenceAdapter<T>` with `baseQuery()` (adds `alias.deletedAt IS NULL`) / `baseQueryWithDeleted()`. **Extended by Linea and SuperLinea adapters, NOT by Producto.**
- `query-builders/query-builder-helpers.ts` — static `QueryBuilderHelper.applyDeletedFilter / applyPagination / applyOrder`. Used by Linea/SuperLinea.
- `query-builders/database-error.helper.ts` — `handleDatabaseError()`.
- `pipes/normalize-denominations-search.pipe.ts` — `NormalizeDenominacionSearchPipe` trims + `toUpperCase()`s the `denominacion` query param. JS `toUpperCase()` preserves accents (Á stays Á), so the pipe is case-normalizing but accent-preserving.
- Pagination DTOs: `dto/pagination.dto.ts` (skip/take), `dto/busquedas/pagination-with-denominacion.dto.ts` (denominacion + skip/take + incluirEliminados). Offset-based, default `take=10`.
- Response envelope `interface/listadoConTotalDto.ts` → `{ data, total }`.
- `common.module.ts` currently only exports `UsuarioValidator`; the persistence/query helpers are consumed via static import, not DI.

### Case-insensitivity and accents (the core gap)
- No `charset`/`collation`/`COLLATE` appears anywhere (migrations, `docker-compose.yml`, `app.module.ts`, `.env*`). `docker-compose.yml` uses `mysql:8.0` with no collation flags → DB default collation is `utf8mb4_0900_ai_ci` (case-insensitive AND accent-insensitive).
- Consequence: the existing `UPPER(x) LIKE '%…%'` search is case-insensitive but ALSO accent-insensitive — `"harina"` matches `"harína"`. This **violates** CR-004's "sin ser case sensitive … pero sí considerando tildes".
- There is no accent-normalization utility and no `COLLATE utf8mb4_bin`/`BINARY` usage anywhere.

### Existing endpoints (all under global `/api`, Swagger at `/api`)
- `GET /producto/search-by` (`producto.controller.ts:100-135`) → `findBy` (denominacion + filters + pagination).
- `GET /producto/search-by-rapido` (`:85-98`) → `findByRapido`.
- `GET /producto/find-all-for-lineas/select` (`:70-83`) and `find-all-for-marcas/select` (`:54-67`) → selection lists.
- `GET /linea/search-by` (`linea.controller.ts:46-60`) → `findByDenominacionFiltered` (paginated lines).
- `GET /superlinea/search-by` (`superlinea.controller.ts:44-49`) → `findBy` (paginated superlines).
- `GET /superlinea/select` (`:51-56`) → `findAllFor` (non-paginated selection list).
- There is **no endpoint** to fetch products of a given SuperLínea (Producto→Linea→SuperLinea). Products of a Línea can already be reached via `GET /producto/search-by?lineaId=X`.

## Affected Areas

- `src/modules/common/query-builders/query-builder-helpers.ts` — add the shared accent-sensitive case-insensitive containment filter (the "component" CR-004 centralizes).
- `src/modules/common/persistence/base-persistence.adapter.ts` — optionally add a generic `busquedaPorCoincidenciaParcial()` protected method reused by adapters.
- `src/modules/gestion-productos/producto/domain/interfaces/producto.repository-interface.ts` — add `busquedaPorCoincidenciaParcial()` to the contract.
- `src/modules/gestion-productos/producto/infraestructure/repositories/producto.repository.ts` + `producto.persistence-adapters.ts` — implement the new behavior; refactor Producto adapter (currently does not extend `BasePersistenceAdapter`, uses raw query builder).
- `src/modules/gestion-productos/linea/domain/interfaces/linea.repository.interface.ts` + `.../linea/infraestructure/repositories/linea.repository.ts` + `linea.persistence-adapter.ts` — expose `busquedaPorCoincidenciaParcial()`.
- `src/modules/gestion-productos/superlinea/domain/interfaces/superlinea.repository.interface.ts` + `.../superlinea/infraestructure/repositories/superlinea.repository.ts` + `superlinea.persistence-adapter.ts` — expose `busquedaPorCoincidenciaParcial()`.
- `src/modules/gestion-productos/producto/application/controllers/producto.controller.ts` + `application/services/producto.service.ts` — new/updated endpoints for product search and "products by línea / by superlínea" pagination.
- `src/modules/gestion-productos/linea/application/controllers/linea.controller.ts` + `.../superlinea/application/controllers/superlinea.controller.ts` — selection endpoints (already largely present).
- `src/modules/common/dto/busquedas/pagination-with-denominacion.dto.ts` — likely reused as the search request contract (already exists).
- Tests (`*.spec.ts`) for the shared component and each repository/controller, per strict TDD (`openspec/config.yaml` `strict_tdd: true`).

## Approaches

### A. Where the shared partial-coincidence component lives

1. **Extend `QueryBuilderHelper` (static) + generic method on `BasePersistenceAdapter`** — add `QueryBuilderHelper.applyPartialCoincidence(query, alias, denominacion)` and a protected `busquedaPorCoincidenciaParcial()` in `BasePersistenceAdapter` that composes `baseQuery()` + filter + order + pagination. Adapters (incl. refactored Producto) call the base method.
   - Pros: maximally DRY; sits exactly in the `common/persistence` + `common/query-builders` locations CR-004 names; matches the existing Linea/SuperLinea pattern.
   - Cons: requires refactoring Producto's adapter to extend `BasePersistenceAdapter` (larger diff); static helper vs DI must be decided.
   - Effort: Medium

2. **Static helper only, no base-class change** — add `applyPartialCoincidence()` to `QueryBuilderHelper`; each adapter keeps its own thin `busquedaPorCoincidenciaParcial()` that calls it.
   - Pros: smallest change; no forced inheritance for Producto; reuses existing static-helper convention.
   - Cons: less DRY than (1) — each adapter still composes the query; the "shared component" is only the WHERE fragment.
   - Effort: Low

3. **New dedicated class** `PartialCoincidenceSearchService`/`-Helper` in `common/persistence`, injected or static.
   - Pros: clean single-responsibility component; testable in isolation.
   - Cons: introduces a new abstraction the codebase doesn't currently have (no injected persistence helpers today); more wiring.
   - Effort: Medium

### B. Expressing accent-sensitive + case-insensitive containment (MySQL 8 + TypeORM)

1. **`LOWER(col) COLLATE utf8mb4_bin LIKE CONCAT('%', LOWER(:x) COLLATE utf8mb4_bin, '%')`** (or the equivalent `LOWER(...) LIKE ... COLLATE utf8mb4_bin` form).
   - Pros: idiomatic MySQL; `LOWER` handles case-insensitivity, binary collation restores accent-sensitivity; works on `text` and `varchar`.
   - Cons: `text` columns may need an explicit `COLLATE` cast on the column side; collation name is a hardcoded constant.
   - Effort: Low

2. **`BINARY LOWER(col) LIKE BINARY CONCAT('%', LOWER(:x), '%')`**.
   - Pros: simpler, no collation-name dependency; byte-wise comparison gives accent-sensitivity after `LOWER`.
   - Cons: `BINARY` casts to a binary charset (can behave differently for some Unicode); less self-documenting than an explicit collation.
   - Effort: Low

3. *(Rejected)* Change column collation to a single "case-insensitive + accent-sensitive" collation — MySQL 8 ships no such built-in collation (`utf8mb4_0900_ai_ci` is both-insensitive; `utf8mb4_0900_as_cs` is both-sensitive). Must combine a function with a binary/as_cs collation. Not viable as a one-liner schema fix.

### C. Endpoint shape for the three HUs

1. **HU-1 (search products by denominación)**: reuse `GET /producto/search-by?denominacion=…&skip=0&take=10`, swapping the internal filter to the shared accent-sensitive component. Optionally add an explicit `busquedaPorCoincidenciaParcial` route alias.
   - Pros: minimal API change; existing DTO/pipe already fits.
   - Cons: `search-by` carries extra filters (marca/linea/proveedor/stock) that aren't in CR-004 scope; semantics may be conflated.
   - Effort: Low

2. **HU-2 (search líneas → select → products of línea, 10/page)**: `GET /linea/search-by?denominacion=…` for selection (or a dedicated `SelectOption[]` endpoint), then `GET /producto/search-by?lineaId=X&skip&take` for products.
   - Pros: reuses existing endpoints almost entirely.
   - Cons: selection response shape today is full `LineaDto[]` with `{ data, total }` (and `findAllFor` returns a hardcoded `total: 1` — an existing quirk); may want a standardized `SelectOption` contract.
   - Effort: Low

3. **HU-3 (search superlíneas → select → products of all lines of selected superlínea, 10/page)**: `GET /superlinea/select?denominacion=…` for selection (exists), plus a NEW endpoint to fetch products by superlínea (join Producto→Linea→SuperLinea), e.g. `GET /producto/by-superlinea/:id?skip&take`.
   - Pros: covers a real gap (no product-by-superlínea query exists).
   - Cons: new repository method + join; needs a new DTO/route and Swagger docs.
   - Effort: Medium

## Recommendation

1. **Shared component (Approach A.1)**: add `applyPartialCoincidence()` to `QueryBuilderHelper` and a protected generic `busquedaPorCoincidenciaParcial()` on `BasePersistenceAdapter`; refactor Producto's adapter to extend `BasePersistenceAdapter` so all three adapters share one implementation. This satisfies CR-004 requirement 5 ("centralized in Common; repositories expose `busquedaPorCoincidenciaParcial()`") with the least new abstraction, reusing the existing `common/persistence` + `common/query-builders` seams.

2. **Accent handling (Approach B.1)**: use `LOWER(col) COLLATE utf8mb4_bin LIKE …` with `%…%` wildcards. Confirm the actual DB collation during design/research (currently unconfirmed — assumed `utf8mb4_0900_ai_ci` from the `mysql:8.0` docker default). Add focused tests proving `"harina"` ≠ `"harína"` and `"Harina"` == `"harina"`.

3. **Endpoints**: keep `GET /producto/search-by` and `GET /linea/search-by`/`GET /superlinea/select`; add one new product-by-superlínea query + route for HU-3. Standardize the selection response (consider the existing `SelectOption` interface). Keep `take=10` default.

4. **"Enter to search" is frontend concern**: the backend only needs to expose an explicit query endpoint that fires on request (no keystroke behavior). Surface this so scope is not accidentally broadened.

## Risks

- **Collation assumption unverified** — the DB default collation is assumed (`utf8mb4_0900_ai_ci`) but never set explicitly; a mismatch would change accent behavior. Must verify before finalizing the SQL.
- **Producto adapter refactor** — it currently does not extend `BasePersistenceAdapter` and its `deletedAt` is a plain column; converting it touches many methods and could regress soft-delete/relations if done carelessly.
- **`text` column on `producto.denominacion`** — `COLLATE`/`LOWER` semantics on `TEXT` differ slightly from `VARCHAR`; needs a verified query pattern for `text`.
- **Scope creep into frontend** — the "press Enter" acceptance criteria are frontend-side; if interpreted as backend work it would broaden the change.
- **Duplicate search semantics** — several overlapping methods exist (`findBy`, `findByRapido`, `findByDenominacionFiltered`, `findAllFor`); consolidating on `busquedaPorCoincidenciaParcial` risks changing behavior of existing consumers if not mapped carefully.
- **`total: 1` quirk** in `LineaService.findAllFor`/`MarcaService.findAllFor` (hardcoded) vs `SuperLineaService.findAllFor` (`data.length`) — inconsistent pagination totals to reconcile.

## Ready for Proposal

Yes — the change is well-scoped and mostly a consolidation of behavior that already exists (with one genuine new query for HU-3). The orchestrator should tell the user:
1. Partial search already exists but is accent-**insensitive** today; CR-004's accent-sensitivity requires a deliberate SQL change (binary collation + `LOWER`).
2. The "Enter" trigger is a frontend concern and will be recorded as out of backend scope (backend exposes a request-fired query endpoint only).
3. The reusable component will live in `src/modules/common/` (extending the existing `QueryBuilderHelper` + `BasePersistenceAdapter`), and the Producto adapter will be refactored to use it.
4. One open question for the user: whether the Línea/SuperLínea selection endpoints should return a slim `SelectOption[]` shape or the existing full `LineaDto[]`/`SuperLineaDto[]`.
