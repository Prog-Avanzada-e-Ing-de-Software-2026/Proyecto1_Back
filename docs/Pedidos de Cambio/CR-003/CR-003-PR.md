# PR: `test(cr-003): auditar cobertura Línea/SuperLínea y unificar el harness de tests`

> Rama: `CR-003-Testing` → `develop`
> Descripción lista para pegar en el PR.

## Contexto

Rama de testing de CR-003 (SuperLínea y asociación obligatoria Línea–SuperLínea).
Cierra la auditoría de cobertura `CP-XX` sobre Línea y SuperLínea y unifica la
infraestructura de tests del módulo `gestion-productos`.

## Qué incluye

- **Cobertura CR-003**: casos CP para `linea` (controller, service, DTO,
  persistence-adapter) y `superlinea` (controller, service, DTO,
  persistence-adapter), incluidos los tests del mapper de selección.
- **Harness unificado**:
  - selección por manifiestos: `test/config/without-testcontainers.json` y
    `test/config/with-testcontainers.json`;
  - un único `jest.config.js` gobernado por la variable `TEST_SUITE`;
  - contenedor MySQL por archivo (`test/integration/mysql-test-container.ts`);
  - `test/integration/harness-safety.int-spec.ts`.
  - Se eliminan `jest.config.integration.js`, `test/integration/global-setup.ts`
    y `test/integration/global-teardown.ts`.
- **Stub de `@nestjs/mapped-types`** para los tests vía
  `test/harness/nestjs-mapped-types.cjs`, con sus propios tests de seguridad.
- **Alineación de tests existentes**: renombre a `.int-spec.ts` de los specs de
  integración, descripciones normalizadas en español con la convención
  `CP-XX - <descripción>`, y ajustes en `marca`, `producto` y specs de migraciones.
- **Documentación**: `AGENTS.md` y `docs/Estrategia_de_Testing.md` alineados al
  runner por manifiestos.

## Alcance de producción

Sin cambios de producción, salvo un refactor menor en
`producto.persistence-adapters.ts` (destructuring de `precio`/`presentacionId`).
No hay cambios de API, esquema ni migraciones.

## Evidencia

- `yarn test` → 147 passed, 1 failed (CP-63)
- `yarn test:integration` → 82 passed, 1 failed (CP-63)
- `yarn build` → OK
- `openspec validate linea-superlinea-test-coverage --strict` → valid

## Pendiente / riesgo

- **CP-63 (SuperLínea: modificar conservando la propia denominación) queda ROJO.**
  `checkDenominacionExists` no recibe el ID de la entidad actual, por lo que el
  auto-update se detecta erróneamente como conflicto de denominación.
- La corrección de producción está **fuera de esta rama**; se resuelve en un
  cambio posterior. Hasta entonces, la suite reporta **1 test unitario y 1 de
  integración en rojo**, de forma intencional y documentada.
- El estado y las decisiones del ciclo SDD quedaron registrados en
  `openspec/changes/archive/2026-09-19-audit-linea-superlinea-test-coverage/`.
