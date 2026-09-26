# PR: `feat(cr-001): validación de productos y catálogo, y comunicación de errores`

> Rama: `CR-001` → `develop`
> Descripción lista para pegar en el PR.

## Contexto

El objetivo fue cubrir las reglas de validación del alta y la modificación de
Producto, Línea, Marca, Presentación y SuperLínea, y exponer los
errores de validación al cliente con un envelope estable y nombres de campo
saneados.

## Qué incluye

- **Reglas intrínsecas de Producto**: `costo >= 0`, `porcentaje` (margen) `> 0`,
  `stockActual > 0`, `stockMinimo > 0`, pack (`utilizaPack` / `cantidadPorPack`)
  y alícuota de IVA, con la escala y el rango compatibles con la persistencia
  (monetario `decimal(15,5)`, cantidades `decimal(12,3)`, porcentaje
  `decimal(5,2)`).
- **Contrato de escritura completo** en create y update: el estado obligatorio
  debe estar presente y las relaciones Marca / Línea / Presentación deben
  resolverse activas antes de persistir.
- **Validación intrínseca de catálogo** para Línea, Marca, Presentación y
  SuperLínea (denominación, relaciones e IDs de auditoría).
- **Comunicación de errores de validación**: `RequestValidationException` con
  `fieldErrors` saneados (segmentos de identificador/índice, sin `target` ni
  `value`), `exceptionFactory` global en `main.ts` y propagación por el
  `GlobalExceptionFilter`.
- **Desacople de los helpers de validación**: se separan `numeric-rules.ts`
  (predicados puros, sin imports) y `request-transforms.ts` (transforms + decoradores
  de `class-validator`), para que los servicios de dominio no dependan del
  framework de validación.
- **SuperLínea**: eliminación del índice único de denominación
  (`RemoveSuperLineaDenominacionUnique`) y ajuste de `checkDenominacionExists`
  para contemplar el ID de la entidad (corrige el caso de modificar una
  SuperLínea conservando su propia denominación).
- **Mensajes de error**: se informan los decimales máximos (monetario 5,
  cantidad 3, porcentaje 2), se nombra la entidad y su ID en los "no encontrado"
  y se quitan las comillas dobles escapadas de los conflictos
  (`La denominación 'X' ya está en uso`).
- **Presentación en búsquedas**: `busquedaPorCoincidenciaParcial` y
  `findProductosBySuperLinea` ahora cargan `presentacion`, que el mapper y el DTO
  de respuesta ya esperaban.
- **Documentación y SDD**: `docs/Pedidos de Cambio/CR-001/*`, los artefactos
  archivados en `openspec/changes/archive/2026-09-22-cr-001-gestion-productos-validation/`
  y los specs sincronizados en `openspec/specs/`.

## Alcance de producción

- Cambios de comportamiento:
  - validación de escritura de Producto y catálogo;
  - `update-precio.porcentaje` pasa de `@IsMoney` a `@IsPercentage` (rango
    0..999,99 y hasta 2 decimales), alineado con `create/update-producto`;
  - `busquedaPorCoincidenciaParcial` y `findProductosBySuperLinea` incluyen la
    presentación en la respuesta.
- Migración nueva: `RemoveSuperLineaDenominacionUnique`. El esquema sigue
  gobernado por migraciones.
- Sin cambios de API pública más allá de los mensajes de error y del campo
  `presentacion` que ahora sí llega en las dos búsquedas.

## Evidencia

- `yarn test` → **26 suites, 195 tests, todo en verde**.
- `yarn test:integration` → **15 suites (14 OK, 1 roja), 103 tests (101 OK, 2 rojos)**.
- `yarn build` → **OK**.
- RED→GREEN del fix de presentación: con el `innerJoinAndSelect` revertido, los
  tests nuevos fallan con `Received: undefined`.

## Pendiente / riesgo

- **2 fallos de integración pre-existentes** en
  `producto.busqueda-general.http.int-spec.ts`, reproducidos sobre la base
  `def7a2c` (no los introduce esta rama):
  1. el modo exacto de `codReferenciaExacto` no se aplica en `search-by`;
  2. la caída de la base de datos devuelve `Internal Server Error` en vez de un
     mensaje controlado.
- `openspec validate --strict` falla de forma **sistémica** en todo el
  repositorio (`No delta sections found`), no sólo en CR-001.
- **Tamaño del cambio agregado**: el rango supera el presupuesto de revisión de
  ~400 líneas. Conviene revisar por slices —los commits ya están separados por
  área (validación de producto, catálogo, comunicación de errores, superlinea,
  follow-ups de deuda)— o encadenar PRs.
