# Tareas: validar solicitudes de gestión de productos y preservar errores para clientes

Esta es la copia en español del plan de implementación de CR-001. El artefacto canónico de OpenSpec permanece en `openspec/changes/cr-001-gestion-productos-validation/tasks.md`.

## Estado de implementación

**En pausa por decisión explícita del proyecto.** Todas las tareas deben permanecer sin marcar y la implementación no debe comenzar hasta que el usuario reanude CR-001 explícitamente.

## Previsión de carga de revisión

| Campo | Valor |
|---|---|
| Líneas modificadas estimadas | 340–440 |
| Riesgo de superar el límite de 400 líneas | Medio |
| PR encadenados recomendados | No |
| División sugerida | Un único PR con tres unidades de implementación |
| Estrategia de entrega | Consultar ante riesgo (`ask-on-risk`) |
| Estrategia de encadenamiento | Pendiente |

Decisión necesaria antes de implementar: No  
PR encadenados recomendados: No  
Estrategia de encadenamiento: Pendiente  
Riesgo de superar el límite de 400 líneas: Medio

### Unidades de trabajo sugeridas

| Unidad | Objetivo | PR probable | Comando de prueba específico | Verificación en ejecución | Límite de reversión |
|---|---|---|---|---|---|
| 1 | Aplicar los contratos de escritura de gestión de productos | Único PR | Diferido: no se autorizaron pruebas para CR-001 | No aplica: las pruebas en ejecución están diferidas | Transformadores compartidos y cambios de DTO de escritura |
| 2 | Aplicar los contratos de consulta de productos | Único PR | Diferido: no se autorizaron pruebas para CR-001 | No aplica: las pruebas en ejecución están diferidas | Cambios en los tres DTO de búsqueda de productos |
| 3 | Preservar errores de validación estructurados | Único PR | Diferido: no se autorizaron pruebas para CR-001 | No aplica: las pruebas en ejecución están diferidas | Fábrica de excepciones, configuración del pipe global y cambios del filtro |

Las pruebas quedan diferidas para un cambio autorizado por separado. Estas tareas NO DEBEN crear ni modificar casos o archivos de prueba. La implementación también permanece en pausa hasta que se autorice su reanudación explícitamente.

## Fase 1: base compartida de validación

- [ ] 1.1 Crear `src/modules/gestion-productos/common/validation/request-value.transforms.ts` con normalización de strings que no lance excepciones, booleanos estrictos y conversión segura de fecha final inclusiva compartidas por los DTO de escritura y búsqueda.

## Fase 2: contratos de escritura de productos

- [ ] 2.1 Actualizar `src/modules/gestion-productos/producto/dto/create-producto.dto.ts` con el límite de 200 caracteres para denominación, transformaciones seguras, booleanos estrictos, decimales compatibles con persistencia, campos condicionales, valores de IVA, límites de strings y referencias positivas.
- [ ] 2.2 Simplificar `src/modules/gestion-productos/producto/dto/update-producto.dto.ts` para heredar parcialmente las reglas de creación y exigir un `usuarioUpdatedId` positivo.
- [ ] 2.3 Alinear en `src/modules/gestion-productos/producto/dto/update-precio.dto.ts` la validación numérica, la precisión, el margen persistido (`porcentaje`) y el usuario positivo, sin exponer ni reparar el flujo inactivo.
- [ ] 2.4 Actualizar `src/modules/gestion-productos/linea/dto/create-linea.dto.ts` y `src/modules/gestion-productos/linea/dto/update-linea.dto.ts` para manejar denominaciones de forma segura, admitir stock fraccionario no negativo, exigir condicionalmente el stock mínimo, aceptar booleanos estrictos y validar identificadores de auditoría positivos.
- [ ] 2.5 Actualizar `src/modules/gestion-productos/marca/dto/create-marca.dto.ts` y `src/modules/gestion-productos/marca/dto/update-marca.dto.ts` para manejar denominaciones de forma segura y validar identificadores de auditoría positivos.

## Fase 2A: contratos de búsqueda de productos

- [ ] 2.6 Actualizar `src/modules/gestion-productos/producto/dto/search-producto-rapido.dto.ts` para que `exacto` acepte solo las formas booleanas admitidas y la entrada inválida llegue a validación para producir un 400 controlado.
- [ ] 2.7 Actualizar `src/modules/gestion-productos/producto/dto/search-producto-pagination-with.dto.ts` para que los indicadores de coincidencia exacta sean estrictos y `conStock`, aunque opcional, omita solo la ausencia real y nunca una entrada inválida.
- [ ] 2.8 Actualizar `src/modules/gestion-productos/producto/dto/seach-informacion-producto.dto.ts` para que un `fechaHasta` inválido no lance errores ni se acepte silenciosamente, y un valor válido siga siendo inclusivo hasta el final del día UTC.

## Fase 3: contrato de errores de validación

- [ ] 3.1 Crear `src/modules/common/validation/validation-error.factory.ts` para convertir restricciones anidadas del validador en `message[]` deterministas y `fieldErrors` identificados por la ruta de la propiedad.
- [ ] 3.2 Configurar `src/main.ts` para usar la fábrica de excepciones de validación estructuradas sin modificar las opciones actuales del pipe global.
- [ ] 3.3 Actualizar `src/modules/common/filters/global-exception.filters.ts` para preservar los campos de respuesta de `HttpException` dentro de la envoltura existente y omitir información interna o de stack en producción.

## Fase 4: verificación sin pruebas

- [ ] 4.1 Ejecutar `yarn build` y resolver errores de compilación únicamente dentro de los archivos de implementación de CR-001.
- [ ] 4.2 Revisar `git diff --name-only` y `git diff --check`; confirmar que no cambió ningún archivo de prueba ni módulo fuera de alcance, y que no se introdujeron fórmulas, reglas de signo o comportamientos de actualización para el margen.
