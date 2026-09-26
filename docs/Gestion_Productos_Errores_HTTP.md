# Gestión de Productos — Contrato de errores HTTP

## 1. Propósito

Este documento describe el **contrato completo de respuestas de error** del módulo `gestion-productos` del backend NestJS, pensado para consumo del **frontend** (y de su asistente de IA). El objetivo es que el cliente pueda distinguir con precisión:

- errores de **validación de entrada** (envelope con `fieldErrors`),
- errores de **regla de negocio / dominio**,
- errores de **conflicto** (duplicados),
- errores de **recurso inexistente**,
- errores **internos** de base de datos o inesperados,
- errores de **autenticación/autorización**.

> **Alcance y límites:** esta tarea fue puramente de **lectura** y de **creación de este único archivo**. No se modificó código fuente, DTOs, configuración de Swagger ni artefactos OpenAPI (`openapi.json`). Todos los mensajes fueron copiados **literalmente** del código. Donde un mensaje o comportamiento no pudo confirmarse, se marca explícitamente como `(no verificado)`.

### Prefijo global

El prefijo de API se define en `src/swagger.config.ts`:

```ts
export const GLOBAL_API_PREFIX = 'api';
```

`src/main.ts` lo aplica con `app.setGlobalPrefix(GLOBAL_API_PREFIX)`. Por lo tanto, **todas las rutas de este documento se exponen bajo `/api/...`** (por ejemplo, `POST /api/producto`), y Swagger UI en `/api`.

> Nota: algunos tests HTTP de integración montan la app sin `setGlobalPrefix` y llaman a `/marca` o `/producto` sin `/api`. Eso es un detalle del arnés de tests, **no** del contrato de runtime. El runtime real usa `/api`.

---

## 2. Envelope base

El filtro global `src/modules/common/filters/global-exception.filters.ts` captura **todas** las excepciones (`@Catch()`) y construye la respuesta.

Campos comunes **siempre presentes**:

```ts
interface ErrorResponseBase {
  statusCode: number;   // status HTTP
  timestamp: string;    // ISO-8601, p. ej. "2026-09-23T15:00:00.000Z"
  path: string;         // request.url, incluye query string
  message: string;      // ver variantes más abajo
}
```

### 2.1 Variante producción

```json
{
  "statusCode": 404,
  "timestamp": "2026-09-23T15:00:00.000Z",
  "path": "/api/producto/999",
  "message": "Producto con ID 999, no existe o fue eliminada"
}
```

### 2.2 Variante desarrollo

Solo cuando `process.env.NODE_ENV === 'development'`, el filtro agrega `stack` y `details` (`details` es `exception.response`):

```json
{
  "statusCode": 404,
  "timestamp": "2026-09-23T15:00:00.000Z",
  "path": "/api/producto/999",
  "message": "Producto con ID 999, no existe o fue eliminada",
  "stack": "NotFoundException: Producto con ID 999, no existe o fue eliminada\n    at ...",
  "details": { "statusCode": 404, "message": "Producto con ID 999, no existe o fue eliminada" }
}
```

Reglas de `message` en el filtro:

- Para excepciones de validación (`RequestValidationException`): `message` es siempre el literal `"Bad Request Exception"` y se agrega `fieldErrors`.
- Para el resto: `message` es `exception.message` si existe; si no, `"Internal Server Error"`.
- `stack` y `details` **no** se agregan en el branch de validación, ni siquiera en `development`.

---

## 3. Envelope de validación (HTTP 400)

La validación de entrada la realiza el `ValidationPipe` global de `src/main.ts`, configurado con:

```ts
new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  exceptionFactory: createRequestValidationException,
})
```

`createRequestValidationException` (`src/modules/common/validation/validation-error.factory.ts`) produce una `RequestValidationException` que **extiende `BadRequestException`**. Por lo tanto el status es **400** (no se usa 422 en este módulo).

```ts
interface FieldValidationError {
  field: string;        // ruta del campo; en este módulo suele ser el nombre plano
  messages: string[];   // mensajes deduplicados y ordenados por clave de constraint
}

interface RequestValidationErrorResponse {
  statusCode: 400;
  timestamp: string;
  path: string;
  message: "Bad Request Exception";
  fieldErrors: FieldValidationError[];
}
```

Ejemplo:

```json
{
  "statusCode": 400,
  "timestamp": "2026-09-23T15:00:00.000Z",
  "path": "/api/producto",
  "message": "Bad Request Exception",
  "fieldErrors": [
    { "field": "costo", "messages": ["El costo debe ser un número."] },
    { "field": "denominacion", "messages": ["La denominación no puede superar los 200 caracteres."] }
  ]
}
```

**Orden y dedupe:** `normalizeValidationErrors` ordena los campos alfabéticamente (`localeCompare`) y, dentro de cada campo, los mensajes por clave de constraint (`localeCompare`) eliminando duplicados. Para campos anidados construye rutas con `.` (objeto) y `[n]` (arrays); en este módulo las peticiones no usan DTOs anidados, por lo que `field` es el nombre plano del campo.

**Propiedad no permitida (`forbidNonWhitelisted: true`):** class-validator emite el constraint `whitelistValidation` con el mensaje literal `property ${property} should not exist` (verificado en `node_modules/class-validator/cjs/validation/ValidationExecutor.js:96`). Ejemplo:

```json
{
  "statusCode": 400,
  "message": "Bad Request Exception",
  "fieldErrors": [
    { "field": "campoInexistente", "messages": ["property campoInexistente should not exist"] }
  ]
}
```

---

## 4. Tabla resumen de códigos HTTP

| Status | Cuándo ocurre | ¿Trae `fieldErrors`? | Ejemplo de `message` |
| --- | --- | --- | --- |
| **400** | `ValidationPipe` (DTO incompleto/tipo inválido/propiedad desconocida); `BadRequestException` de dominio/servicios; pipes (`NormalizeDenominacion*`, `NormalizeCodigoProveedor`); `ParseIntPipe` sobre `:id`/`usuarioId` | Solo en el caso `RequestValidationException` (validation pipe). Las `BadRequestException` de dominio **no** traen `fieldErrors`. | `"Bad Request Exception"` (validación) · `"La denominación es obligatoria"` (dominio) · `"Validation failed (numeric string is expected)"` (ParseIntPipe) |
| **401** | `AuthGuard`: falta header, token inválido o usuario inexistente | No | `"Token no encontrado"` / `"Token inválido"` / `"Usuario no existe"` |
| **403** | `AuthGuard`: rol insuficiente. `ensureNotSistemaEntity`: entidad marcada como del sistema | No | `"No tienes permisos"` / `"Producto marcado como del sistema y no puede ser modificado o eliminado"` |
| **404** | Recurso inexistente o soft-deleted (entidad, usuario, marca/línea/presentación/superlínea relacionada) | No | `"Producto con ID 5, no existe o fue eliminada"` |
| **409** | Conflicto de denominación/código (pre-chequeo); relaciones activas que impiden eliminar; `ER_DUP_ENTRY` de MySQL en caminos que pasan la instancia `QueryFailedError` | No | `"La denominación 'x' ya está en uso"` / `"No se puede eliminar la marca porque está asociada a productos activos."` |
| **500** | Errores de base de datos envueltos en `DatabaseConnectionException`; `Error` plano de dominio; `InternalServerErrorException` | No | `"Error inesperado en la base de datos."` / `"Producto en estado inválido"` |
| **422** | **No se usa** en este módulo | — | — |

---

## 5. Errores por endpoint

### 5.0 Errores transversales (aplican a casi todos los endpoints)

Todos los controladores de Producto, Línea, Superlínea, Marca y Presentación usan `@UseGuards(AuthGuard)` y `@Roles(...)`. El `AuthGuard` (`src/modules/gestion-usuario/auth/auth.guard.ts`) produce:

| Status | Message literal | Trigger |
| --- | --- | --- |
| 401 | `Token no encontrado` | Falta el header `Authorization` |
| 401 | `Token inválido` | Falló `jwtService.verify` (token malformado/expirado) |
| 401 | `Usuario no existe` | El `sub` del token no corresponde a un usuario |
| 403 | `No tienes permisos` | El usuario no tiene ninguno de los roles exigidos por `@Roles` |

`producto-operacion` **no** usa `AuthGuard` ni `@Roles`: no produce 401/403.

**Errores de validación (400 con `fieldErrors`)** pueden aparecer en cualquier endpoint con `@Body()` o `@Query()` tipado, según el DTO (ver sección 6).

**Errores 500 de base de datos:** el envelope expone `"Error inesperado en la base de datos."` cuando el error se envuelve como `DatabaseConnectionException` con un argumento que **no** es una instancia de `QueryFailedError` (ver sección 7.3). En los caminos sin envoltura puede filtrarse el mensaje crudo (ver Anexo de hallazgos).

### 5.1 Producto — `/api/producto` (15 endpoints)

| # | Método y ruta | DTO de entrada | Errores específicos |
| --- | --- | --- | --- |
| 1 | `POST /api/producto` | `CreateProductoDto` | **400** dominio intrínseco (sección 7.1); pipes `"La denominación debe ser una cadena."` / `"La denominación no puede estar vacía."` / `"El código del proveedor debe ser una cadena."`. **404** entidad relacionada: `Marca con ID {id}, no existe o fue eliminada`, `Línea con ID {id}, no existe o fue eliminada`, `Presentación con ID {id} no encontrada o eliminada.`, `Usuario con ID {id} no encontrado`. **409** `La denominación '{denominacion}' ya está en uso`, `El código '{codigoProveedor}' ya está en uso`. **500** `Error inesperado en la base de datos.` |
| 2 | `GET /api/producto/find-all-for-marcas/select` | `DenominacionBusquedaDto` | Pipe search; **500** |
| 3 | `GET /api/producto/find-all-for-lineas/select` | `DenominacionBusquedaDto` | Pipe search; **500** |
| 4 | `GET /api/producto/search-by-rapido` | `SearchProductoRapidoDto` | Pipe search; **500** |
| 5 | `GET /api/producto/search-by` | `SearchProductoPaginationWithDto` | Pipe search; **500** (con posible fuga de mensaje crudo, ver Anexo) |
| 6 | `GET /api/producto/search-by-denominacion` | `PaginationWithDenominacionDto` | **500** |
| 7 | `GET /api/producto/search-by-superlinea` | `SearchProductoSuperlineaDto` | **500** |
| 8 | `GET /api/producto/marca/:id` | `ParseIntPipe` | **400** `Validation failed (numeric string is expected)`; **404** `Marca con ID {id}, no existe o fue eliminada` (se usa el `id` del producto recibido) |
| 9 | `GET /api/producto/linea/:id` | `ParseIntPipe` | **400** `Validation failed (numeric string is expected)`; **404** `Línea con ID {id}, no existe o fue eliminada` (se usa el `id` del producto recibido) |
| 10 | `GET /api/producto/:id` | `ParseIntPipe` | **400** `Validation failed (numeric string is expected)`; **404** `Producto con ID {id}, no existe o fue eliminada` |
| 11 | `PUT /api/producto/:id` | `UpdateProductoDto` + `ParseIntPipe` | **400** validación/dominio; **404** `Producto con ID {id}, no existe o fue eliminada`; **500** `Producto en estado inválido` (si faltan `lineaId`/`marcaId`/`presentacionId`); posibles conflictos por `ER_DUP_ENTRY` (ver 7.3) |
| 12 | `DELETE /api/producto/:id?usuarioId=` | `ParseIntPipe` (id y usuarioId) | **400** `Validation failed (numeric string is expected)`; **403** `Producto marcado como del sistema y no puede ser modificado o eliminado`; **404** `Producto con ID {id}, no existe o fue eliminada`, `Usuario con ID {usuarioId} no encontrado.`, `Entidad  ya eliminada.` (doble espacio); **500** `Error inesperado en la base de datos.` |
| 13 | `POST /api/producto/actualizar-precios` | `ActualizacionPrecioDto` | **400** `No se pudo identificar al usuario autenticado para la actualización.`; **404** `Usuario no encontrado.`, `No se encontraron productos para actualizar.`; **500** errores de `Producto` (ver 7.2) |
| 14 | `GET /api/producto/:id/audit` | `ParseIntPipe` | **400** `Validation failed (numeric string is expected)`; **404** `Producto con ID {id}, no existe o fue eliminada` |
| 15 | `GET /api/producto/:id/historial-precios` | `PaginationDto` + `ParseIntPipe` | **400** validación de paginación / ParseIntPipe; **404** `Producto con ID {id}, no existe o fue eliminada`; **500** `Error inesperado en la base de datos.` |

Ejemplo 404 (endpoint 10), confirmado por `producto.http.int-spec.ts` (`res.body.message` contiene `"no existe"`):

```json
{
  "statusCode": 404,
  "timestamp": "2026-09-23T15:00:00.000Z",
  "path": "/api/producto/999999/historial-precios",
  "message": "Producto con ID 999999, no existe o fue eliminada"
}
```

### 5.2 Línea — `/api/linea` (8 endpoints)

| # | Método y ruta | DTO de entrada | Errores específicos |
| --- | --- | --- | --- |
| 1 | `POST /api/linea` | `CreateLineaDto` | **400** dominio intrínseco (sección 7.1); **404** `SuperLínea con ID {id} no encontrada o eliminada.`; **409** `Denominación ya en uso o esta eliminada.`; **500** `Error inesperado en la base de datos.` |
| 2 | `GET /api/linea/search-by` | `PaginationWithDenominacionDto` | **500** |
| 3 | `GET /api/linea/select` | `SelectLineaDto` | **500** |
| 4 | `GET /api/linea/:id` | `ParseIntPipe` | **400** ParseIntPipe; **404** `Línea con ID {id}, no existe o fue eliminada` |
| 5 | `GET /api/linea/find-all-for-superlinea/select` | `SelectLineaDto` | Pipe search; **500** |
| 6 | `PUT /api/linea/:id` | `UpdateLineaDto` + `ParseIntPipe` | **400** dominio; **403** `Linea marcado como del sistema y no puede ser modificado o eliminado`; **404** `Línea con ID {id}, no existe o fue eliminada`; **409** `Denominación ya en uso o esta eliminada.` |
| 7 | `DELETE /api/linea/:id?usuarioId=` | `ParseIntPipe` (id y usuarioId) | **400** ParseIntPipe; **403** `Linea marcado como del sistema y no puede ser modificado o eliminado`; **404** `Línea con ID {id}, no existe o fue eliminada`, `Usuario con ID {usuarioId} no encontrado.`; **409** `No se puede eliminar la marca porque está asociada a productos activos.` (literal tal cual, aunque es Línea); **500** |
| 8 | `GET /api/linea/:id/audit` | `ParseIntPipe` | **400** ParseIntPipe; **404** `Linea con ID {id} no encontrado.` (la auditoría devuelve `null` y el servicio lanza `NotFoundException`) |

### 5.3 Superlínea — `/api/superlinea` (7 endpoints)

| # | Método y ruta | DTO de entrada | Errores específicos |
| --- | --- | --- | --- |
| 1 | `POST /api/superlinea` | `CreateSuperLineaDto` | **400** dominio intrínseco; **409** `Denominación ya en uso.`; **500** (posible fuga cruda, ver Anexo) |
| 2 | `GET /api/superlinea/search-by` | `PaginationWithDenominacionDto` | **500** |
| 3 | `GET /api/superlinea/select` | `SelectSuperLineaDto` | **500** |
| 4 | `GET /api/superlinea/:id/audit` | `ParseIntPipe` | **400** ParseIntPipe; **404** `SuperLínea con ID {id} no encontrada.` |
| 5 | `GET /api/superlinea/:id` | `ParseIntPipe` | **400** ParseIntPipe; **404** `SuperLínea con ID {id} no encontrada.` |
| 6 | `PUT /api/superlinea/:id` | `UpdateSuperLineaDto` + `ParseIntPipe` | **400** dominio; **404** `SuperLínea con ID {id} no encontrada.` / `SuperLínea con ID {id} no encontrada.` (adapter); **409** `Denominación ya en uso.` |
| 7 | `DELETE /api/superlinea/:id?usuarioId=` | `ParseIntPipe` (id y usuarioId) | **400** ParseIntPipe; **404** `SuperLínea con ID {id} no encontrada.`, `Usuario con ID {usuarioId} no encontrado.`; **409** `No se puede eliminar la superlínea porque está asociada a líneas activas.` |

> **Sin `ensureNotSistemaEntity`:** a diferencia de Marca/Línea/Producto, Superlínea **no** valida entidad del sistema en actualizar/eliminar, por lo que no produce 403.

### 5.4 Marca — `/api/marca` (6 endpoints)

| # | Método y ruta | DTO de entrada | Errores específicos |
| --- | --- | --- | --- |
| 1 | `POST /api/marca` | `CreateMarcaDto` | **400** dominio intrínseco; **409** `Denominación ya en uso.`; **500** `Error inesperado en la base de datos.` |
| 2 | `GET /api/marca/search-by` | `PaginationWithDenominacionDto` | **500** |
| 3 | `GET /api/marca/:id` | `ParseIntPipe` | **400** ParseIntPipe; **404** `Marca con ID {id}, no existe o fue eliminada` |
| 4 | `PUT /api/marca/:id` | `UpdateMarcaDto` + `ParseIntPipe` | **400** dominio; **403** `Marca marcado como del sistema y no puede ser modificado o eliminado`; **404** `Marca con ID {id}, no existe o fue eliminada`; **409** `Denominación ya en uso.` |
| 5 | `DELETE /api/marca/:id?usuarioId=` | `ParseIntPipe` (id y usuarioId) | **400** ParseIntPipe; **403** `Marca marcado como del sistema y no puede ser modificado o eliminado`; **404** `Marca con ID {id}, no existe o fue eliminada`, `Usuario con ID {usuarioId} no encontrado.`; **409** `No se puede eliminar la marca porque está asociada a productos activos.` |
| 6 | `GET /api/marca/:id/audit` | `ParseIntPipe` | **400** ParseIntPipe; **404** `Marca con ID {id} no encontrado.` (la auditoría devuelve `null` y el servicio lanza `NotFoundException`) |

Evidencia: `marca.http.int-spec.ts` afirma `POST /marca` con denominación de 256 caracteres → **400**; `GET /marca/{id}` de una marca eliminada → **404** con `message` que contiene `"no existe"`.

### 5.5 Presentación — `/api/presentacion` (7 endpoints)

> Submódulo presente en `gestion-productos` aunque no listado en el pedido original; se documenta para completitud.

| # | Método y ruta | DTO de entrada | Errores específicos |
| --- | --- | --- | --- |
| 1 | `POST /api/presentacion` | `CreatePresentacionDto` | **400** dominio intrínseco; **409** `Denominación ya en uso.`; **500** (posible fuga cruda) |
| 2 | `GET /api/presentacion/search-by` | `PaginationWithDenominacionDto` | **500** |
| 3 | `GET /api/presentacion/select` | `SelectPresentacionDto` | **500** |
| 4 | `GET /api/presentacion/:id/audit` | `ParseIntPipe` | **400** ParseIntPipe; **404** `Presentación con ID {id} no encontrada.` |
| 5 | `GET /api/presentacion/:id` | `ParseIntPipe` | **400** ParseIntPipe; **404** `Presentación con ID {id} no encontrada.` |
| 6 | `PUT /api/presentacion/:id` | `UpdatePresentacionDto` + `ParseIntPipe` | **400** dominio; **404** `Presentación con ID {id} no encontrada.`; **409** `Denominación ya en uso.` |
| 7 | `DELETE /api/presentacion/:id?usuarioId=` | `ParseIntPipe` (id y usuarioId) | **400** ParseIntPipe; **404** `Presentación con ID {id} no encontrada.`, `Usuario con ID {usuarioId} no encontrado.`; **409** `No se puede eliminar la presentación porque está asociada a productos activos.` |

### 5.6 Producto-Operación — `/api/producto-operacion` (5 endpoints)

Sin `AuthGuard` ni `@Roles`. Implementación provisional: los métodos del servicio devuelven strings.

| # | Método y ruta | DTO de entrada | Errores específicos |
| --- | --- | --- | --- |
| 1 | `POST /api/producto-operacion` | `CreateProductoOperacionDto` | **400** validación (sección 6.10) |
| 2 | `GET /api/producto-operacion` | — | (solo 500 genéricos) |
| 3 | `GET /api/producto-operacion/:id` | `@Param('id') id: string` (sin `ParseIntPipe`) | No valida el id; `+id` NaN no dispara error |
| 4 | `PATCH /api/producto-operacion/:id` | `UpdateProductoOperacionDto` | **400** validación |
| 5 | `DELETE /api/producto-operacion/:id` | `@Param('id') id: string` (sin `ParseIntPipe`) | No valida el id |

---

## 6. Errores de validación por DTO

Todos estos mensajes se exponen dentro de `fieldErrors[].messages` con status **400** y `message: "Bad Request Exception"`. Los campos opcionales usan `IsOptionalWhenUndefined` (`ValidateIf((_, v) => v !== undefined)`): si el campo se omite no se valida; si llega `null`, **sí** se valida.

> Cuando un decorador de class-validator no declara `message` propio, el frontend recibirá el mensaje por defecto **en inglés** (p. ej. `observacion must be a string`). Se indican abajo como `(default EN)`.

### 6.1 `CreateProductoDto`

| Campo | Mensajes exactos |
| --- | --- |
| `denominacion` | `La denominación debe ser una cadena de texto.` · `La denominación no puede estar vacía.` · `La denominación no puede superar los 200 caracteres.` · `La denominación contiene caracteres inválidos.` |
| `observacion` | `observacion must be a string` (default EN) |
| `codigoProveedor` | `codigoProveedor must be a string` (default EN) |
| `codigoBarra` | `codigoBarra must be a string` (default EN) |
| `codigoReferencia` | `codigoReferencia must be a string` (default EN) |
| `ubicacion` | `ubicacion must be a string` (default EN) |
| `utilizaStockMinimo` | `utilizaStockMinimo debe ser un valor booleano.` |
| `utilizaPack` | `utilizaPack debe ser un valor booleano.` |
| `cantidadPorPack` | `La cantidad por pack debe ser un número entero positivo.` (solo si `utilizaPack === true`) |
| `costoEnDolar` | `costoEnDolar debe ser un valor booleano.` |
| `destacado` | `destacado debe ser un valor booleano.` |
| `envioGratis` | `envioGratis debe ser un valor booleano.` |
| `costo` | `El costo es obligatorio.` · `El costo debe ser un número.` · `El costo debe ser un valor monetario válido con hasta 5 decimales.` |
| `porcentaje` | `El porcentaje es obligatorio.` · `El porcentaje debe ser un número.` · `El porcentaje debe ser mayor que 0.` · `El porcentaje debe respetar el formato decimal válido con hasta 2 decimales.` |
| `stock` | `El stock es obligatorio.` · `El stock debe ser un número.` · `El stock debe ser mayor que 0.` · `El stock debe respetar el formato decimal válido con hasta 3 decimales.` |
| `stockMinimo` | `El stock mínimo es obligatorio.` · `El stock mínimo debe ser un número.` · `El stock mínimo debe ser mayor que 0.` · `El stock mínimo debe respetar el formato decimal válido con hasta 3 decimales.` |
| `lineaId` | `La línea es obligatoria.` · `La línea debe ser un número entero positivo.` |
| `marcaId` | `La marca es obligatoria.` · `La marca debe ser un número entero positivo.` |
| `presentacionId` | `La presentación es obligatoria.` · `La presentación debe ser un número entero positivo.` |
| `costoDolar` | `El costo en dólares debe ser un número.` · `El costo en dólares debe ser un valor monetario válido con hasta 5 decimales.` |
| `precio` | `El precio debe ser un número.` · `El precio debe ser un valor monetario válido con hasta 5 decimales.` |
| `alicuotaIva` | `tipo debe ser ALICUOTA_0, ALICUOTA_105, ALICUOTA_21 o ALICUOTA_27.` |
| `usuarioCreatedId` | `El usuarioCreatedId es obligatorio.` · `El usuarioCreatedId debe ser un número entero positivo.` |

### 6.2 `UpdateProductoDto`

Igual que `CreateProductoDto` para los campos compartidos, con estas diferencias:

| Campo | Mensajes exactos |
| --- | --- |
| `sistema` | `sistema debe ser un valor booleano.` |
| `alicuotaIva` | Opcional; mismo mensaje `tipo debe ser ALICUOTA_0, ALICUOTA_105, ALICUOTA_21 o ALICUOTA_27.` |
| `usuarioUpdatedId` | `El usuarioUpdatedId es obligatorio.` · `El usuarioUpdatedId debe ser un número entero positivo.` |
| `utilizaStockMinimo`, `utilizaPack`, `costoEnDolar`, `destacado`, `envioGratis` | Opcionales; mismos mensajes `... debe ser un valor booleano.` |
| `denominacion`, `costo`, `porcentaje`, `stock`, `stockMinimo`, `lineaId`, `marcaId`, `presentacionId` | Obligatorios con los mismos mensajes que en `CreateProductoDto` |
| `observacion`, `codigoProveedor`, `codigoBarra`, `codigoReferencia`, `ubicacion` | Default EN |

### 6.3 `CreateLineaDto`

| Campo | Mensajes exactos |
| --- | --- |
| `denominacion` | `La denominación debe ser una cadena de texto.` · `La denominación no puede estar vacía.` · `La denominación no puede superar los 255 caracteres.` · `La denominación solo puede contener letras, números y espacios.` |
| `stockMinimo` | `El stock mínimo debe ser un número.` · `El stock mínimo debe respetar el formato decimal válido con hasta 3 decimales.` |
| `utilizaStockMinimo` | `utilizaStockMinimo debe ser un valor booleano.` |
| `observacion` | `observacion must be a string` (default EN) |
| `usuarioCreatedId` | `El usuarioCreatedId es obligatorio.` · `El usuarioCreatedId debe ser un número entero positivo.` |
| `superLineaId` | `El superLineaId es obligatorio.` · `El superLineaId debe ser un número entero positivo.` |

### 6.4 `UpdateLineaDto`

| Campo | Mensajes exactos |
| --- | --- |
| `denominacion` | Opcional; mismos mensajes (255 / letras-números-espacios) |
| `stockMinimo` | Opcional; `El stock mínimo debe ser un número.` · `El stock mínimo debe respetar el formato decimal válido con hasta 3 decimales.` |
| `utilizaStockMinimo` | Opcional; `utilizaStockMinimo debe ser un valor booleano.` |
| `observacion` | Opcional; `observacion must be a string` (default EN) |
| `usuarioUpdatedId` | `El usuarioUpdatedId es obligatorio.` · `El usuarioUpdatedId debe ser un número entero positivo.` |
| `superLineaId` | Opcional; `El superLineaId debe ser un número entero positivo.` |

### 6.5 `CreateMarcaDto` / `UpdateMarcaDto`

| Campo | Mensajes exactos |
| --- | --- |
| `denominacion` (create, obligatorio) | `La denominación debe ser una cadena de texto.` · `La denominación no puede estar vacía.` · `La denominación no puede superar los 255 caracteres.` · `La denominación solo puede contener letras, números y espacios.` |
| `denominacion` (update, opcional) | Mismos mensajes |
| `observacion` | `observacion must be a string` (default EN) |
| `usuarioCreatedId` (create) | `El usuarioCreatedId es obligatorio.` · `El usuarioCreatedId debe ser un número entero positivo.` |
| `usuarioUpdatedId` (update) | `El usuarioUpdatedId es obligatorio.` · `El usuarioUpdatedId debe ser un número entero positivo.` |

### 6.6 `CreateSuperLineaDto` / `UpdateSuperLineaDto`

| Campo | Mensajes exactos |
| --- | --- |
| `denominacion` | `La denominación debe ser una cadena de texto.` · `La denominación no puede estar vacía.` · `La denominación no puede superar los 255 caracteres.` · `La denominación solo puede contener letras, números y espacios.` |
| `observacion` | `observacion must be a string` (default EN) |
| `usuarioCreatedId` (create) | `El usuarioCreatedId es obligatorio.` · `El usuarioCreatedId debe ser un número entero positivo.` |
| `usuarioUpdatedId` (update) | `El usuarioUpdatedId es obligatorio.` · `El usuarioUpdatedId debe ser un número entero positivo.` |

### 6.7 `CreatePresentacionDto` / `UpdatePresentacionDto`

| Campo | Mensajes exactos |
| --- | --- |
| `denominacion` | `La denominación debe ser una cadena de texto.` · `La denominación no puede estar vacía.` · `La denominación no puede superar los 255 caracteres.` · `La denominación solo puede contener letras, números, espacios, puntos, guiones y barras.` |
| `observacion` | `observacion must be a string` (default EN) |
| `usuarioCreatedId` (create) | `El usuarioCreatedId es obligatorio.` · `El usuarioCreatedId debe ser un número entero positivo.` |
| `usuarioUpdatedId` (update) | `El usuarioUpdatedId es obligatorio.` · `El usuarioUpdatedId debe ser un número entero positivo.` |

### 6.8 `SelectLineaDto` / `SelectSuperLineaDto` / `SelectPresentacionDto` / `DenominacionBusquedaDto`

| Campo | Mensajes exactos |
| --- | --- |
| `denominacion` (opcional) | `La denominación debe ser una cadena de texto.` (`Select*`; usa `IsOptionalWhenUndefined`) · `denominacion must be a string` (`DenominacionBusquedaDto`, sin mensaje propio) |

### 6.9 DTOs de búsqueda de Producto

`SearchProductoRapidoDto`

| Campo | Mensajes exactos |
| --- | --- |
| `codigo` | `codigo must be a string` (default EN) |
| `exacto` | `exacto debe ser un valor booleano.` |
| `skip` | `skip debe ser un número entero.` · `skip debe ser un número entero positivo o 0` |
| `take` | `take debe ser un número entero.` · `take debe ser un número entero mayor que 0` |

`SearchProductoPaginationWithDto`

| Campo | Mensajes exactos |
| --- | --- |
| `denominacion`, `codigoProveedor`, `codigoReferencia` | `... must be a string` (default EN, cada campo con su nombre) |
| `codReferenciaExacto` | `codReferenciaExacto debe ser un valor booleano.` |
| `codProveedorExacto` | `codProveedorExacto debe ser un valor booleano.` |
| `skip` | `skip debe ser un número entero.` · `skip debe ser un número entero positivo o 0` |
| `take` | `take debe ser un número entero.` · `take debe ser un número entero mayor que 0` |
| `marcaId` | `La marca debe ser un número entero positivo.` |
| `lineaId` | `La línea debe ser un número entero positivo.` |
| `proveedorId` | `El proveedor debe ser un número entero positivo.` |
| `conStock` | `conStock debe ser un valor booleano.` |

`SearchProductoSuperlineaDto`

| Campo | Mensajes exactos |
| --- | --- |
| `superLineaId` | `El superLineaId debe ser un número entero.` · `El superLineaId debe ser un número entero positivo.` |
| `skip` | `skip debe ser un número entero.` · `skip debe ser un número entero positivo o 0` |
| `take` | `take debe ser un número entero.` · `take debe ser un número entero mayor que 0` |

`ActualizacionPrecioDto`

| Campo | Mensajes exactos |
| --- | --- |
| `lineaId` | `La línea debe ser un número entero positivo.` (opcional) |
| `tipoAjuste` | `El tipo de ajuste debe ser PORCENTAJE o MONTO_FIJO.` |
| `operacion` | `La operación debe ser AUMENTO o DISMINUCION.` |
| `valor` | `El valor del ajuste debe ser un número.` · `El valor del ajuste debe ser mayor que 0.` · `El valor del ajuste debe respetar el formato monetario válido con hasta 5 decimales.` |

### 6.10 `CreateProductoOperacionDto` / `UpdateProductoOperacionDto`

| Campo | Mensajes exactos |
| --- | --- |
| `productoId` (create obligatorio) | `El productoId es obligatorio.` · `El productoId debe ser un número entero positivo.` |
| `productoId` (update opcional) | `El productoId debe ser un número entero positivo.` |
| `operacionId` (create obligatorio) | `El operacionId es obligatorio.` · `El operacionId debe ser un número entero positivo.` |
| `operacionId` (update opcional) | `El operacionId debe ser un número entero positivo.` |
| `tipoOperacion` (create) | `El tipo de operación es obligatorio.` · `El tipo de operación debe ser una cadena de texto.` · `El tipo de operación no puede estar vacío.` · `El tipo de operación no puede superar los 255 caracteres.` |
| `tipoOperacion` (update) | `El tipo de operación debe ser una cadena de texto.` · `El tipo de operación no puede estar vacío.` · `El tipo de operación no puede superar los 255 caracteres.` |

### 6.11 DTOs comunes reutilizados

`PaginationWithDenominacionDto` (usado por search-by de Marca, Línea, Superlínea, Presentación y por `search-by-denominacion` de Producto)

| Campo | Mensajes exactos |
| --- | --- |
| `denominacion` | `denominacion must be a string` (default EN) |
| `skip` | `skip must be an integer number` (default EN) · `skip debe ser un número entero positivo o 0` |
| `take` | `take must be an integer number` (default EN) · `take debe ser un número entero mayor que 0` |
| `incluirEliminados` | `incluirEliminados must be a boolean` (default EN) |

`PaginationDto` (usado por `GET /api/producto/:id/historial-precios`)

| Campo | Mensajes exactos |
| --- | --- |
| `skip` | `skip must be a number conforming to the specified constraints` (default EN) |
| `take` | `take must be a number conforming to the specified constraints` (default EN) |

`ReferenciaDto` (solo presente en DTOs de **respuesta**; no recibe validación de entrada por HTTP en este módulo, por lo que sus mensajes no se observan en respuestas de error).

### 6.12 DTOs de respuesta (no generan `fieldErrors`)

`GetProductoDto`, `ProductoDto`, `LineaDto`, `MarcaDto`, `SuperLineaDto`, `PresentacionDto`, `CambioPrecioDto`, `SearchInformacionProductoDto` y `UpdatePrecioDto` se usan como esquemas de **salida** o en rutas internas; sus decoradores no se aplican a bodies/query de los endpoints documentados aquí. Se listan por completitud, pero **no** producen errores de validación observables en el contrato HTTP actual.

---

## 7. Errores de dominio / reglas de negocio

### 7.1 Validaciones intrínsecas (status 400, `BadRequestException`)

Comparten estas reglas `MarcaIntrinsicValidationService`, `SuperLineaIntrinsicValidationService`, `PresentacionIntrinsicValidationService`, `LineaIntrinsicValidationService` y `ProductoIntrinsicValidationService`.

**Marca / Superlínea / Presentación** (`validarDatosBasicos`):

| Mensaje exacto | Trigger |
| --- | --- |
| `La denominación es obligatoria` | `denominacion` ausente con `requerirEstadoCompleto` |
| `La denominación debe ser una cadena no vacía` | `denominacion` no string o vacía |
| `La denominación no puede superar 255 caracteres` | longitud > 255 |
| `El usuarioCreatedId es requerido` | ausente con `requerirEstadoCompleto` |
| `El usuarioCreatedId debe ser un número entero positivo` | no entero positivo |
| `El usuarioUpdatedId es requerido` | ausente (cuando aplica requerido) |
| `El usuarioUpdatedId debe ser un número entero positivo` | no entero positivo |

**Línea** (además de los anteriores):

| Mensaje exacto | Trigger |
| --- | --- |
| `La SuperLínea es requerida` | `superLineaId` ausente con `requerirEstadoCompleto` |
| `El superLineaId debe ser un número entero positivo` | no entero positivo |
| `El stock mínimo debe ser un número finito` | `stockMinimo` no finito |
| `El stock mínimo debe ser mayor o igual a 0` | `stockMinimo < 0` |
| `El stock mínimo debe estar dentro del rango de cantidad permitido` | fuera de rango |
| `utilizaStockMinimo debe ser un valor booleano` | no booleano |

**Producto** (`ProductoIntrinsicValidationService`):

| Mensaje exacto | Trigger |
| --- | --- |
| `La denominación es obligatoria` | vacía/no string |
| `La denominación no puede superar 200 caracteres` | longitud > 200 |
| `Marca ID es requerido y debe ser válido` | `marcaId` no entero positivo |
| `Línea ID es requerido y debe ser válido` | `lineaId` no entero positivo |
| `Presentación ID es requerido y debe ser válido` | `presentacionId` no entero positivo |
| `El precio Mayorista no puede superar el precio Cliente` | `pm > pc` |
| `El precio Cliente no puede superar el precio Ocasional` | `pc > po` |
| `El precio Mayorista no puede superar el precio Ocasional` | `pm > po` |
| `El {nombre} no puede ser negativo` (nombre ∈ `precio mayorista`/`precio cliente`/`precio ocasional`) | precio opcional no finito o < 0 |
| `La alícuota IVA debe estar entre 0 y 100` | fuera de rango |
| `El costo es requerido` | ausente con estado completo |
| `El costo debe ser un número finito` | no finito |
| `El costo debe ser mayor o igual a 0` | < 0 |
| `El costo debe estar dentro del rango monetario permitido` | fuera de rango |
| `El margen es requerido` | `porcentaje` ausente con estado completo |
| `El margen debe ser un número finito` | no finito |
| `El margen debe ser mayor que 0` | ≤ 0 |
| `El margen debe estar dentro del rango porcentual permitido` | fuera de rango |
| `El stockActual es requerido` | ausente con estado completo |
| `El stockActual debe ser un número finito` | no finito |
| `El stockActual debe ser mayor que 0` | ≤ 0 |
| `El stockActual debe estar dentro del rango de cantidad permitido` | fuera de rango |
| `El stockMínimo es requerido` | ausente con estado completo |
| `El stockMínimo debe ser un número finito` | no finito |
| `El stockMínimo debe ser mayor que 0` | ≤ 0 |
| `El stockMínimo debe estar dentro del rango de cantidad permitido` | fuera de rango |
| `La cantidad por pack debe ser un número entero positivo.` | `utilizaPack === true` y `cantidadPorPack` inválido |

**Regla de entidad del sistema** (status 400, `ProductoValidationService` y `ProductoValidator`):

| Mensaje exacto | Trigger |
| --- | --- |
| `{tipo} {id} está marcada como del sistema y no puede usarse` | marca o línea con `sistema === 1` al crear/actualizar producto (`ProductoValidationService`) |
| `{tipo} {id} está marcada como del sistema y no puede usarse.` | variante con punto final (`ProductoValidator.assertEntidadValida`) |

### 7.2 Reglas de cambio de precio (status 500 vía `Error` plano)

Los métodos de `Producto` (`src/modules/gestion-productos/producto/domain/entities/producto.entity.ts`) lanzan `Error` **plano** (no `HttpException`). El filtro global los mapea a **500** con `message` igual al texto del error. Son alcanzables principalmente desde `POST /api/producto/actualizar-precios` y `PUT /api/producto/:id`:

| Mensaje exacto | Trigger |
| --- | --- |
| `El valor del ajuste debe ser mayor que 0.` | monto/porcentaje no finito o ≤ 0 |
| `El precio final debe ser mayor que 0.` | precio resultante ≤ 0 (p. ej. disminución > 100%) |
| `El costo final debe ser mayor que 0.` | costo recalculado ≤ 0 |
| `El motivo del cambio de precio es obligatorio.` | `motivo` ausente |
| `El nuevo precio debe ser mayor que 0.` | precio no finito o ≤ 0 |
| `El último cambio de precio no coincide con el precio actual del producto.` | inconsistencia de historial |

> En `PUT /api/producto/:id` estos errores son capturados por el adapter y reemplazados por `DatabaseConnectionException` → terminan como **500** `"Error inesperado en la base de datos."` (se pierde el mensaje original). En `actualizar-precios` no se envuelven, por lo que el mensaje del `Error` plano sí llega al cliente.

### 7.3 Errores de base de datos y conflictos

`DatabaseConnectionException` (`src/modules/common/exceptions/database-connection.exception.ts`) decide status/mensaje así:

| Condición del argumento | Status | `message` resultante |
| --- | --- | --- |
| Instancia de `QueryFailedError` con `DB_TYPE === 'mysql'` y `code === 'ER_DUP_ENTRY'` | **409** | `Error: El valor ingresado ya existe y debe ser único.` |
| Instancia de `QueryFailedError` con `DB_TYPE === 'postgres'` y `code === '23505'` | **409** | `Error: El valor ingresado ya existe y debe ser único.` |
| Instancia de `QueryFailedError`, otro código (mysql) | **500** | `Error en MySQL: {mensaje del error}` |
| Instancia de `QueryFailedError`, otro código (postgres) | **500** | `Error en PostgreSQL: {mensaje del error}` |
| Cualquier otro argumento cuyo mensaje incluya `ECONNREFUSED` | **500** | `Error: No se pudo conectar con la base de datos.` |
| **Cualquier otro caso** (incluye pasar un `string` como argumento) | **500** | `Error inesperado en la base de datos.` |

> **Hallazgo importante (verificado):** el constructor parte de `message = 'Error inesperado en la base de datos.'` y **solo** lo cambia si el argumento es una instancia de `QueryFailedError` o si el texto contiene `ECONNREFUSED`. Por eso, todas las llamadas del módulo que hacen `throw new DatabaseConnectionException('Error al conectar con la base de datos.')`, `'Error al guardar en la base de datos.'`, `'No se pudo crear la entidad en la base de datos.'`, etc. (argumento `string`) producen **500** con `message: "Error inesperado en la base de datos."`. Los textos literales pasados se descartan.

La única llamada del módulo que pasa una **instancia** de error es `producto.persistence-adapters.ts:216` (`throw new DatabaseConnectionException(error)` dentro de `update`). Por lo tanto, la detección de `ER_DUP_ENTRY` con status **409** solo es alcanzable de forma directa por ese camino (y aun así `ProductoService.update` pre-valida la denominación). El helper `handleDatabaseError` (`src/modules/common/query-builders/database-error.helper.ts`) también construye `DatabaseConnectionException` con argumentos `string`, por lo que sus mensajes detallados colapsan a `"Error inesperado en la base de datos."`.

### 7.4 Conflictos por reglas de relación

| Mensaje exacto | Status | Endpoint / trigger |
| --- | --- | --- |
| `La denominación '{denominacion}' ya está en uso` | 409 | `POST/PUT /api/producto` (`ProductoUniquenessValidator`) |
| `El código '{codigoProveedor}' ya está en uso` | 409 | `POST /api/producto` |
| `Denominación ya en uso.` | 409 | Marca, Superlínea, Presentación (create/update) |
| `Denominación ya en uso o esta eliminada.` | 409 | Línea (create/update) |
| `No se puede eliminar la marca porque está asociada a productos activos.` | 409 | `DELETE /api/marca/:id` y `DELETE /api/linea/:id` |
| `No se puede eliminar la superlínea porque está asociada a líneas activas.` | 409 | `DELETE /api/superlinea/:id` |
| `No se puede eliminar la presentación porque está asociada a productos activos.` | 409 | `DELETE /api/presentacion/:id` |

### 7.5 Errores 403 por entidad del sistema

`ensureNotSistemaEntity` (`src/modules/common/utils/atrituto-sistema.ts`). El literal fuente es `` `${entityName} marcado como del sistema y no puede ser modificado o eliminado` ``; la tabla muestra el valor resuelto según la entidad:

| Mensaje exacto | Endpoint / trigger |
| --- | --- |
| `Producto marcado como del sistema y no puede ser modificado o eliminado` | `DELETE /api/producto/:id` |
| `Marca marcado como del sistema y no puede ser modificado o eliminado` | `PUT/DELETE /api/marca/:id` |
| `Linea marcado como del sistema y no puede ser modificado o eliminado` | `PUT/DELETE /api/linea/:id` |

---

## 8. Notas para el frontend

1. **Distinguir validación 400 vs negocio 400.** El único caso con `fieldErrors` es el que produce el `ValidationPipe` (message `"Bad Request Exception"`). Las `BadRequestException` de dominio (p. ej. `"La denominación es obligatoria"`) llegan como 400 **sin** `fieldErrors`; el texto va en `message`.
2. **`fieldErrors` solo existe en errores de validación.** Nunca asumir su presencia en 401/403/404/409/500.
3. **`stack` y `details` solo en `development`.** En producción no existen. No usarlos para lógica de UI.
4. **`details` no aparece en errores de validación**, ni siquiera en desarrollo.
5. **Todos los errores comparten `statusCode`, `timestamp`, `path`.** `path` incluye el query string original.
6. **Reconocer 409:** puede venir de la regla de negocio (denominación/código duplicado, relaciones activas) o de `ER_DUP_ENTRY` (raro; ver 7.3). En ambos casos `message` es humano y mostrable.
7. **404 por soft-delete:** una entidad eliminada devuelve el mismo 404 que una inexistente. En Producto/Línea/Marca el mensaje es `"{Entidad} con ID {id}, no existe o fue eliminada"`; en Superlínea/Presentación, `"{Entidad} con ID {id} no encontrada."`.
8. **ParseIntPipe:** si el `:id` (o `usuarioId`) no es numérico, llega **400** con `message: "Validation failed (numeric string is expected)"`, sin `fieldErrors`.
9. **Recomendación de parseo:** leer primero `statusCode`; para 400, si `fieldErrors` es un array, mapear por `field`; si no, mostrar `message`. Para el resto, mostrar `message`.
10. **Cuidado con mensajes por defecto en inglés:** algunos campos opcionales (`observacion`, `codigo*`, `ubicacion`, `incluirEliminados`, paginación) emiten mensajes default de class-validator en inglés. Conviene un fallback genérico en la UI.

---

## Anexo A. Hallazgos, brechas y verificaciones

Estos puntos se documentan de forma explícita por honestidad de contrato; no se corrigió código.

1. **Fuga de error crudo en búsquedas de Producto con la base caída.** `ProductoPersistenceAdapter.findBy` (y varios métodos sin `try/catch`) no envuelven errores de base. El filtro global mapea excepciones no-HTTP a 500 con `exception.message`, por lo que el mensaje crudo del driver podría filtrarse. El test `producto.busqueda-general.http.int-spec.ts` espera `"Error inesperado en la base de datos."` y está documentado como **en rojo** (contrato objetivo, no actual). `(comportamiento actual: mensaje crudo; no verificado con ejecución por falta de Docker)`
2. **`DatabaseConnectionException` descarta los mensajes pasados como `string`** (ver 7.3). Consecuencia: la mayoría de los errores de persistencia del módulo muestran `"Error inesperado en la base de datos."`, y la detección `ER_DUP_ENTRY` → 409 queda casi inalcanzable.
3. **Superlínea y Presentación no envuelven errores en `create`.** Sus adapters hacen `repository.save(...)` sin `try/catch` y no usan `handleDatabaseError`, por lo que un fallo de base podría propagar un error no-HTTP (500 con mensaje crudo). `(no verificado con ejecución)`
4. **Métodos potencialmente muertos / inalcanzables por HTTP:** `ProductoRepository.findByIds` (`Error('Method not implemented.')`), `MarcaService.findByDenominacionFiltered` (`Error('Method not implemented.')`), `ProductoService.findByDenominacionCodigoProveedorFiltered`, `ProductoService.incrementarStock/decrementarStock` (usan `Error` plano). No están cableados a endpoints del módulo.
5. **Mensajes de NotImplemented no verificados por HTTP:** no se ejecutó ningún endpoint que los alcance; se listan como riesgo si se cablean a futuro.
6. **`GET /api/producto/marca/:id` y `GET /api/producto/linea/:id`** pasan el ID del producto a los servicios de Marca/Línea. El contrato de error observado usa el ID recibido en la ruta; el 404 resultante sería `Marca con ID {id}, no existe o fue eliminada` / `Línea con ID {id}, no existe o fue eliminada`. `(comportamiento deducido de la lectura; no verificado con ejecución)`
7. **404 distinto entre “por ID” y “/audit”.** En Producto y Marca, `GET /:id` obtiene el 404 de `EntityNotFoundException` (`"... con ID {id}, no existe o fue eliminada"`) porque el adapter `findOne` lanza al no encontrar. En cambio `GET /:id/audit` y `GET /linea/:id/audit` dependen de un `null` y lanzan `NotFoundException("... con ID {id} no encontrado.")`. Por eso `/api/marca/:id` y `/api/marca/:id/audit` exponen mensajes diferentes ante un recurso inexistente.
8. **Ramas `if (!entity) throw new NotFoundException(...)` en `*Service` son en su mayoría inalcanzables** cuando el repositorio subyacente lanza `EntityNotFoundException` antes de devolver `null` (Producto, Línea, Marca). Se conservan en el código, pero el mensaje observado suele ser el de `EntityNotFoundException`.

### Verificación de literales

Todos los literales entre backticks de las secciones 5, 6 y 7 fueron copiados de los archivos citados. Durante la redacción se releyó el archivo generado contra las fuentes. Los únicos casos que no son un literal estático son: (a) mensajes que interpolan variables (`{id}`, `{denominacion}`, `{codigoProveedor}`, `{tipo}`, `{campo}`, `{nombre}` y `` `${entityName}` ``), mostrados resueltos como ejemplo; (b) mensajes por defecto de class-validator, marcados `(default EN)`, que se generan en `node_modules/class-validator` y no como literales del repo; y (c) `"Validation failed (numeric string is expected)"` y `property {x} should not exist`, verificados en `node_modules/@nestjs/common/pipes/parse-int.pipe.js` y `node_modules/class-validator/cjs/validation/ValidationExecutor.js`.

---

## Anexo B. Mapa de archivos fuente relevantes

| Archivo | Rol |
| --- | --- |
| `src/main.ts` | Configuración global del `ValidationPipe` y registro del filtro |
| `src/swagger.config.ts` | `GLOBAL_API_PREFIX = 'api'` |
| `src/modules/common/filters/global-exception.filters.ts` | Envelope de error |
| `src/modules/common/validation/validation-error.factory.ts` | `RequestValidationException` + `normalizeValidationErrors` |
| `src/modules/common/exceptions/*.ts` | `EntityNotFoundException`, `EntityConflictException`, `DatabaseConnectionException` |
| `src/modules/common/query-builders/database-error.helper.ts` | `handleDatabaseError` |
| `src/modules/common/utils/atrituto-sistema.ts` · `.../validation/usuario-validator.ts` | Guards de dominio reutilizados |
| `src/modules/common/pipes/normalize-denominations*.pipe.ts` · `normalize-codigo-proveedor.pipe.ts` | Pipes con `BadRequestException` |
| `src/modules/gestion-usuario/auth/auth.guard.ts` | 401/403 |
| `src/modules/gestion-productos/**/dto/*.dto.ts` | Mensajes de validación |
| `src/modules/gestion-productos/**/domain/services/*validation*.ts` | Reglas intrínsecas (400) |
| `src/modules/gestion-productos/**/application/services/*.service.ts` | Conflictos/404/500 |
| `src/modules/gestion-productos/**/infraestructure/**` | Persistencia y errores de base |
