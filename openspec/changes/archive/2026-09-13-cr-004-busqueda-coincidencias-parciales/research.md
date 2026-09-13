# Research: CR-004 — Partial-coincidence search: collation semantics

- schemaName: gentle-ai.sdd-research
- schemaVersion: 1
- revision: 1
- outcome: done
- change: cr-004-busqueda-coincidencias-parciales
- accessed_at: 2026-09-11

## Research questions

- Q1 (local repo evidence): actual charset/collation configured for the project's MySQL database and for the relevant columns — `producto.denominacion` (`text`), `linea.denominacion` (`varchar(255)`), `super_linea.denominacion` (`varchar(255)`).
- Q2 (documentation): MySQL 8.0 default collation for `utf8mb4` and its case- and accent-sensitivity properties; whether `utf8mb4_0900_ai_ci` is accent-insensitive (contradicting CR-004).
- Q3 (documentation): correct SQL for case-insensitive + accent-sensitive containment; compare (a) `LOWER(col) COLLATE utf8mb4_bin LIKE '%…%'`, (b) `BINARY LOWER(col) LIKE '%…%'`, (c) column/table collation `utf8mb4_bin` + `LIKE`/`LOWER`; note TEXT vs VARCHAR behavior and index/SARGability implications.
- Q4 (documentation): how the chosen expression is written in TypeORM's QueryBuilder, and whether TypeORM supports a `collation` option on `@Column`/table.

## Admission

Runtime capability `gentle-ai.sdd-research-capability/v1` declared grants: `documentation` = granted, `open-web` = granted.

Observed runtime availability:

- `documentation`: AVAILABLE via context7 MCP (`context7_resolve-library-id`, `context7_query-docs`). The declared `webfetch` tool is NOT present in this runtime (no `webfetch` function; no MCP web resources/templates). All documentation evidence was produced through context7.
- `open-web`: declared granted, but its sole named tool (`webfetch` for arbitrary URLs) is NOT available at runtime, so no open-web evidence could be produced. No question required open-web; every external claim is documentation-class and served by context7.

No open-web claims are emitted. Local repository files (Q1) are used only as local corroboration, not as an external evidence class.

## Sources

| id | class | title | publisher | url | accessed_at | excerpt |
|----|-------|-------|-----------|-----|-------------|---------|
| L1 | local-repo | docker-compose.yml | (repository) | docker-compose.yml | 2026-09-11 | `image: mysql:8.0`; no `command`, charset, or collation flags; no DB init-script volume |
| L2 | local-repo | .env-temp | (repository) | .env-temp | 2026-09-11 | connection credentials only; no charset/collation variable |
| L3 | local-repo | app.module.ts | (repository) | src/app.module.ts | 2026-09-11 | `TypeOrmModule.forRoot({ type, host, port, username, password, database, timezone, entities, synchronize: false, ssl })`; no `charset`/`collation` option |
| L4 | local-repo | producto.entity.ts | (repository) | src/modules/gestion-productos/producto/domain/entities/producto.entity.ts | 2026-09-11 | `@Column({ type: 'text' }) denominacion` (no charset/collation) |
| L5 | local-repo | linea.entity.ts | (repository) | src/modules/gestion-productos/linea/domain/entities/linea.entity.ts | 2026-09-11 | `@Column({ type: 'varchar', length: 255 }) denominacion` (no charset/collation); unique index `['denominacion','deletedAt']` |
| L6 | local-repo | superlinea.entity.ts | (repository) | src/modules/gestion-productos/superlinea/domain/entities/superlinea.entity.ts | 2026-09-11 | `@Column({ type: 'varchar', length: 255 }) denominacion` (no charset/collation); unique index on `denominacion` |
| D1 | documentation | Server Character Set and Collation | MySQL 8.0 Reference Manual | https://dev.mysql.com/doc/refman/8.0/en/charset-server.html | 2026-09-11 | "MySQL Server uses a default character set and collation, which are utf8mb4 and utf8mb4_0900_ai_ci respectively." |
| D2 | documentation | Character Sets and Collations in MySQL | MySQL 8.0 Reference Manual | https://dev.mysql.com/doc/refman/8.0/en/charset-mysql.html | 2026-09-11 | "collations include options for accent sensitivity (ai/as) and case sensitivity (ci/cs)" |
| D3 | documentation | Collation Naming Conventions | MySQL 8.0 Reference Manual | https://dev.mysql.com/doc/refman/8.0/en/charset-collation-names.html | 2026-09-11 | "suffixes … _ai for accent-insensitive, _as for accent-sensitive, _ci for case-insensitive, _cs for case-sensitive, … _bin for binary" |
| D4 | documentation | Unicode Collation Algorithm (UCA) Versions | MySQL 8.0 Reference Manual | https://dev.mysql.com/doc/refman/8.0/en/charset-unicode-sets.html | 2026-09-11 | "Unicode collations … typically accent-insensitive and case-insensitive, denoted by the _ai and _ci suffixes." / "LOWER() and UPPER() … perform case folding based on the collation of the argument. If a character's case conversion is only defined in a Unicode version higher than 4.0.0, these functions will only perform the conversion if the argument's collation uses a sufficiently high UCA version." |
| D5 | documentation | Case Sensitivity in String Searches | MySQL 8.0 Reference Manual | https://dev.mysql.com/doc/refman/8.0/en/case-sensitivity.html | 2026-09-11 | "`_col_name_ COLLATE utf8mb4_bin LIKE 'a%'`" is a binary/case-sensitive comparison; nonbinary comparisons are case-insensitive by default |
| D6 | documentation | String Comparison Functions and Operators | MySQL 8.0 Reference Manual | https://dev.mysql.com/doc/refman/8.0/en/string-comparison-functions.html | 2026-09-11 | `SELECT 'abc' LIKE _utf8mb4 'ABC' COLLATE utf8mb4_bin; -> 0` and `SELECT 'abc' LIKE BINARY 'ABC'; -> 0` |
| D7 | documentation | The binary Collation Compared to _bin Collations | MySQL 8.0 Reference Manual | https://dev.mysql.com/doc/refman/8.0/en/charset-binary-collations.html | 2026-09-11 | `SET NAMES utf8mb4 COLLATE utf8mb4_bin; SELECT LOWER('aA'), UPPER('zZ'); -> 'aa', 'ZZ'`; `utf8mb4_bin` = PAD SPACE, `utf8mb4_0900_bin` = NO PAD |
| D8 | documentation | B-Tree Index Characteristics | MySQL 8.0 Reference Manual | https://dev.mysql.com/doc/refman/8.0/en/index-btree-hash.html | 2026-09-11 | "`LIKE '%Patrick%'`" (leading wildcard) does not use a B-tree index |
| D9 | documentation | CREATE TABLE / Column Data Types and Attributes | MySQL 8.0 Reference Manual | https://dev.mysql.com/doc/refman/8.0/en/create-table.html | 2026-09-11 | "prefix indexing … mandatory for BLOB and TEXT columns" |
| T1 | documentation | Decorator reference > @Column | TypeORM Docs | https://typeorm.io/docs/help/decorator-reference | 2026-09-11 | "@Column … `charset: string` — Defines a column character set … `collation: string` — Defines a column collation." |
| T2 | documentation | Decorator reference > @Entity | TypeORM Docs | https://typeorm.io/docs/help/decorator-reference | 2026-09-11 | @Entity options listed: `name`, `database`, `schema`, `comment`, `engine`, `synchronize`, `orderBy` (no charset/collation) |
| T3 | documentation | Select Query Builder | TypeORM Docs | https://typeorm.io/docs/query-builder/select-query-builder | 2026-09-11 | `.where("user.id = :id", { id: 1 })` — raw SQL fragment with named-parameter binding |
| T4 | documentation | MySQL / MariaDB Data Source Options | TypeORM Docs | https://typeorm.io/docs/drivers/mysql | 2026-09-11 | "You can also configure poolSize, charset, collation, and timezone." (connection-level options) |
| T5 | documentation | Entities > Column options | TypeORM Docs | https://typeorm.io/docs/entity/entities | 2026-09-11 | column options include "charset and collation for character sets" |

## Validated claims

### Q1 — actual collation (local corroboration)

- C1: No charset or collation is set explicitly anywhere in the project. [L1, L2, L3, L4, L5, L6]
- C2: `docker-compose.yml` uses the `mysql:8.0` image with no collation/charset flags and no DB init scripts; the only env vars are `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`. [L1]
- C3: `producto.denominacion` is `text`; `linea.denominacion` and `super_linea.denominacion` are `varchar(255)`; none of the `@Column` decorators specify `charset` or `collation`. [L4, L5, L6]
- C4: The TypeORM root config (app.module.ts) sets no connection-level `charset` or `collation`; `synchronize: false`; no migration files exist in the repository. [L3]
- C5: Effective default is therefore MySQL 8.0's server default — charset `utf8mb4`, collation `utf8mb4_0900_ai_ci` — inherited by the database, tables, and columns. [D1, L1, L2, L3, L4, L5, L6]

### Q2 — MySQL 8.0 default collation semantics (documentation)

- C6: MySQL 8.0 server default charset/collation is `utf8mb4` / `utf8mb4_0900_ai_ci`. [D1]
- C7: Collation suffix `_ai` means accent-insensitive; `_ci` means case-insensitive. [D2, D3]
- C8: `utf8mb4_0900_ai_ci` is BOTH case-insensitive AND accent-insensitive; therefore `"harina"` matches `"harína"` under this collation, which CONTRADICTS CR-004's "sin ser case sensitive … pero sí considerando tildes" requirement. [D3, D4, D5]

### Q3 — case-insensitive + accent-sensitive containment (documentation)

- C9: Option (a) `LOWER(col) COLLATE utf8mb4_bin LIKE '%…%'` yields case-insensitive + accent-sensitive containment: `LOWER()` folds case (making it case-insensitive), then the `utf8mb4_bin` collation makes the `LIKE` comparison binary and accent-sensitive (`'abc' LIKE _utf8mb4 'ABC' COLLATE utf8mb4_bin -> 0`). [D5, D6, D7]
- C10: Option (b) `BINARY LOWER(col) LIKE '%…%'` is functionally equivalent: `BINARY` forces byte-wise comparison (`'abc' LIKE BINARY 'ABC' -> 0`), which is accent-sensitive after `LOWER()` has folded case. [D6]
- C11: Option (c) — changing the column/table collation to `utf8mb4_bin` — is NOT recommended for this query-only change: it would also make the unique indexes on `linea.denominacion` and `super_linea.denominacion` case/accent-sensitive (changing data-integrity semantics) and would still require `LOWER()` for case-insensitivity. [D5, L5, L6]
- C12: `LOWER()`/`UPPER()` case folding depends on the argument's collation; case mappings defined only in Unicode versions newer than 4.0.0 require a sufficiently high UCA version (the `_0900` collations). Practical consequence: apply `LOWER()` while the column keeps its native `_0900_ai_ci` collation (full Unicode folding), then apply `COLLATE utf8mb4_bin` afterward for the comparison — avoid `LOWER(col COLLATE utf8mb4_bin)` which would restrict case folding. [D4]
- C13: The containment expression is NOT sargable: a leading-wildcard pattern (`LIKE '%…%'`) cannot use a B-tree index regardless of collation. Containment search is inherently non-indexed with standard B-tree indexes. [D8]
- C14: TEXT vs VARCHAR: the comparison semantics for `LOWER`/`COLLATE`/`LIKE` are the same for nonbinary string columns; the practical difference is indexing — a prefix index is MANDATORY for BLOB/TEXT columns and optional for CHAR/VARCHAR. [D9]
- C15: Padding nuance: `utf8mb4_bin` is PAD SPACE while `utf8mb4_0900_bin` is NO PAD; this affects trailing-space edge cases, not the CR-004 accent requirement. [D7]
- C16: For symmetric case-insensitivity the pattern side MUST also be normalized: `LOWER(col) COLLATE utf8mb4_bin LIKE '%x%'` matches only when the input term is already lowercase. The robust form lowercases and binary-collates BOTH sides: `LOWER(col) COLLATE utf8mb4_bin LIKE CONCAT('%', LOWER(:term), '%') COLLATE utf8mb4_bin`. [D5, D6, D7]

### Q4 — TypeORM expression (documentation)

- C17: TypeORM QueryBuilder supports raw SQL fragments with named-parameter binding, so `.where("LOWER(alias.denominacion) COLLATE utf8mb4_bin LIKE :term", { term: '%harina%' })` is valid (alias must match the QueryBuilder alias). [T3]
- C18: `@Column` supports column-level `charset` and `collation` options. [T1, T5]
- C19: The `@Entity` decorator does NOT expose table-level `charset`/`collation` options (its options are `name`, `database`, `schema`, `comment`, `engine`, `synchronize`, `orderBy`). [T2]
- C20: TypeORM's MySQL/MariaDB DataSource options include connection-level `charset` and `collation`. [T4]

## Contradictions

- None. All documentation sources (MySQL 8.0 Reference Manual, TypeORM docs) are mutually consistent, and local-repo files are consistent with the docs' default behavior.

## Uncertainty

- U1: The exact UCA version backing `utf8mb4_bin` was not independently retrieved; the docs imply legacy collations use UCA ≤ 4.0.0 while `_0900` collations use UCA 9.0.0. C12's practical recommendation does not depend on the exact version.
- U2: Whether `LOWER(col) COLLATE utf8mb4_bin LIKE 'x'` vs `LOWER(col) LIKE 'x' COLLATE utf8mb4_bin` (collate on the pattern side) differ materially was not separately tested; both documented forms appear in D5/D6. The recommendation (C16) collates both sides for determinism — flagged as a design-level detail, not a validated claim.
- U3: The live DB schema could have been created by now-removed manual DDL with a non-default collation. Repo evidence shows no such DDL, so the server default (`utf8mb4_0900_ai_ci`) is the best-supported effective value; it is an inference from absence, not an observed live value.

## Freshness

- MySQL 8.0 Reference Manual and TypeORM docs accessed 2026-09-11. The `@Column` `charset`/`collation` options and the QueryBuilder `.where()` parameter-binding behavior are stable across TypeORM 0.2/0.3 (project pins 0.3.22).

## Product choices (non-authoritative — NOT evidence)

These are product decisions the orchestrator/user must confirm; they are not validated claims:

- Which containment expression to adopt: option (a) recommended over (b); option (c) rejected.
- Whether to collate both the column and pattern sides explicitly (C16), or rely on the application pre-lowercasing the term.
- Where the shared component lives (exploration Approach A.1: `QueryBuilderHelper` + `BasePersistenceAdapter`).

## Answers (summary)

- Q1: No explicit collation anywhere; effective default is `utf8mb4` / `utf8mb4_0900_ai_ci`.
- Q2: `utf8mb4_0900_ai_ci` is case-insensitive AND accent-insensitive; it CONTRADICTS CR-004.
- Q3: Recommended expression — `LOWER(col) COLLATE utf8mb4_bin LIKE CONCAT('%', LOWER(:term), '%') COLLATE utf8mb4_bin` (or the equivalent `BINARY LOWER(col) LIKE ...`); do not change the column collation; containment is inherently non-sargable.
- Q4: TypeORM QueryBuilder `.where()` accepts the raw fragment with `:term` binding; `@Column` supports `charset`/`collation`, `@Entity` does not.
