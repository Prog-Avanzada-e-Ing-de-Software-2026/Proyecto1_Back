# CR-001 — Decisiones pendientes del dominio de productos

Este documento reúne las decisiones funcionales necesarias antes de cerrar el diseño técnico de `cr-001-gestion-productos-validation`. El objetivo es evitar implementar reglas basadas únicamente en nombres de campos o supuestos técnicos.

## Resumen para los responsables del dominio

Necesitamos confirmar dos puntos:

1. Qué representa `Producto.porcentaje` y cómo debe afectar al precio.
2. Qué operaciones admite `ProductoOperacion.tipoOperacion` y qué significa cada una.

## 1. Semántica de `Producto.porcentaje`

### Situación actual

- El campo pertenece a `Producto` y se persiste como `decimal(5,2)`.
- Los DTO permiten recibirlo y Swagger lo describe como “Porcentaje de aumento”.
- `docs/Analisis_de_Dominio.md` define `Margen` como el porcentaje de ganancia aplicado sobre el costo y establece un margen general del 15 %, con posibles valores especiales por producto.
- El análisis asigna a `Producto.calcularPrecio()` la regla de derivar el precio a partir del costo y el margen; por ejemplo, costo 1000 más margen 15 % resulta en precio 1150.
- Actualmente no participa en ningún cálculo de precio.
- El endpoint general `PUT /producto/:id` puede recibirlo mediante `UpdateProductoDto` y persistirlo con la actualización general del producto.
- Existe un flujo especializado con `UpdatePrecioDto`, pero ningún controller ni application service lo expone; sólo está implementado desde el repositorio hacia abajo.
- En ese flujo especializado, `ProductoMapper.mapPrecios()` copia costo, costo en dólares y cotización, pero omite `dto.porcentaje` antes de guardar la entidad.

### Decisiones solicitadas

1. ¿`Producto.porcentaje` representa exactamente el `Margen` definido en el análisis de dominio?
2. ¿La regla documentada —margen general del 15 % y margen especial por producto— continúa vigente?
3. ¿El porcentaje se aplica siempre sobre `costo` o también puede aplicarse sobre `costoDolar` u otra base?
4. ¿Cuál es la fórmula exacta y qué regla de redondeo debe utilizarse?
5. ¿Puede ser negativo para representar descuentos?
6. ¿Cuáles son sus valores mínimo y máximo permitidos?
7. Cuando cambian el costo o el porcentaje, ¿el precio debe recalcularse automáticamente o requiere confirmación?
8. ¿La actualización de costos, margen y precio debe realizarse mediante una operación específica o como parte de la edición general del producto?
9. Si debe existir una operación específica, ¿qué campos deben modificarse juntos de forma obligatoria?

### Ejemplos requeridos

Solicitamos al menos un ejemplo válido y uno inválido, indicando costo, porcentaje y precio esperado.

## 2. Valores permitidos de `ProductoOperacion.tipoOperacion`

### Situación actual

- La entidad contiene `producto`, `operacionId` y `tipoOperacion`.
- Los DTO de creación y actualización están vacíos.
- El servicio es todavía un scaffold y no persiste operaciones.
- No existe en el código un catálogo autoritativo de tipos de operación.

### Decisiones solicitadas

1. ¿Cuáles son todos los valores válidos de `tipoOperacion`?
2. ¿Qué representa cada valor y qué evento del negocio lo genera?
3. ¿A qué entidad o documento referencia `operacionId` para cada tipo?
4. ¿Una operación puede modificarse o eliminarse, o debe conservarse como registro inmutable?
5. ¿Qué combinaciones de producto, operación y tipo deben considerarse duplicadas?
6. ¿Este módulo debe habilitar persistencia como parte de CR-001 o sólo dejar definido su contrato para una implementación futura?

### Ejemplos requeridos

Solicitamos un ejemplo por cada tipo permitido, indicando el evento de negocio y el significado de `operacionId`.

## Criterio para continuar

El diseño técnico podrá cerrarse cuando las respuestas permitan definir:

- Fórmula, límites y comportamiento de actualización de `porcentaje`.
- Caso de uso autorizado para actualizar conjuntamente costo, margen y precio.
- Enumeración, referencias e invariantes de `ProductoOperacion`.

Hasta entonces, no se incorporará una regla de signo para `porcentaje` ni se habilitará la persistencia de `producto-operacion`.

## Referencias

- `docs/Pedidos de Cambio/CR-001.md`
- `openspec/changes/cr-001-gestion-productos-validation/exploration.md`
- `openspec/changes/cr-001-gestion-productos-validation/proposal.md`
