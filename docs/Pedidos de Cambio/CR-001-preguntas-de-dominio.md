# CR-001 — Decisiones del dominio de productos

Este documento registra las decisiones funcionales confirmadas para cerrar el alcance de `cr-001-gestion-productos-validation` y separa los detalles que todavía requieren definición.

## Decisiones confirmadas

### `Producto.porcentaje` representa el margen

- `Producto.porcentaje` es la representación persistida del `Margen` definido en `docs/Analisis_de_Dominio.md`.
- El margen expresa el porcentaje de ganancia aplicado al costo para obtener el precio de venta.
- El análisis de dominio documenta un margen general del 15 %, con posibles valores particulares por producto, y ejemplifica costo 1000 más margen 15 % como precio 1150.
- CR-001 puede validar `porcentaje` como margen respetando la precisión persistida, pero no debe agregar reglas funcionales que todavía no estén confirmadas.

### `producto-operacion` queda excluido

- `producto-operacion` es un scaffold no implementado: sus DTO están vacíos y su servicio no persiste operaciones.
- Todo el módulo, incluidos sus DTO, servicio, tipos de operación, referencias e invariantes, queda fuera de CR-001.
- CR-001 no definirá un contrato preventivo ni preparará la futura habilitación de su persistencia.

## Detalles del margen todavía pendientes

Antes de implementar comportamiento de cálculo o actualización automática deben confirmarse:

1. La base exacta del cálculo (`costo`, `costoDolar` u otra) y la regla de redondeo.
2. Los valores mínimo y máximo permitidos, incluido si admite valores negativos.
3. Si cambiar costo o margen recalcula el precio automáticamente o requiere confirmación.
4. Si costo, margen y precio se actualizan mediante la edición general o mediante un caso de uso específico.

Mientras estos puntos sigan abiertos, CR-001 debe limitarse a validar tipo y precisión compatibles con persistencia, sin inventar fórmula, rango o comportamiento de actualización.

## Hallazgos técnicos relacionados

- `PUT /producto/:id` puede recibir `porcentaje` mediante `UpdateProductoDto` y persistirlo con la actualización general.
- `UpdatePrecioDto` pertenece a un flujo especializado que no está expuesto por controller ni application service.
- En ese flujo especializado, `ProductoMapper.mapPrecios()` omite actualmente `dto.porcentaje`.

## Referencias

- `docs/Analisis_de_Dominio.md`
- `docs/Pedidos de Cambio/CR-001.md`
- `openspec/changes/cr-001-gestion-productos-validation/exploration.md`
- `openspec/changes/cr-001-gestion-productos-validation/proposal.md`
