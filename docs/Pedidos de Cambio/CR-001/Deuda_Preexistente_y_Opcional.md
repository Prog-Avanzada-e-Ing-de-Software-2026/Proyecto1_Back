# CR-001 — Deuda pre-existente y deuda opcional

Documento de cierre del ciclo SDD de CR-001 (`cr-001-gestion-productos-validation`).
Registra los pendientes que **no** forman parte del alcance de CR-001, separando lo
pre-existente de lo opcional. Fecha: 2026-09-22. Rama: `CR-001` (base `def7a2c`).

Referencia de implementación: commits `ec8bed3` … `b2dc57f` en `CR-001`.
Cambio archivado en `openspec/changes/archive/2026-09-22-cr-001-gestion-productos-validation/`.

---

## 1. Deuda pre-existente (no introducida por CR-001)

### 1.1 Fallas de integración en suites de Producto (3 tests)

Estado actual: la suite de integración seleccionada da 45/48. Los 3 fallos son
**pre-existentes** y se reprodujeron idénticamente sobre la base `def7a2c` en un
worktree aislado con el mismo comando de Testcontainers/Jest.

| Suite | Test | Síntoma |
|---|---|---|
| `src/modules/gestion-productos/producto/application/producto.http.int-spec.ts` | "Cambiar el precio, persistir el cambio y consultar el historial" | `PUT /producto/:id` con body parcial `{denominacion, usuarioUpdatedId, precio}` espera `200`, recibe `400`. |
| `src/modules/gestion-productos/producto/application/controllers/producto.busqueda-general.http.int-spec.ts` | "El modo exacto de búsqueda por código de referencia debe respetarse en search-by" | Devuelve `['1234','12345']` en vez de `['1234']`; el flag `codReferenciaExacto='true'` no aplica el modo exacto. |
| `src/modules/gestion-productos/producto/application/controllers/producto.busqueda-general.http.int-spec.ts` | "Informar un error controlado cuando la base de datos no responde" | Espera `'Error inesperado en la base de datos.'`, recibe `'Internal Server Error'`. |

**Evidencia:** memoria Engram `cr001/preexisting-integration-failures` (obs `#685`).
**Causa raíz del primero (parcial):** contradicción de contrato pre-existente, ver 1.4.

### 1.2 Validación estricta de OpenSpec falla de forma sistémica

`openspec validate cr-001-gestion-productos-validation --strict` falla con
`No delta sections found`: los `spec.md` usan `## Requirements` en lugar de los
headers delta (`## ADDED Requirements`, `## MODIFIED Requirements`, etc.).
Afecta a **todos** los cambios del repositorio (cr-002, cr-003, cr-007 incluidos),
no sólo a CR-001. Además, el CLI advierte que `rules.apply`/`rules.verify` en
`openspec/config.yaml` tienen forma de objeto cuando espera arrays.

**Impacto:** el archivado se ejecutó con el camino mecánico del skill (`cp` + `git mv`),
no con el merge nativo. Los specs principales quedaron sincronizados y verificados por
`diff -r`.

### 1.3 `state.yaml` desactualizado

El `state.yaml` del cambio archivado conserva `paused`, `0/14` tareas y rutas de spec
reemplazadas. El dispatcher nativo (`gentle-ai sdd-status`) resuelve el estado real
desde el filesystem, por lo que es una caché obsoleta, no una fuente de verdad.

### 1.4 Contradicción de contrato en la actualización de Producto

- `producto/application/controllers/producto.controller.spec.ts` (unit) espera **400**
  al omitir campos obligatorios en el update → contrato **estricto**.
- `producto/application/producto.http.int-spec.ts` (integración) espera **200** con un
  update **parcial**.

Ambos no pueden cumplirse a la vez. El `UpdateProductoDto` original ya exigía los campos
obligatorios, por lo que la suite de integración ya fallaba en `def7a2c`. CR-001 mantuvo
el lado estricto (coincide con la HU "Modificar Producto", que lista todos los campos como
obligatorios). **Decisión de producto pendiente** para cerrar la contradicción.

---

## 2. Deuda opcional (mejoras identificadas, no bloqueantes)

### 2.1 Acoplamiento del dominio al módulo de helpers de DTO

`producto/domain/services/producto-intrinsic-validation.service.ts.ts` importa de
`gestion-productos/common/validation/request-validation.helpers`, que mezcla predicados
numéricos puros (`fitsMoneyRange`, `isPositiveInteger`, …) con concerns de transporte/DTO
(`normalizeString`, `toStrictBoolean`, `IsOptionalWhenUndefined`) y con `class-validator`.
El dominio queda transitivamente acoplado al framework de validación.

**Mejora sugerida:** separar en `numeric-rules.ts` (puro, sin `class-validator`) y
`request-transforms.ts` (DTO). Relevante porque PR3 replicó el patrón en los cuatro
intrinsic services de catálogo.

### 2.2 Asimetría `stockMinimo` entre Producto y Línea

Producto rechaza `stock`/`stockMinimo = 0` (la HU exige `> 0`); Línea acepta
`stockMinimo >= 0` (su HU no fija mínimo). Es **intencional**, pero conviene dejarlo
explícito en el lenguaje ubicuo para que no se "uniforme" por accidente.

### 2.3 Parámetros muertos en el service de dominio de Producto

`ProductoIntrinsicState` declara `precioMayorista`, `precioCliente`, `precioOcasional`, y
`validarPrecios()` valida su jerarquía, pero ningún caller los pasa (no están en el DTO):
la validación es un no-op. Pre-existente.

### 2.4 Doble extensión en el nombre de archivo

El archivo real es `producto-intrinsic-validation.service.ts.ts` (también hay otros
`.ts.ts` y `.decarators.ts`). Pre-existente; no "corregir" por accidente.

### 2.5 `fieldErrors` sin allowlist por-DTO

El normalizer emite nombres de campo "seguros" (segmentos identificador/índice) y los
mensajes de constraint, sin una allowlist explícita por DTO. Un cliente puede provocar que
se refleje el nombre de una propiedad desconocida (nunca su valor). El spec se ajustó a
"nombres saneados + mensajes de autor"; una allowlist real por-DTO queda como mejora.

### 2.6 Checkboxes de verificación sin marcar en el `tasks.md` archivado

`V.1`–`V.5` quedaron sin marcar en el `tasks.md` archivado, aunque la verificación se
ejecutó y pasó (`verify-report.md`). El archivado preservó los bytes sin repararlos.

### 2.7 Tamaño del cambio agregado

El rango `def7a2c..HEAD` supera el presupuesto de revisión de ~400 líneas. El trabajo está
partido en 11 commits por slice (PR1a/PR1b/PR1c/PR2/PR3/PR4 + fixes), por lo que la
revisión debe hacerse por slice y no como un diff único.

---

## 3. Pendiente de entrega (decisión del usuario)

- El movimiento a `archive/` y los dos specs principales nuevos
  (`openspec/specs/product-management-validation/`, `openspec/specs/validation-error-communication/`)
  están **sin commitear**. No se hizo push ni PR.
- Estrategia acordada si se abren PRs: encadenados, `feature-branch-chain`.
